#!/bin/bash
# Setup Enxuto AnythingLLM - APIs Online
# Zero overhead local, setup em 2 minutos

set -e

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

# Main
main() {
    check_deps
    echo ""

    setup_project
    echo ""

    setup_database
    echo ""

    setup_api_key
    echo ""

    test_setup

    show_next_steps
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi