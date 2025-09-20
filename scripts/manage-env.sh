#!/bin/bash
# Script para gerenciar diferentes ambientes do AnythingLLM

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para mostrar uso
show_usage() {
    echo "🛠️  Gerenciador de Ambientes AnythingLLM"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  dev          - Iniciar desenvolvimento nativo"
    echo "  dev-docker   - Iniciar desenvolvimento com Docker"
    echo "  prod-local   - Testar produção localmente"
    echo "  status       - Verificar status dos serviços"
    echo "  stop         - Parar todos os serviços"
    echo "  reset        - Reset completo do ambiente"
    echo "  setup        - Configuração inicial"
    echo "  deploy       - Deploy para Digital Ocean"
    echo "  backup       - Fazer backup dos dados"
    echo "  restore      - Restaurar backup"
    echo ""
    echo "Exemplos:"
    echo "  $0 dev           # Desenvolvimento com hot-reload"
    echo "  $0 prod-local    # Testar como em produção"
    echo "  $0 deploy        # Deploy no Digital Ocean"
}

# Função para verificar dependências
check_deps() {
    local missing=()

    if ! command -v yarn &> /dev/null; then
        missing+=("yarn")
    fi

    if ! command -v docker &> /dev/null; then
        missing+=("docker")
    fi

    if [[ ${#missing[@]} -gt 0 ]]; then
        echo -e "${RED}❌ Dependências faltando: ${missing[*]}${NC}"
        echo "Instale as dependências antes de continuar."
        exit 1
    fi
}

# Função para configuração inicial
setup_env() {
    echo -e "${BLUE}🚀 Configuração inicial do AnythingLLM...${NC}"

    # Verificar se já foi configurado
    if [ -f "server/storage/anythingllm.db" ]; then
        read -p "Ambiente já configurado. Reconfigurar? [y/N]: " confirm
        if [[ ! $confirm =~ ^[Yy]$ ]]; then
            echo "Configuração cancelada."
            return
        fi
    fi

    # Setup básico
    echo "📦 Instalando dependências..."
    yarn setup

    # Setup Prisma
    echo "🗄️  Configurando banco de dados..."
    yarn prisma:setup

    # Perguntar sobre Ollama
    read -p "Configurar Ollama para desenvolvimento local? [Y/n]: " setup_ollama
    if [[ ! $setup_ollama =~ ^[Nn]$ ]]; then
        if [ -f "scripts/setup-ollama.sh" ]; then
            bash scripts/setup-ollama.sh
        else
            echo -e "${YELLOW}⚠️  Script do Ollama não encontrado. Configure manualmente.${NC}"
        fi
    fi

    echo -e "${GREEN}✅ Configuração inicial concluída!${NC}"
}

# Função para desenvolvimento nativo
start_dev() {
    echo -e "${BLUE}🔧 Iniciando desenvolvimento nativo...${NC}"

    # Verificar se ENV existe
    if [ ! -f "server/.env.development" ]; then
        echo -e "${RED}❌ Arquivo server/.env.development não encontrado${NC}"
        echo "Execute: $0 setup"
        exit 1
    fi

    echo "Iniciando serviços..."
    echo "- Server: http://localhost:3001"
    echo "- Frontend: http://localhost:3000"
    echo "- Collector: port 8888"
    echo ""
    echo "🛑 Para parar: Ctrl+C em todos os terminais"
    echo ""

    # Abrir em terminais separados (funciona no macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'\" && yarn dev:server"'
        osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'\" && yarn dev:frontend"'
        osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'\" && yarn dev:collector"'
    else
        echo "Execute manualmente em terminais separados:"
        echo "Terminal 1: yarn dev:server"
        echo "Terminal 2: yarn dev:frontend"
        echo "Terminal 3: yarn dev:collector"
    fi
}

# Função para desenvolvimento Docker
start_dev_docker() {
    echo -e "${BLUE}🐳 Iniciando desenvolvimento com Docker...${NC}"

    if [ ! -f "docker-compose.dev.yml" ]; then
        echo -e "${RED}❌ docker-compose.dev.yml não encontrado${NC}"
        exit 1
    fi

    docker-compose -f docker-compose.dev.yml up -d
    echo -e "${GREEN}✅ Containers iniciados${NC}"
    echo "🌐 Acesse: http://localhost:3001"
}

# Função para produção local
start_prod_local() {
    echo -e "${BLUE}🏭 Iniciando teste de produção local...${NC}"

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

    # Verificar se Ollama está rodando
    if curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Ollama: Online${NC}"
    else
        echo -e "${YELLOW}⚠️  Ollama: Offline${NC}"
    fi

    # Verificar AnythingLLM
    if curl -s http://localhost:3001/api/ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ AnythingLLM: Online${NC}"
    else
        echo -e "${YELLOW}⚠️  AnythingLLM: Offline${NC}"
    fi

    # Verificar containers Docker
    echo ""
    echo "🐳 Containers Docker:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(anythingllm|ollama|postgres)" || echo "Nenhum container relacionado rodando"
}

# Função para parar serviços
stop_services() {
    echo -e "${YELLOW}🛑 Parando serviços...${NC}"

    # Parar containers Docker
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    docker-compose -f docker-compose.production.yml down 2>/dev/null || true

    # Parar processos Node.js
    pkill -f "yarn dev" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true

    echo -e "${GREEN}✅ Serviços parados${NC}"
}

# Função para reset
reset_env() {
    echo -e "${RED}🔄 Reset completo do ambiente...${NC}"

    read -p "⚠️  Isso irá apagar todos os dados. Continuar? [y/N]: " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "Reset cancelado."
        return
    fi

    # Parar tudo
    stop_services

    # Remover dados
    rm -rf server/storage/anythingllm.db* 2>/dev/null || true
    rm -rf server/storage/documents/* 2>/dev/null || true
    rm -rf server/storage/vector-cache/* 2>/dev/null || true

    # Reconfigurar
    setup_env

    echo -e "${GREEN}✅ Reset concluído${NC}"
}

# Função para deploy
deploy_prod() {
    echo -e "${BLUE}☁️  Deploy para Digital Ocean...${NC}"

    if [ ! -f "cloud-deployments/digitalocean/terraform/terraform.tfvars" ]; then
        echo -e "${RED}❌ Configure primeiro: cloud-deployments/digitalocean/terraform/terraform.tfvars${NC}"
        echo "Copie de terraform.tfvars.example e configure seu token."
        exit 1
    fi

    cd cloud-deployments/digitalocean/terraform/

    echo "🔍 Verificando configuração..."
    terraform plan

    read -p "Continuar com o deploy? [y/N]: " confirm
    if [[ $confirm =~ ^[Yy]$ ]]; then
        terraform apply
    else
        echo "Deploy cancelado."
    fi

    cd - > /dev/null
}

# Função para backup
backup_data() {
    echo -e "${BLUE}💾 Fazendo backup...${NC}"

    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    # Backup SQLite
    if [ -f "server/storage/anythingllm.db" ]; then
        cp server/storage/anythingllm.db "$BACKUP_DIR/"
        echo "✅ Banco de dados salvo"
    fi

    # Backup documentos
    if [ -d "server/storage/documents" ]; then
        cp -r server/storage/documents "$BACKUP_DIR/"
        echo "✅ Documentos salvos"
    fi

    # Backup configurações
    cp server/.env.development "$BACKUP_DIR/" 2>/dev/null || true
    cp docker/.env.production "$BACKUP_DIR/" 2>/dev/null || true

    echo -e "${GREEN}✅ Backup salvo em: $BACKUP_DIR${NC}"
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
    reset)
        check_deps
        reset_env
        ;;
    deploy)
        check_deps
        deploy_prod
        ;;
    backup)
        backup_data
        ;;
    *)
        show_usage
        ;;
esac