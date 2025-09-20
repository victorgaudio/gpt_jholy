# Guia de Desenvolvimento AnythingLLM

Este guia fornece um workflow completo para desenvolvimento local e deploy no Digital Ocean com mínimo atrito.

## 🚀 Início Rápido

### 1. Configuração Inicial (Uma vez)

```bash
# Clone e configure o projeto
git clone <your-repo>
cd gpt_jholy

# Setup automático (dependências + banco + ENVs)
yarn setup
yarn prisma:setup
```

### 2. Desenvolvimento Diário

#### Opção A: Desenvolvimento Nativo (Recomendado)
```bash
# Terminal 1: Server
yarn dev:server

# Terminal 2: Frontend (http://localhost:3000)
yarn dev:frontend

# Terminal 3: Collector
yarn dev:collector
```

#### Opção B: Desenvolvimento com Docker
```bash
# Usar configuração otimizada
docker-compose -f docker-compose.dev.yml up -d

# Com PostgreSQL e Ollama
docker-compose -f docker-compose.dev.yml --profile postgres --profile ollama up -d
```

## 🛠 Configurações por Ambiente

### Desenvolvimento Local
- **Arquivo**: `server/.env.local`
- **LLM**: Ollama (gratuito) - `llama3.2:1b`
- **Embedding**: Nativo (gratuito)
- **Vector DB**: LanceDB (local)
- **Banco**: SQLite (padrão)

### Testes de Produção Local
- **Arquivo**: `docker/.env.production`
- **LLM**: OpenAI (configurar API key)
- **Vector DB**: PostgreSQL + pgvector
- **Banco**: PostgreSQL

### Produção Digital Ocean
- **Arquivo**: `docker/.env.production`
- **LLM**: OpenAI/Anthropic (melhor qualidade)
- **Infraestrutura**: Terraform automatizado

## 📁 Estrutura de Arquivos de Configuração

```
├── server/
│   ├── .env.development     # Ambiente padrão
│   └── .env.local          # Desenvolvimento com Ollama (criado)
├── frontend/
│   └── .env                # Frontend (já configurado)
├── collector/
│   └── .env                # Collector (já configurado)
└── docker/
    ├── .env                # Docker desenvolvimento
    └── .env.production     # Produção/staging (criado)
```

## 🐳 Docker Workflows

### Desenvolvimento Local
```bash
# Build e teste local
docker-compose -f docker-compose.dev.yml up --build

# Com serviços opcionais
docker-compose -f docker-compose.dev.yml --profile postgres up -d
```

### Teste de Produção Local
```bash
# Simular ambiente de produção
docker-compose -f docker-compose.production.yml --profile production up -d

# Com reverse proxy
docker-compose -f docker-compose.production.yml --profile production --profile nginx up -d
```

## ☁️ Deploy Digital Ocean

### Setup Inicial
```bash
cd cloud-deployments/digitalocean/terraform/

# 1. Configurar credenciais
cp terraform.tfvars.example terraform.tfvars
# Editar terraform.tfvars com seu token e configurações

# 2. Configurar arquivo de produção
cp ../../../docker/.env.production .env.production
# Editar .env.production com suas API keys

# 3. Deploy
terraform init
terraform plan
terraform apply
```

### Configuração do .env.production
Antes do deploy, configure:
```bash
# Segurança (OBRIGATÓRIO)
SIG_KEY='gere-string-aleatoria-32-chars'
SIG_SALT='gere-string-aleatoria-32-chars'
JWT_SECRET='gere-string-aleatoria-12-chars'
AUTH_TOKEN='senha-forte-para-acesso'

# APIs (Configure suas chaves)
OPEN_AI_KEY=sk-sua-chave-openai
```

### Monitoramento pós-deploy
```bash
# SSH no servidor
ssh root@IP_DO_SERVIDOR

# Verificar logs
sudo tail -f /var/log/cloud-init-output.log

# Status do container
docker ps

# Logs da aplicação
docker logs anythingllm
```

## 🔄 Workflows Comuns

### Testar Localmente Antes do Deploy
```bash
# 1. Desenvolvimento nativo
yarn dev:server & yarn dev:frontend & yarn dev:collector

# 2. Teste Docker local
docker-compose -f docker-compose.production.yml --profile production up

# 3. Deploy quando satisfeito
cd cloud-deployments/digitalocean/terraform/ && terraform apply
```

### Atualizar Produção
```bash
# 1. Fazer mudanças locais
# 2. Testar localmente
# 3. Commit e push
# 4. SSH no servidor e atualizar:

ssh root@IP_DO_SERVIDOR
docker pull mintplexlabs/anythingllm:latest
docker stop anythingllm && docker rm anythingllm
/usr/local/bin/start-anythingllm.sh
```

### Backup e Restore
```bash
# Backup (local)
docker exec anythingllm tar czf - /app/server/storage | gzip > backup.tar.gz

# Restore (local)
gunzip -c backup.tar.gz | docker exec -i anythingllm tar xzf - -C /
```

## 🧪 Testing

### Testes Unitários
```bash
# Executar todos os testes
yarn test

# Teste específico
yarn test --testNamePattern="nome-do-teste"
```

### Testes de Integração
```bash
# Testar API endpoints
curl http://localhost:3001/api/ping
curl http://localhost:3001/api/system/system-vectors

# Testar upload de documento
curl -X POST http://localhost:3001/api/document/upload \
  -F "file=@documento.pdf"
```

## 🛡 Segurança

### Desenvolvimento
- ✅ Usar configurações simples
- ✅ Telemetria desabilitada
- ✅ Senhas simples para facilitar

### Produção
- ⚠️ Alterar todas as chaves de segurança
- ⚠️ Configurar AUTH_TOKEN forte
- ⚠️ Usar HTTPS em produção
- ⚠️ Backup regular dos dados

## 🐛 Troubleshooting

### Container não inicia
```bash
# Verificar logs
docker logs anythingllm

# Verificar configuração
docker exec anythingllm cat /app/server/.env

# Recriar container
docker stop anythingllm && docker rm anythingllm
/usr/local/bin/start-anythingllm.sh
```

### Erro de conexão LLM
```bash
# Testar Ollama local
curl http://localhost:11434/api/version

# Testar OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Banco de dados corrompido
```bash
# Reset desenvolvimento
yarn prisma:reset

# Produção (cuidado!)
docker exec anythingllm npx prisma migrate reset --force
```

## 📊 Custos Estimados

### Desenvolvimento
- **Local**: Gratuito (Ollama + SQLite)
- **APIs**: $0/mês (usando modelos locais)

### Produção Digital Ocean
- **Droplet s-2vcpu-2gb**: $12/mês
- **Volume 20GB**: $2/mês
- **OpenAI API**: $5-20/mês (dependendo do uso)
- **Total**: ~$20-35/mês

## 🔗 Links Úteis

- [Documentação AnythingLLM](https://docs.anythingllm.com/)
- [Digital Ocean Terraform](https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs)
- [Ollama Models](https://ollama.ai/library)
- [OpenAI Pricing](https://openai.com/pricing)

## 📝 Notas de Desenvolvimento

### LLM Providers Recomendados
1. **Desenvolvimento**: Ollama (gratuito, local)
2. **Produção**: OpenAI GPT-4o (melhor qualidade)
3. **Econômico**: Groq (rápido e barato)

### Vector Databases
1. **Desenvolvimento**: LanceDB (local, simples)
2. **Produção**: PostgreSQL + pgvector (robusto)
3. **Scale**: Pinecone (managed, caro)

### Estratégia de Backup
- **Desenvolvimento**: Git + exports manuais
- **Produção**: Automated backups + volume snapshots