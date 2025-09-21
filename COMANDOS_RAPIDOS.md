# 🚀 AnythingLLM - Comandos Rápidos

## 📋 Comandos Principais (Makefile)

### Setup Inicial
```bash
make install     # Setup completo (dependências, configs, database)
make reset       # Reset completo do projeto
```

### Desenvolvimento Diário
```bash
make dev         # Inicia todos os serviços
make stop        # Para todos os serviços
make status      # Verifica saúde dos serviços
make health      # Health check detalhado
```

### Manutenção
```bash
make logs        # Mostra logs agregados
make clean       # Limpa node_modules e temp files
```

## ⚡ Comandos Yarn (Alternativos)

### Setup e Início Rápido
```bash
yarn quick-install   # Setup rápido
yarn quick-start     # Setup + start em um comando
yarn quick-dev       # Inicia desenvolvimento
```

### Monitoramento
```bash
yarn quick-status    # Status completo
yarn quick-health    # Health check detalhado
yarn quick-stop      # Para serviços
```

### Troubleshooting
```bash
yarn quick-reset     # Reset completo
yarn port:check      # Verifica portas
yarn port:fix        # Corrige conflitos de porta
yarn port:reset      # Reset portas para padrão
```

## 🔧 Scripts Individuais

### Health Check
```bash
./scripts/health-check.sh                # Health check padrão
./scripts/health-check.sh --quick        # Check rápido
./scripts/health-check.sh --comprehensive # Check detalhado
./scripts/health-check.sh --post-start   # Check pós-inicialização
```

### Validação de Portas
```bash
./scripts/port-validator.sh check    # Verifica e corrige conflitos
./scripts/port-validator.sh status   # Mostra uso das portas
./scripts/port-validator.sh force    # Reset para portas padrão
```

### Gerenciamento de Ambiente
```bash
./scripts/manage-env-simple.sh dev         # Inicia desenvolvimento
./scripts/manage-env-simple.sh status      # Status dos serviços
./scripts/manage-env-simple.sh stop        # Para serviços
./scripts/manage-env-simple.sh clean       # Limpeza
```

### Setup
```bash
./scripts/setup-simple.sh                 # Setup normal
./scripts/setup-simple.sh --reset-configs # Setup com reset
./scripts/setup-simple.sh --help          # Ajuda
```

## 🌐 URLs de Acesso

- **Frontend**: http://localhost:3001
- **API Server**: http://localhost:3002
- **API Endpoints**: http://localhost:3002/api
- **Collector**: http://localhost:8888

## 🎯 Fluxo Recomendado

### Primeira Instalação
```bash
# 1. Setup completo
make install

# 2. Inicia desenvolvimento
make dev

# 3. Verifica se tudo está OK
make status
```

### Uso Diário
```bash
# Inicia desenvolvimento
make dev

# Verifica status quando necessário
make status

# Para ao final do dia
make stop
```

### Troubleshooting
```bash
# Se houver problemas de porta
yarn port:fix

# Health check detalhado
make health

# Reset completo se necessário
make reset
```

## 🔍 Validações Automáticas

O sistema inclui validações automáticas para:

- ✅ Dependências do sistema (Node.js, Yarn, etc.)
- ✅ Estrutura do projeto
- ✅ Configurações de ambiente
- ✅ Estado do banco de dados
- ✅ Node modules instalados
- ✅ Serviços rodando
- ✅ Conflitos de porta
- ✅ Conectividade entre serviços

## 📊 Portas Configuradas

| Serviço   | Porta Padrão | Porta Alternativa |
|-----------|--------------|-------------------|
| Server    | 3002         | 3003, 3004, 3005  |
| Frontend  | 3001         | 3000, 3010, 3011  |
| Collector | 8888         | 8889, 8890, 8891  |

## 🚨 Resolução de Problemas Comuns

### Conflito de Portas
```bash
yarn port:fix      # Resolve automaticamente
# ou
make status        # Mostra portas em uso
```

### API Key não configurada
```bash
# Edite o arquivo server/.env.development
# Substitua: OPEN_AI_KEY=sk-your-openai-api-key-here
```

### Serviços não iniciam
```bash
make health        # Diagnóstico completo
make clean         # Limpa e reinstala se necessário
make install       # Reinstala tudo
```

### Frontend não conecta com API
```bash
yarn port:fix      # Corrige configuração de portas
make status        # Verifica conectividade
```

---

**💡 Dica**: Use `make help` ou `yarn quick-status` para verificar rapidamente o estado do projeto.