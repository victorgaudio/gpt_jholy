#!/bin/bash
# Gerenciador Simples de Ambientes AnythingLLM
# Versão enxuta sem Ollama - APIs online apenas

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Função para mostrar uso
show_usage() {
    echo -e "${BLUE}🛠️  AnythingLLM - Gerenciador Simples${NC}"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  setup        - Setup inicial completo"
    echo "  dev          - Iniciar desenvolvimento"
    echo "  dev-docker   - Desenvolvimento com Docker"
    echo "  prod-local   - Testar produção localmente"
    echo "  status       - Verificar status dos serviços"
    echo "  stop         - Parar todos os serviços"
    echo "  logs         - Ver logs dos serviços"
    echo "  clean        - Limpeza básica"
    echo ""
    echo "Exemplos:"
    echo "  $0 setup     # Configuração inicial (execute uma vez)"
    echo "  $0 dev       # Desenvolvimento diário"
    echo "  $0 status    # Verificar se tudo está OK"
}

# Função para verificar dependências básicas
check_deps() {
    local missing=()

    if ! command -v yarn &> /dev/null; then
        missing+=("yarn")
    fi

    if [[ ${#missing[@]} -gt 0 ]]; then
        echo -e "${RED}❌ Dependências faltando: ${missing[*]}${NC}"
        echo "Instale as dependências antes de continuar."
        exit 1
    fi
}

# Função para setup inicial
setup_env() {
    echo -e "${BLUE}🚀 Setup inicial AnythingLLM...${NC}"

    if [ -f "scripts/setup-simple.sh" ]; then
        bash scripts/setup-simple.sh
    else
        echo -e "${YELLOW}⚠️  Script de setup não encontrado, executando setup manual...${NC}"
        yarn setup
        yarn prisma:setup
        echo -e "${GREEN}✅ Setup concluído! Configure sua API key em server/.env.development${NC}"
    fi
}

# Função para desenvolvimento
start_dev() {
    echo -e "${BLUE}🔧 Iniciando desenvolvimento...${NC}"

    # Verificar se API key está configurada
    if grep -q "sk-your-openai-api-key-here" server/.env.development 2>/dev/null; then
        echo -e "${YELLOW}⚠️  API key não configurada!${NC}"
        echo "Configure sua API key em server/.env.development antes de continuar."
        echo "Substitua: OPEN_AI_KEY=sk-your-openai-api-key-here"
        return 1
    fi

    echo "🌐 Iniciando serviços..."
    echo "- Server: http://localhost:3001"
    echo "- Frontend: http://localhost:3000"
    echo "- Collector: port 8888"
    echo ""

    # Abrir terminais separados no macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Abrindo terminais automaticamente..."
        osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'\" && yarn dev:server"'
        sleep 1
        osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'\" && yarn dev:frontend"'
        sleep 1
        osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'\" && yarn dev:collector"'
        echo -e "${GREEN}✅ Terminais abertos. Use Ctrl+C em cada um para parar.${NC}"
    else
        echo "Execute em terminais separados:"
        echo "1. yarn dev:server"
        echo "2. yarn dev:frontend"
        echo "3. yarn dev:collector"
    fi
}

# Função para Docker desenvolvimento
start_dev_docker() {
    echo -e "${BLUE}🐳 Iniciando desenvolvimento com Docker...${NC}"

    if [ ! -f "docker-compose.light.yml" ]; then
        echo -e "${RED}❌ docker-compose.light.yml não encontrado${NC}"
        echo "Criando configuração básica..."
        create_light_docker_compose
    fi

    docker-compose -f docker-compose.light.yml up -d
    echo -e "${GREEN}✅ Container iniciado${NC}"
    echo "🌐 Acesse: http://localhost:3001"
}

# Função para criar docker-compose leve
create_light_docker_compose() {
    cat > docker-compose.light.yml << 'EOF'
version: '3.8'

services:
  anythingllm:
    build: .
    container_name: anythingllm-light
    ports:
      - "3001:3001"
    volumes:
      - "./server/.env.development:/app/server/.env"
      - "./server/storage:/app/server/storage"
    environment:
      - STORAGE_DIR=/app/server/storage
    restart: unless-stopped
EOF
    echo "✅ docker-compose.light.yml criado"
}

# Função para produção local
start_prod_local() {
    echo -e "${BLUE}🏭 Testando produção localmente...${NC}"

    if [ ! -f "docker-compose.production.yml" ]; then
        echo -e "${RED}❌ docker-compose.production.yml não encontrado${NC}"
        exit 1
    fi

    docker-compose -f docker-compose.production.yml --profile production up -d
    echo -e "${GREEN}✅ Ambiente de produção local iniciado${NC}"
    echo "🌐 Acesse: http://localhost:3001"
}

# Função para verificar status
check_status() {
    echo -e "${BLUE}📊 Status dos serviços...${NC}"

    # Verificar AnythingLLM
    if curl -s http://localhost:3001/api/ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ AnythingLLM: Online${NC}"
    else
        echo -e "${YELLOW}⚠️  AnythingLLM: Offline${NC}"
    fi

    # Verificar se API key está configurada
    if [ -f "server/.env.development" ]; then
        if grep -q "sk-your-openai-api-key-here" server/.env.development; then
            echo -e "${YELLOW}⚠️  API Key: Não configurada${NC}"
        else
            echo -e "${GREEN}✅ API Key: Configurada${NC}"
        fi
    fi

    # Verificar containers Docker
    echo ""
    echo "🐳 Containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep anythingllm || echo "Nenhum container AnythingLLM rodando"
}

# Função para parar serviços
stop_services() {
    echo -e "${YELLOW}🛑 Parando serviços...${NC}"

    # Parar containers Docker
    docker-compose -f docker-compose.light.yml down 2>/dev/null || true
    docker-compose -f docker-compose.production.yml down 2>/dev/null || true

    # Parar processos Node.js
    pkill -f "yarn dev" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true

    echo -e "${GREEN}✅ Serviços parados${NC}"
}

# Função para ver logs
show_logs() {
    echo -e "${BLUE}📋 Logs dos serviços...${NC}"

    if docker ps | grep -q anythingllm; then
        docker logs --tail 50 -f $(docker ps | grep anythingllm | awk '{print $1}')
    else
        echo "Nenhum container AnythingLLM rodando"
        echo "Use: $0 dev-docker para iniciar com Docker"
    fi
}

# Função para limpeza básica
clean_env() {
    echo -e "${YELLOW}🧹 Limpeza básica...${NC}"

    # Parar serviços
    stop_services

    # Remover containers parados
    docker container prune -f 2>/dev/null || true

    # Limpar node_modules se necessário
    read -p "Limpar node_modules? [y/N]: " clean_modules
    if [[ $clean_modules =~ ^[Yy]$ ]]; then
        echo "Removendo node_modules..."
        rm -rf server/node_modules collector/node_modules frontend/node_modules
        echo "Execute 'yarn setup' para reinstalar."
    fi

    echo -e "${GREEN}✅ Limpeza concluída${NC}"
}

# Processar comando
case "${1:-}" in
    setup)
        check_deps
        setup_env
        ;;
    dev)
        check_deps
        start_dev
        ;;
    dev-docker)
        check_deps
        start_dev_docker
        ;;
    prod-local)
        check_deps
        start_prod_local
        ;;
    status)
        check_status
        ;;
    stop)
        stop_services
        ;;
    logs)
        show_logs
        ;;
    clean)
        check_deps
        clean_env
        ;;
    *)
        show_usage
        ;;
esac