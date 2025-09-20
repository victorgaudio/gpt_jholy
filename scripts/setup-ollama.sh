#!/bin/bash
# Script para configurar Ollama para desenvolvimento local do AnythingLLM

set -e

echo "🚀 Configurando Ollama para AnythingLLM..."

# Verificar se Ollama já está instalado
if command -v ollama &> /dev/null; then
    echo "✅ Ollama já está instalado"
else
    echo "📦 Instalando Ollama..."

    # Detectar sistema operacional
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install ollama
        else
            echo "⚠️  Homebrew não encontrado. Instalando via curl..."
            curl -fsSL https://ollama.ai/install.sh | sh
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://ollama.ai/install.sh | sh
    else
        echo "❌ Sistema operacional não suportado. Instale Ollama manualmente: https://ollama.ai"
        exit 1
    fi
fi

# Iniciar Ollama (se não estiver rodando)
echo "🔧 Iniciando serviço Ollama..."
if ! pgrep -x "ollama" > /dev/null; then
    ollama serve &
    sleep 3
fi

# Verificar se Ollama está rodando
echo "🔍 Verificando status do Ollama..."
if curl -s http://localhost:11434/api/version > /dev/null; then
    echo "✅ Ollama está rodando"
else
    echo "❌ Erro: Ollama não está respondendo"
    echo "💡 Tente iniciar manualmente: ollama serve"
    exit 1
fi

# Baixar modelos recomendados
echo "📥 Baixando modelos para desenvolvimento..."

# Modelo pequeno e rápido para desenvolvimento
echo "Baixando llama3.2:1b (pequeno, rápido)..."
ollama pull llama3.2:1b

# Modelo de embedding
echo "Baixando nomic-embed-text (embeddings)..."
ollama pull nomic-embed-text

# Modelo maior opcional
read -p "Deseja baixar llama3.2:3b (maior, mais preciso)? [y/N]: " install_larger
if [[ $install_larger =~ ^[Yy]$ ]]; then
    echo "Baixando llama3.2:3b..."
    ollama pull llama3.2:3b
fi

# Listar modelos instalados
echo "📋 Modelos instalados:"
ollama list

# Testar modelo
echo "🧪 Testando modelo..."
echo "Pergunta: 'Hello, how are you?'"
echo "Resposta:"
ollama run llama3.2:1b "Hello, how are you?" | head -3

echo ""
echo "✅ Configuração do Ollama concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure o arquivo server/.env.local:"
echo "   LLM_PROVIDER='ollama'"
echo "   OLLAMA_BASE_PATH='http://localhost:11434'"
echo "   OLLAMA_MODEL_PREF='llama3.2:1b'"
echo ""
echo "2. Para embeddings, configure:"
echo "   EMBEDDING_ENGINE='ollama'"
echo "   EMBEDDING_BASE_PATH='http://localhost:11434'"
echo "   EMBEDDING_MODEL_PREF='nomic-embed-text'"
echo ""
echo "3. Inicie o desenvolvimento:"
echo "   yarn dev:server"
echo "   yarn dev:frontend"
echo "   yarn dev:collector"
echo ""
echo "🔗 Ollama Web UI: http://localhost:11434"
echo "📚 Documentação: https://ollama.ai/docs"