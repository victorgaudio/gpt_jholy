#!/bin/bash
# Setup Enxuto AnythingLLM - APIs Online
# Zero overhead local, setup em 2 minutos
# Enhanced with validation and reset capabilities

set -e

# Configuration
RESET_MODE=0

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 AnythingLLM - Setup Enxuto${NC}"
echo "⚡ APIs online | Zero overhead local | Deploy sem atrito"
echo ""

# Verificar dependências básicas
check_deps() {
    local missing=()

    if ! command -v node &> /dev/null; then
        missing+=("node")
    fi

    if ! command -v yarn &> /dev/null; then
        missing+=("yarn")
    fi

    if [[ ${#missing[@]} -gt 0 ]]; then
        echo -e "${RED}❌ Dependências faltando: ${missing[*]}${NC}"
        echo "Instale Node.js e Yarn antes de continuar."
        exit 1
    fi

    echo -e "${GREEN}✅ Dependências OK${NC}"
}

# Setup básico
setup_project() {
    echo -e "${BLUE}📦 Instalando dependências...${NC}"

    # Setup automático do projeto
    yarn setup

    echo -e "${GREEN}✅ Dependências instaladas${NC}"
}

# Setup banco de dados
setup_database() {
    echo -e "${BLUE}🗄️  Configurando banco de dados...${NC}"

    # Prisma setup
    yarn prisma:setup

    echo -e "${GREEN}✅ Banco configurado${NC}"
}

# Configurar API key
setup_api_key() {
    echo -e "${BLUE}🔑 Configuração da API Key${NC}"
    echo ""
    echo "Para usar o AnythingLLM, você precisa de uma API key de LLM."
    echo ""
    echo "🔹 Opções recomendadas:"
    echo "  • OpenAI (GPT-4o-mini): ~$5-10/mês | https://platform.openai.com/api-keys"
    echo "  • Groq (Llama3): ~$2-5/mês | https://console.groq.com/keys"
    echo "  • Anthropic (Claude): ~$10-15/mês | https://console.anthropic.com"
    echo ""

    # Verificar se API key já foi configurada
    if grep -q "sk-your-openai-api-key-here" server/.env.development 2>/dev/null; then
        echo -e "${YELLOW}⚠️  API key não configurada ainda${NC}"
        echo ""
        echo "📝 Para configurar:"
        echo "1. Obtenha sua API key no provedor escolhido"
        echo "2. Edite o arquivo: server/.env.development"
        echo "3. Substitua 'sk-your-openai-api-key-here' pela sua chave real"
        echo ""
        echo "💡 Nossa abordagem segue 100% as práticas oficiais AnythingLLM:"
        echo "   https://docs.anythingllm.com/configuration"
        echo ""

        read -p "Deseja configurar agora? [y/N]: " configure_now
        if [[ $configure_now =~ ^[Yy]$ ]]; then
            echo "Abrindo arquivo de configuração..."
            if [[ "$OSTYPE" == "darwin"* ]]; then
                open server/.env.development
            else
                echo "Edite manualmente: server/.env.development"
            fi
        fi
    else
        echo -e "${GREEN}✅ API key parece estar configurada${NC}"
    fi
}

# Testar configuração
test_setup() {
    echo -e "${BLUE}🧪 Testando configuração...${NC}"

    # Verificar se arquivos essenciais existem
    local files=(
        "server/.env.development"
        "frontend/.env"
        "collector/.env"
        "server/storage/anythingllm.db"
    )

    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            echo "✅ $file"
        else
            echo "❌ $file (faltando)"
        fi
    done

    echo ""
    echo -e "${GREEN}✅ Setup básico concluído!${NC}"
}

# Instruções finais
show_next_steps() {
    echo ""
    echo -e "${BLUE}📋 Próximos Passos:${NC}"
    echo ""
    echo "1. 🔑 Configure sua API key (se ainda não fez):"
    echo "   Edite: server/.env.development"
    echo "   Substitua: OPEN_AI_KEY=sk-your-openai-api-key-here"
    echo ""
    echo "2. 🚀 Iniciar desenvolvimento:"
    echo "   Terminal 1: yarn dev:server"
    echo "   Terminal 2: yarn dev:frontend"
    echo "   Terminal 3: yarn dev:collector"
    echo ""
    echo "3. 🌐 Acessar aplicação:"
    echo "   Frontend: http://localhost:3000"
    echo "   API: http://localhost:3001"
    echo ""
    echo "4. 🐳 Alternativa Docker (opcional):"
    echo "   docker-compose -f docker-compose.light.yml up"
    echo ""
    echo -e "${GREEN}🎉 AnythingLLM está pronto para desenvolvimento!${NC}"
    echo ""
    echo "💡 Dicas:"
    echo "  • Use gpt-4o-mini para desenvolvimento (mais barato)"
    echo "  • Embeddings nativos não consomem API"
    echo "  • SQLite local (zero configuração)"
    echo "  • Deploy no Digital Ocean sem alterações"
    echo ""
    echo "📖 Documentação oficial: https://docs.anythingllm.com/"
    echo "🤝 Compatível com todos os 20+ LLM providers suportados"
}

# Reset configurations
reset_configs() {
    if [ $RESET_MODE -eq 1 ]; then
        echo -e "${YELLOW}🔄 Resetting configurations...${NC}"

        # Remove existing env files
        rm -f server/.env.development frontend/.env collector/.env

        # Copy fresh templates
        cp server/.env.example server/.env.development
        cp frontend/.env.example frontend/.env
        cp collector/.env.example collector/.env

        echo -e "${GREEN}✅ Configurations reset to defaults${NC}"
    fi
}

# Enhanced validation
validate_installation() {
    echo -e "${BLUE}🔍 Validating installation...${NC}"

    # Check if all required files exist
    local required_files=(
        "server/.env.development"
        "frontend/.env"
        "collector/.env"
        "server/storage/anythingllm.db"
    )

    local validation_passed=1

    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            echo -e "${GREEN}✅ $file${NC}"
        else
            echo -e "${YELLOW}⚠️  $file (will be created)${NC}"
            if [[ $file == *".db" ]]; then
                validation_passed=0
            fi
        fi
    done

    # Check node_modules
    local modules=("server/node_modules" "frontend/node_modules" "collector/node_modules")
    for module_dir in "${modules[@]}"; do
        if [ -d "$module_dir" ]; then
            echo -e "${GREEN}✅ $(dirname $module_dir) dependencies${NC}"
        else
            echo -e "${RED}❌ $(dirname $module_dir) dependencies missing${NC}"
            validation_passed=0
        fi
    done

    if [ $validation_passed -eq 1 ]; then
        echo -e "${GREEN}✅ Installation validation passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Some components need initialization${NC}"
    fi

    return 0
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --reset-configs)
                RESET_MODE=1
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Unknown option: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done
}

# Show help
show_help() {
    echo -e "${BLUE}📋 AnythingLLM Setup Help${NC}"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --reset-configs    Reset environment configurations to defaults"
    echo "  --help, -h         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                 # Normal setup"
    echo "  $0 --reset-configs # Reset and setup"
}

# Main
main() {
    parse_args "$@"

    if [ $RESET_MODE -eq 1 ]; then
        echo -e "${YELLOW}🔄 Reset mode enabled${NC}"
        echo ""
    fi

    check_deps
    echo ""

    reset_configs
    if [ $RESET_MODE -eq 1 ]; then
        echo ""
    fi

    setup_project
    echo ""

    setup_database
    echo ""

    setup_api_key
    echo ""

    validate_installation
    echo ""

    test_setup

    show_next_steps
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi