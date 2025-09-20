# 🚀 AnythingLLM - Início Rápido Enxuto

## ⚡ Setup em 2 Comandos (2 minutos)

```bash
# 1. Setup automático
scripts/setup-simple.sh

# 2. Desenvolvimento (3 terminais)
yarn dev:server && yarn dev:frontend && yarn dev:collector

# 3. Acessar aplicação
open http://localhost:3000  # Frontend
open http://localhost:3001  # API
```

## 🎯 Cenários de Uso

### Desenvolvimento Diário
```bash
scripts/manage-env-simple.sh setup    # Setup inicial (uma vez)
scripts/manage-env-simple.sh dev      # Desenvolvimento com APIs online
scripts/manage-env-simple.sh status   # Verificar se tudo está OK
scripts/manage-env-simple.sh stop     # Parar quando terminar
```

### Docker Opcional
```bash
scripts/manage-env-simple.sh dev-docker  # Container leve sem overhead
```

### Deploy Digital Ocean
```bash
# 1. Configurar credenciais
cp cloud-deployments/digitalocean/terraform/terraform.tfvars.example \
   cloud-deployments/digitalocean/terraform/terraform.tfvars

# 2. Deploy (usa mesma configuração de desenvolvimento!)
cd cloud-deployments/digitalocean/terraform && terraform apply
```

## 🛠 Configurações Enxutas

### Desenvolvimento (APIs Online)
- **LLM**: OpenAI GPT-4o-mini (~$5/mês) - Zero overhead local
- **Embedding**: Nativo - Local (gratuito)
- **Vector DB**: LanceDB - Local (gratuito)
- **Banco**: SQLite - Local (gratuito)

### Produção (Zero Atrito)
- **LLM**: OpenAI GPT-4o (mesma configuração!)
- **Vector DB**: PostgreSQL + pgvector
- **Servidor**: Digital Ocean ($12-24/mês)

## 📁 Arquivos Principais

```
scripts/
├── setup-simple.sh        # Setup enxuto em 2 minutos ⭐
└── manage-env-simple.sh   # Gerenciamento simplificado

server/
├── .env.development        # Configuração com OpenAI (padrão)
└── .env.local              # Configuração enxuta otimizada

docker/
├── .env                    # Docker desenvolvimento
└── .env.production         # Produção (mesma configuração!)

cloud-deployments/digitalocean/terraform/
├── main.tf.optimized       # Terraform melhorado
├── terraform.tfvars.example # Template de configuração
└── user_data_optimized.tpl # Script de inicialização

docker-compose.light.yml        # Docker leve (opcional)
docker-compose.production.yml   # Docker produção
QUICKSTART.md                   # Este arquivo ⭐
```

## 🔍 Verificação Rápida

```bash
# Status de todos os serviços
scripts/manage-env-simple.sh status

# Testar APIs manualmente
curl http://localhost:3001/api/ping

# Verificar se API key está configurada
grep OPEN_AI_KEY server/.env.development
```

## 🆘 Problemas Comuns

### "API key não configurada"
```bash
# Edite o arquivo e substitua a chave
nano server/.env.development
# Substitua: OPEN_AI_KEY=sk-your-openai-api-key-here
```

### "Container não inicia"
```bash
docker logs anythingllm-light  # Ver logs
scripts/manage-env-simple.sh stop && scripts/manage-env-simple.sh dev-docker
```

### "Reset rápido"
```bash
scripts/manage-env-simple.sh clean  # Limpeza básica
rm server/storage/anythingllm.db && yarn prisma:setup  # Reset banco
```

## 💡 Dicas Enxutas

1. **Use `scripts/setup-simple.sh`** - Setup em 2 minutos
2. **Desenvolvimento**: APIs online (sem overhead)
3. **Produção**: Mesma configuração (zero atrito)
4. **Modelos econômicos**: gpt-4o-mini, groq, anthropic-haiku
5. **Docker opcional**: docker-compose.light.yml

## 🔗 Links Úteis

- **Frontend Local**: http://localhost:3000
- **API Local**: http://localhost:3001
- **Docs AnythingLLM**: https://docs.anythingllm.com/
- **OpenAI API Keys**: https://platform.openai.com/api-keys
- **Groq API Keys**: https://console.groq.com/keys
- **Anthropic API Keys**: https://console.anthropic.com

## 📚 Compatibilidade e Referências

### Nossa Abordagem vs Documentação Oficial
✅ **100% Compatível** com [documentação oficial AnythingLLM](https://docs.anythingllm.com/)
✅ **Segue todas as práticas** recomendadas pela Mintplex Labs
✅ **Adiciona automação** e otimizações não documentadas

### Outras Opções de Deploy
- **[Deploy Oficial Digital Ocean](https://github.com/Mintplex-Labs/anything-llm/tree/master/cloud-deployments/digitalocean)** - Versão manual
- **[Docker Cloud](https://docs.anythingllm.com/installation-docker/cloud-docker)** - Deploy direto
- **[Bare Metal](https://github.com/Mintplex-Labs/anything-llm/blob/master/BARE_METAL.md)** - Instalação sem Docker

### Outros LLM Providers Suportados
Embora recomendemos OpenAI para desenvolvimento enxuto, o AnythingLLM suporta 20+ providers:
- **Anthropic** (Claude) - Boa alternativa ao OpenAI
- **Groq** - Muito rápido e econômico
- **Ollama** - Local (mais pesado, mas gratuito)
- **[Ver lista completa](https://docs.anythingllm.com/llm-configuration)**

---

**Próximo passo**: Execute `scripts/setup-simple.sh` para começar! 🎉