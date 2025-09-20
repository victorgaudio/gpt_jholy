# Guia Completo: Desenvolvimento Local AnythingLLM

Este guia fornece instruções detalhadas para configurar e executar o AnythingLLM localmente usando a abordagem lean com APIs online.

## 🎯 Visão Geral

### Abordagem Lean
- **APIs Online**: OpenAI GPT-4o-mini para desenvolvimento
- **Zero Overhead**: Sem modelos locais pesados (Ollama eliminado)
- **Deploy Ready**: Mesma configuração para produção no Digital Ocean
- **Setup Rápido**: 2 minutos com scripts automatizados

### Arquitetura de Desenvolvimento
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Server      │    │   Collector     │
│   Port: 3004    │◄───┤   Port: 3002    │◄───┤   Port: 8888    │
│   (Vite/React)  │    │  (Node/Express) │    │  (Node/Express) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   OpenAI API    │
                    │  (gpt-4o-mini)  │
                    └─────────────────┘
```

## 🚀 Setup Inicial (Método Automatizado)

### Pré-requisitos
```bash
# Verificar versões mínimas
node --version  # >= 18
yarn --version  # >= 1.22.22
```

### Setup Automático (Recomendado)
```bash
# 1. Executar script de setup
./scripts/setup-simple.sh

# O script automaticamente:
# - Instala dependências (yarn setup)
# - Configura banco de dados (yarn prisma:setup)
# - Cria arquivos .env otimizados
# - Configura OpenAI como provider padrão
# - Valida configuração
```

### Iniciar Desenvolvimento
```bash
# Método 1: Script automatizado (macOS)
./scripts/manage-env-simple.sh dev

# Método 2: Manual (3 terminais)
yarn dev:server    # Terminal 1: Backend
yarn dev:frontend  # Terminal 2: Frontend
yarn dev:collector # Terminal 3: Collector
```

## 🛠 Setup Manual (Step-by-Step)

### 1. Instalação de Dependências
```bash
# Instalar dependências de todos os módulos
yarn setup

# Verificar instalação
ls -la server/node_modules frontend/node_modules collector/node_modules
```

### 2. Configuração do Banco de Dados
```bash
# Gerar cliente Prisma
yarn prisma:generate

# Executar migrações
yarn prisma:migrate

# Popular dados iniciais
yarn prisma:seed

# Verificar banco
ls -la server/storage/anythingllm.db
```

### 3. Configuração de Environment Variables

#### server/.env.development
```bash
# Configuração principal do servidor
NODE_ENV=development
SERVER_PORT=3002                # Porta alternativa (3001 pode estar ocupada)

# LLM Provider - OpenAI (Lean)
LLM_PROVIDER='openai'
OPEN_AI_KEY=sk-proj-your-key-here
OPEN_AI_MODEL_PREF='gpt-4o-mini' # Modelo econômico para dev

# Vector Database - LanceDB (Local)
VECTOR_DB=lancedb

# Storage
STORAGE_DIR=/app/server/storage

# Embedding Provider
EMBEDDING_ENGINE=native         # Embedder nativo (mais rápido)

# Security
JWT_SECRET=your-random-string

# Telemetry
DISABLE_TELEMETRY=true         # Opcional: desabilitar telemetria
```

#### frontend/.env
```bash
# API Base URL - Deve apontar para o servidor
VITE_API_BASE='http://localhost:3002/api'
```

#### collector/.env
```bash
# Configuração do collector
NODE_ENV=development
COLLECTOR_PORT=8888
SERVER_HOST=http://localhost:3002
```

### 4. Obter OpenAI API Key

#### 1. Criar Conta OpenAI
1. Acesse [platform.openai.com](https://platform.openai.com)
2. Crie conta ou faça login
3. Vá para "API Keys" no dashboard

#### 2. Gerar API Key
```bash
# Formato esperado
sk-proj-[48 caracteres aleatórios]

# Exemplo
sk-proj-your-openai-api-key-here
```

#### 3. Configurar Billing
- Adicione método de pagamento
- Defina limites de uso
- Monitore consumo no dashboard

### 5. Iniciar Serviços

#### Ordem de Inicialização
```bash
# 1. Servidor (Backend) - Terminal 1
cd server && yarn dev
# Aguardar: "Server running on http://localhost:3002"

# 2. Frontend - Terminal 2
cd frontend && yarn dev
# Aguardar: "Local: http://localhost:3004/" (ou primeira porta livre)

# 3. Collector - Terminal 3
cd collector && yarn dev
# Aguardar: "Collector running on http://localhost:8888"
```

## 🔍 Validação da Instalação

### 1. Verificar Serviços
```bash
# Servidor
curl http://localhost:3002/api/ping
# Esperado: {"online":true}

# Frontend (browser)
open http://localhost:3004
# Esperado: Interface AnythingLLM carregando

# Collector
curl http://localhost:8888/ping
# Esperado: 200 OK
```

### 2. Teste Automatizado com Playwright
```bash
# Executar teste completo
node test-frontend.js

# Esperado:
# ✅ Título: "AnythingLLM | Your personal LLM trained on anything"
# ✅ API Response: {"online":true}
# ✅ Interface Elements: botões, inputs detectados
# ✅ Zero errors encontrados
```

### 3. Verificar Logs
```bash
# Logs do servidor (Terminal 1)
# Deve mostrar: Database connected, CORS enabled, Server running

# Logs do frontend (Terminal 2)
# Deve mostrar: VITE ready, VITE_API_BASE configurado

# Logs do collector (Terminal 3)
# Deve mostrar: Collector started, Routes loaded
```

## 🎛 Configurações Avançadas

### Performance Tuning

#### Configurações de Modelo
```bash
# server/.env.development

# Para desenvolvimento rápido
OPEN_AI_MODEL_PREF='gpt-4o-mini'     # Mais rápido, mais barato

# Para qualidade máxima (dev final)
OPEN_AI_MODEL_PREF='gpt-4o'          # Melhor qualidade

# Configurações de embedding
EMBEDDING_ENGINE=native               # Mais rápido para dev
# EMBEDDING_ENGINE=openai             # Melhor qualidade
```

#### Otimizações de Development
```javascript
// vite.config.js (já configurado)
export default defineConfig({
  server: {
    host: '0.0.0.0',    // Permite acesso de outros dispositivos
    port: 3000,         // Porta preferencial
    open: false         // Não abrir browser automaticamente
  },
  build: {
    sourcemap: true     // Facilita debugging
  }
});
```

### Configurações de Banco

#### SQLite (Padrão Dev)
```bash
# Localização
server/storage/anythingllm.db

# Backup
cp server/storage/anythingllm.db server/storage/anythingllm.db.backup

# Reset completo
yarn prisma:reset
```

#### PostgreSQL (Opcional para Dev)
```bash
# docker-compose.light.yml (já configurado)
docker-compose -f docker-compose.light.yml --profile postgres up -d

# Configurar em server/.env.development
DATABASE_URL=postgresql://anythingllm:password@localhost:5432/anythingllm
```

## 🐛 Troubleshooting Common Issues

### Problemas de Porta

#### Conflito na Porta 3001
```bash
# Verificar o que está usando a porta
lsof -i :3001

# Solução: Usar porta alternativa
echo "SERVER_PORT=3002" >> server/.env.development
echo "VITE_API_BASE='http://localhost:3002/api'" > frontend/.env
```

#### Frontend não Encontra Porta Livre
```bash
# Verificar portas em uso
lsof -i :3000 :3001 :3002 :3003 :3004

# Vite tentará automaticamente:
# 3000 -> 3001 -> 3002 -> 3003 -> 3004 -> ...
```

### Problemas de CORS

#### Sintomas
```
Access to fetch at 'http://localhost:3001/api/...'
from origin 'http://localhost:3000' has been blocked by CORS policy
```

#### Solução
```bash
# Verificar configuração do frontend
cat frontend/.env | grep VITE_API_BASE

# Deve apontar para a mesma porta do servidor
echo "VITE_API_BASE='http://localhost:3002/api'" > frontend/.env

# Restart frontend
cd frontend && yarn dev
```

### Problemas de API Key

#### OpenAI API Key Inválida
```bash
# Verificar formato
echo $OPEN_AI_KEY | grep -E "^sk-proj-[A-Za-z0-9]{48}$"

# Testar diretamente
curl -H "Authorization: Bearer $OPEN_AI_KEY" \
     https://api.openai.com/v1/models
```

#### Rate Limiting
```bash
# Monitorar uso
# Dashboard: https://platform.openai.com/usage

# Configurar limites mais baixos para dev
OPEN_AI_MODEL_PREF='gpt-4o-mini'  # Mais barato
```

### Problemas de Banco

#### Prisma Client Desatualizado
```bash
# Regenerar cliente
yarn prisma:generate

# Se schema mudou
yarn prisma:migrate
```

#### Banco Corrompido
```bash
# Reset completo
rm server/storage/anythingllm.db
yarn prisma:migrate
yarn prisma:seed
```

## 📊 Monitoramento e Logs

### Estrutura de Logs
```
/logs/
├── server.log      # Logs do servidor
├── frontend.log    # Logs do Vite/React
├── collector.log   # Logs do collector
└── combined.log    # Logs combinados
```

### Comandos de Monitoring
```bash
# Verificar status de todos os serviços
./scripts/manage-env-simple.sh status

# Logs em tempo real
tail -f logs/server.log
tail -f logs/combined.log

# Verificar processos Node.js
ps aux | grep node
```

### Health Checks
```bash
# Script de health check
./scripts/health-check.sh

# Manual
curl -f http://localhost:3002/api/ping &&
curl -f http://localhost:8888/ping &&
curl -f http://localhost:3004/ > /dev/null
```

## 🔄 Comandos de Desenvolvimento

### Daily Workflow
```bash
# Iniciar dia de desenvolvimento
./scripts/manage-env-simple.sh dev

# Durante desenvolvimento
yarn lint              # Verificar código
yarn test              # Executar testes
node test-frontend.js  # Validar interface

# Finalizar dia
./scripts/manage-env-simple.sh stop
```

### Code Quality
```bash
# Linting automático
yarn lint              # Roda prettier em todos os módulos

# Tests
yarn test              # Jest tests

# Type checking (se usar TypeScript)
yarn type-check
```

### Database Management
```bash
# Ver dados do banco
yarn prisma:studio     # Interface visual

# Migrations
yarn prisma:migrate    # Aplicar mudanças de schema
yarn prisma:seed       # Popular dados

# Reset development
yarn prisma:reset      # Reset completo
```

## 🚀 Preparação para Deploy

### Configuração Idêntica
```bash
# Development usa OpenAI + SQLite
LLM_PROVIDER='openai'
DATABASE_URL=file:./storage/anythingllm.db

# Production usa OpenAI + PostgreSQL
LLM_PROVIDER='openai'           # ✅ Mesma config
DATABASE_URL=postgresql://...   # Só muda o banco
```

### Build para Produção
```bash
# Testar build local
yarn prod:frontend     # Build otimizado
yarn prod:server       # Modo produção

# Testar com Docker local
docker-compose -f docker-compose.production.yml up -d
```

### Validação Pré-Deploy
```bash
# Checklist
- [ ] Variáveis de ambiente configuradas
- [ ] API keys validadas
- [ ] Tests passando
- [ ] Build sem erros
- [ ] Health checks OK
```

---

**Próximos Passos**:
- [Deploy no Digital Ocean](deploy-digital-ocean.md)
- [Configurações Avançadas](configuracoes-avancadas.md)
- [Troubleshooting Específico](troubleshooting-cors-portas.md)