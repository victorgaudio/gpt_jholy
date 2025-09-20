#!/bin/bash
# Script de inicialização otimizado para AnythingLLM no DigitalOcean
# Monitore o progresso com: sudo tail -f /var/log/cloud-init-output.log

set -e  # Parar execução em caso de erro

echo "=== Iniciando configuração do AnythingLLM ==="

# Atualizar sistema
echo "Atualizando sistema..."
apt-get update -y
apt-get upgrade -y

# Instalar dependências
echo "Instalando dependências..."
apt-get install -y \
    docker.io \
    docker-compose \
    curl \
    wget \
    unzip \
    htop \
    ufw \
    fail2ban

# Configurar usuário docker
usermod -aG docker root
usermod -aG docker ubuntu

# Iniciar serviços
systemctl enable docker
systemctl start docker
systemctl enable fail2ban
systemctl start fail2ban

# Configurar firewall básico
echo "Configurando firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 3001
ufw --force enable

# Configurar volume adicional (se existir)
echo "Configurando armazenamento..."
VOLUME_DEVICE="/dev/disk/by-id/scsi-0DO_Volume_anythingllm-production-storage"
MOUNT_POINT="/mnt/anythingllm-storage"

if [ -e "$VOLUME_DEVICE" ]; then
    echo "Volume adicional detectado, configurando..."
    mkdir -p $MOUNT_POINT

    # Verificar se já está formatado
    if ! blkid $VOLUME_DEVICE; then
        echo "Formatando volume..."
        mkfs.ext4 $VOLUME_DEVICE
    fi

    # Montar volume
    mount $VOLUME_DEVICE $MOUNT_POINT

    # Adicionar ao fstab para montagem automática
    echo "$VOLUME_DEVICE $MOUNT_POINT ext4 defaults,nofail,discard 0 0" >> /etc/fstab

    # Usar volume como storage
    STORAGE_PATH="$MOUNT_POINT/anythingllm"
else
    echo "Usando armazenamento local..."
    STORAGE_PATH="/home/anythingllm"
fi

# Criar diretórios necessários
mkdir -p $STORAGE_PATH
mkdir -p $STORAGE_PATH/documents
mkdir -p $STORAGE_PATH/vector-cache

# Configurar arquivo .env
echo "Configurando variáveis de ambiente..."
cat <<'EOF' > $STORAGE_PATH/.env
${env_content}
EOF

# Ajustar permissões
chown -R 1000:1000 $STORAGE_PATH
chmod -R 755 $STORAGE_PATH

# Baixar e executar AnythingLLM
echo "Baixando e iniciando AnythingLLM..."
docker pull mintplexlabs/anythingllm:latest

# Criar script de inicialização
cat <<'EOL' > /usr/local/bin/start-anythingllm.sh
#!/bin/bash
docker run -d \
  --name anythingllm \
  --restart unless-stopped \
  -p 3001:3001 \
  --cap-add SYS_ADMIN \
  -v STORAGE_PATH:/app/server/storage \
  -v STORAGE_PATH/.env:/app/server/.env \
  -e STORAGE_DIR="/app/server/storage" \
  mintplexlabs/anythingllm:latest
EOL

# Substituir STORAGE_PATH no script
sed -i "s|STORAGE_PATH|$STORAGE_PATH|g" /usr/local/bin/start-anythingllm.sh
chmod +x /usr/local/bin/start-anythingllm.sh

# Executar AnythingLLM
echo "Iniciando container AnythingLLM..."
bash /usr/local/bin/start-anythingllm.sh

# Aguardar inicialização
echo "Aguardando inicialização..."
sleep 30

# Verificar saúde da aplicação
echo "Verificando status da aplicação..."
for i in {1..10}; do
    if curl -f http://localhost:3001/api/ping > /dev/null 2>&1; then
        echo "✅ AnythingLLM está online!"
        break
    else
        echo "Tentativa $i/10 - Aguardando..."
        sleep 10
    fi
done

# Criar script de monitoramento
cat <<'EOF' > /usr/local/bin/monitor-anythingllm.sh
#!/bin/bash
# Script para verificar se o AnythingLLM está rodando

if ! docker ps | grep -q anythingllm; then
    echo "$(date): AnythingLLM não está rodando, reiniciando..."
    docker stop anythingllm 2>/dev/null || true
    docker rm anythingllm 2>/dev/null || true
    /usr/local/bin/start-anythingllm.sh
fi
EOF

chmod +x /usr/local/bin/monitor-anythingllm.sh

# Adicionar cron job para monitoramento
echo "*/5 * * * * /usr/local/bin/monitor-anythingllm.sh >> /var/log/anythingllm-monitor.log 2>&1" | crontab -

# Informações finais
EXTERNAL_IP=$(curl -s http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address)
echo "=== Configuração concluída ==="
echo "🌐 AnythingLLM está disponível em: http://$EXTERNAL_IP:3001"
echo "📁 Dados armazenados em: $STORAGE_PATH"
echo "🔍 Monitore logs com: sudo tail -f /var/log/anythingllm-monitor.log"
echo "🐳 Status do container: docker ps"
echo "🔧 Reiniciar manualmente: /usr/local/bin/start-anythingllm.sh"