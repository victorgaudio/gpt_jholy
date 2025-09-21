# 🛠️ Troubleshooting: Problemas e Soluções

## 📋 Visão Geral

Este documento consolida todos os problemas encontrados durante a migração Docker→Native + SSL, suas causas, soluções aplicadas e como prevenir/resolver rapidamente.

## 🔥 Problemas Críticos Encontrados

### **1. PM2 Environment Variables**

#### **Problema**
```bash
TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received undefined
    at Object.resolve (node:path:1169:7)
    at Object.<anonymous> (/opt/anythingllm-native/server/utils/files/index.js:9:12)
```

#### **Causa**
- PM2 não carregava arquivo `.env.production` corretamente
- Variable `STORAGE_DIR` chegava como `undefined`
- AnythingLLM tentava resolver path com valor undefined

#### **Diagnóstico**
```bash
# Verificar se PM2 carregou env vars
pm2 show anythingllm-server | grep -A 20 "Environment"

# Verificar arquivo .env
cat server/.env.production | grep STORAGE_DIR
```

#### **Solução Aplicada**
```javascript
// ❌ Tentativa inicial (falhou)
{
  name: 'anythingllm-server',
  script: 'server/index.js',
  env_file: 'server/.env.production'  // Não funcionou
}

// ✅ Solução final (funcionou)
{
  name: 'anythingllm-server',
  script: 'server/index.js',
  env: {
    STORAGE_DIR: '/opt/anythingllm-native/server/storage',
    JWT_SECRET: 'jholy-production-jwt-secret-2024',
    // ... todas as vars inline
  }
}
```

#### **Prevenção**
- Sempre usar configuração inline para environments críticos
- Testar environment variables com `pm2 show app-name`
- Criar script de validação de env vars

---

### **2. Static Files MIME Types Incorretos**

#### **Problema**
```javascript
Failed to load module script: Expected a JavaScript-or-Wasm module script
but the server responded with a MIME type of "text/html"

Refused to apply style from 'http://gpt.jholy.com.br/index.css'
because its MIME type ('text/html') is not a supported stylesheet MIME type
```

#### **Causa**
- Frontend buildado em `frontend/dist/`
- AnythingLLM server espera assets em `server/public/`
- Server retornava HTML 404 instead de JS/CSS files

#### **Diagnóstico**
```bash
# Verificar onde estão os assets buildados
ls -la frontend/dist/

# Verificar onde servidor espera assets
ls -la server/public/

# Testar MIME type
curl -I http://localhost:3001/index.js
# Se retornar text/html = problema
```

#### **Solução Aplicada**
```bash
# Cópia manual dos assets para local correto
cd /opt/anythingllm-native
mkdir -p server/public
cp -r frontend/dist/* server/public/

# Verificar resultado
curl -I http://localhost:3001/index.js
# Deve retornar: Content-Type: application/javascript
```

#### **Prevenção**
- Incluir step de cópia no processo de build
- Criar script `scripts/copy-assets.sh`
- Documentar requirement claramente

---

### **3. PM2 ES6 Modules Conflict**

#### **Problema**
```bash
Error [ERR_REQUIRE_ESM]: require() of ES Module ecosystem.config.js not supported.
ecosystem.config.js is treated as an ES module file as it is a .js file whose
nearest parent package.json contains "type": "module"
```

#### **Causa**
- AnythingLLM usa `"type": "module"` no package.json
- PM2 tenta carregar config como CommonJS
- Conflito entre ES6 modules e CommonJS

#### **Diagnóstico**
```bash
# Verificar tipo do package.json
grep '"type"' package.json

# Verificar extensão do arquivo config
ls -la ecosystem.config.*
```

#### **Solução Aplicada**
```bash
# Renomear para forçar CommonJS
mv ecosystem.config.js ecosystem.config.cjs

# PM2 agora carrega corretamente
pm2 start ecosystem.config.cjs
```

#### **Prevenção**
- Sempre usar extensão `.cjs` para configs PM2 em projetos ES6
- Documentar requirement no setup

---

### **4. Collector Service Instabilidade**

#### **Problema**
- Collector service constantemente em "errored" status
- Server funcionando, mas collector falhando

#### **Causa**
- Falta de configuração específica para collector
- Paths de storage não configurados

#### **Diagnóstico**
```bash
pm2 status
pm2 logs anythingllm-collector --lines 50
```

#### **Status Atual**
- ⚠️ Collector instável, mas não crítico
- ✅ Server funcionando normalmente
- ✅ Frontend funcionando normalmente

#### **Solução Futura**
```bash
# Adicionar configuração específica para collector
env: {
  NODE_ENV: 'production',
  STORAGE_DIR: '/opt/anythingllm-native/server/storage',
  // ... outras vars necessárias
}
```

---

## ⚡ Problemas Menores

### **5. SSL Certificate Obtention Timeout**

#### **Problema**
- Processo de renovação SSL travando ocasionalmente

#### **Solução**
```bash
# Matar processo travado
pkill certbot

# Tentar novamente
certbot certificates
```

### **6. Nginx Configuration Validation**

#### **Problema**
- Configuração nginx pode ficar inválida após mudanças

#### **Solução**
```bash
# Sempre testar antes de recarregar
nginx -t

# Se inválido, reverter
cp /etc/nginx/sites-available/anythingllm.backup /etc/nginx/sites-available/anythingllm
systemctl reload nginx
```

---

## 🚀 Scripts de Diagnóstico Rápido

### **Script: Diagnóstico Completo**
```bash
#!/bin/bash
# diagnose-system.sh

echo "=== DIAGNÓSTICO ANYTHINGLLM ==="

echo "1. Status PM2:"
pm2 status

echo -e "\n2. Status Nginx:"
systemctl status nginx --no-pager

echo -e "\n3. Test API:"
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3001/api/ping

echo -e "\n4. Test Frontend:"
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3001/

echo -e "\n5. Test HTTPS:"
curl -s -o /dev/null -w "HTTP %{http_code}" https://gpt.jholy.com.br

echo -e "\n6. Static Files MIME:"
echo "JavaScript: $(curl -s -I http://localhost:3001/index.js | grep -i content-type)"
echo "CSS: $(curl -s -I http://localhost:3001/index.css | grep -i content-type)"

echo -e "\n7. SSL Certificate:"
certbot certificates | grep gpt.jholy.com.br -A 3

echo -e "\n8. Disk Space:"
df -h /opt/anythingllm-native

echo -e "\n9. Memory Usage:"
free -h

echo -e "\n=== FIM DIAGNÓSTICO ==="
```

### **Script: Reset Completo**
```bash
#!/bin/bash
# reset-system.sh

echo "🔄 Iniciando reset do sistema..."

echo "1. Parando PM2..."
pm2 stop all

echo "2. Copiando assets..."
cd /opt/anythingllm-native
cp -r frontend/dist/* server/public/

echo "3. Reiniciando PM2..."
pm2 restart all

echo "4. Aguardando inicialização..."
sleep 5

echo "5. Testando serviços..."
curl -s http://localhost:3001/api/ping && echo "✅ API OK" || echo "❌ API FAIL"
curl -s http://localhost:3001/ > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend FAIL"

echo "🎉 Reset concluído!"
```

---

## 📊 Checklist de Validação

### **Pré-Deploy**
- [ ] Environment variables definidas
- [ ] Assets copiados para server/public/
- [ ] PM2 config file (.cjs extension)
- [ ] Storage directory criado

### **Pós-Deploy**
- [ ] PM2 services online
- [ ] API respondendo (200 OK)
- [ ] Frontend carregando
- [ ] Static files com MIME correto
- [ ] SSL funcionando
- [ ] Redirecionamento HTTP→HTTPS

### **Pós-SSL**
- [ ] HTTPS respondendo (200 OK)
- [ ] Certificado válido
- [ ] Renovação automática configurada
- [ ] Headers de segurança presentes

---

## 🔧 Comandos de Emergency

### **Restart Completo**
```bash
# 1. Parar tudo
pm2 stop all
systemctl stop nginx

# 2. Recopiar assets
cd /opt/anythingllm-native
cp -r frontend/dist/* server/public/

# 3. Reiniciar tudo
systemctl start nginx
pm2 restart all

# 4. Verificar
pm2 status
curl -I https://gpt.jholy.com.br
```

### **Rollback SSL (Emergência)**
```bash
# Se SSL quebrar tudo, reverter para HTTP
# Backup da config atual
cp /etc/nginx/sites-available/anythingllm /etc/nginx/sites-available/anythingllm.ssl-backup

# Restaurar config HTTP simples
cat > /etc/nginx/sites-available/anythingllm << 'EOF'
server {
    listen 80;
    server_name gpt.jholy.com.br;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Recarregar
nginx -t && systemctl reload nginx
```

### **Logs de Debug**
```bash
# PM2 logs detalhados
pm2 logs --lines 100

# Nginx logs
tail -f /var/log/nginx/error.log

# SSL logs
tail -f /var/log/letsencrypt/letsencrypt.log

# System logs
journalctl -f -u nginx
```

---

## 📈 Métricas de Performance

### **Antes da Migração (Docker)**
```bash
# Uso de recursos
Memory: ~2GB
CPU: 15-25%
Boot time: 30-60s
Containers: 3 running
```

### **Depois da Migração (Native)**
```bash
# Uso de recursos
Memory: ~800MB
CPU: 5-10%
Boot time: 5-10s
Processes: 2 PM2 processes
```

### **Ganhos Alcançados**
- ✅ **RAM**: -60% uso de memória
- ✅ **CPU**: -50% uso médio
- ✅ **Boot**: 5x mais rápido
- ✅ **Debugging**: Acesso direto aos processes

---

## 🎯 Prevenção de Problemas Futuros

### **Monitoring Recomendado**
1. **PM2 Monitoring**: `pm2 monit`
2. **SSL Expiry**: Monitoring automático
3. **Disk Space**: Alert quando < 20%
4. **Memory Usage**: Alert quando > 80%

### **Backup Strategy**
```bash
# Backup configs importantes
tar -czf config-backup-$(date +%Y%m%d).tar.gz \
  /etc/nginx/sites-available/anythingllm \
  /opt/anythingllm-native/ecosystem.config.cjs \
  /opt/anythingllm-native/server/.env.production
```

### **Documentação Atualizada**
- Manter este troubleshooting guide atualizado
- Documentar novos problemas encontrados
- Criar scripts de automação para tarefas repetitivas

---

**💡 Lição Aprendida**: A maioria dos problemas foram causados por diferenças entre ambiente de desenvolvimento local e configuração de produção. Padronização e testes são fundamentais.