# 🛠️ Troubleshooting Deploy Production

## 📋 Problemas Encontrados na Sessão

### **1. PM2 Environment Variables Não Carregando**

#### **Sintomas**
```bash
TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received undefined
    at Object.resolve (node:path:1169:7)
    at Object.<anonymous> (/opt/anythingllm-native/server/utils/files/index.js:9:12)
```

#### **Causa Root**
- PM2 não consegue carregar arquivo `.env.production` corretamente
- Variable `STORAGE_DIR` chega como `undefined`
- AnythingLLM tenta resolver path com valor undefined

#### **Diagnóstico**
```bash
# Verificar se PM2 carregou env vars
pm2 show anythingllm-server | grep -A 20 "Environment"

# Verificar arquivo .env
cat server/.env.production | grep STORAGE_DIR

# Debug das variáveis
pm2 logs anythingllm-server --lines 20
```

#### **Solução**
```javascript
// ❌ Configuração que falhou
{
  name: 'anythingllm-server',
  script: 'server/index.js',
  env_file: 'server/.env.production'  // Não funciona com ES6 modules
}

// ✅ Configuração que funcionou
{
  name: 'anythingllm-server',
  script: 'server/index.js',
  env: {
    NODE_ENV: 'production',
    STORAGE_DIR: '/opt/anythingllm-native/server/storage',
    JWT_SECRET: 'jholy-production-jwt-secret-2024',
    // Todas as variáveis inline
  }
}
```

### **2. Static Files com MIME Type Incorreto**

#### **Sintomas**
```javascript
// Console do browser
Failed to load module script: Expected a JavaScript-or-Wasm module script
but the server responded with a MIME type of "text/html"

Refused to apply style from 'http://gpt.jholy.com.br/index.css'
because its MIME type ('text/html') is not a supported stylesheet MIME type
```

#### **Causa Root**
- Frontend buildado em `frontend/dist/`
- AnythingLLM server espera assets em `server/public/`
- Server retorna HTML 404 ao invés dos arquivos JS/CSS

#### **Diagnóstico**
```bash
# Verificar onde estão os assets buildados
ls -la frontend/dist/
# Deve mostrar: index.html, index.js, index.css

# Verificar onde servidor espera assets
ls -la server/public/
# Provavelmente vazio ou com arquivos antigos

# Testar MIME type
curl -I http://localhost:3001/index.js
# Se retornar text/html = problema confirmado
```

#### **Solução**
```bash
# Cópia dos assets para local correto
cd /opt/anythingllm-native
mkdir -p server/public
cp -r frontend/dist/* server/public/

# Verificar resultado
curl -I http://localhost:3001/index.js
# Deve retornar: Content-Type: application/javascript

# Reiniciar PM2
pm2 restart anythingllm-server
```

### **3. ES6 Modules vs CommonJS Conflict**

#### **Sintomas**
```bash
Error [ERR_REQUIRE_ESM]: require() of ES Module ecosystem.config.js not supported.
ecosystem.config.js is treated as an ES module file as it is a .js file whose
nearest parent package.json contains "type": "module"
```

#### **Causa Root**
- AnythingLLM usa `"type": "module"` no package.json
- PM2 tenta carregar config como CommonJS
- Conflito entre ES6 modules e CommonJS

#### **Diagnóstico**
```bash
# Verificar tipo do package.json
grep '"type"' package.json
# Retorna: "type": "module"

# Verificar extensão do arquivo config
ls -la ecosystem.config.*
```

#### **Solução**
```bash
# Renomear para forçar CommonJS
mv ecosystem.config.js ecosystem.config.cjs

# PM2 agora carrega corretamente
pm2 start ecosystem.config.cjs
```

## 🚨 Problemas de Desenvolvimento Local

### **1. Conflitos de Porta**

#### **Sintomas**
- Services não iniciam
- "Port already in use" errors
- Frontend não consegue conectar ao backend

#### **Diagnóstico**
```bash
# Verificar portas em uso
lsof -i :3001 :3002 :3000 :8888

# Verificar processos Node.js
ps aux | grep node
```

#### **Solução**
```bash
# Matar processos se necessário
killall node

# Configurar portas alternativas
echo "SERVER_PORT=3002" >> server/.env.development
echo "VITE_API_BASE='http://localhost:3002/api'" > frontend/.env

# Reiniciar desenvolvimento
./scripts/manage-env-simple.sh dev
```

### **2. CORS Issues**

#### **Sintomas**
- API calls falhando no frontend
- Browser console mostra CORS errors

#### **Diagnóstico**
```bash
# Verificar configuração frontend
cat frontend/.env | grep VITE_API_BASE

# Deve apontar para mesma porta do servidor
```

#### **Solução**
```bash
# Ajustar frontend para porta correta do servidor
echo "VITE_API_BASE='http://localhost:3002/api'" > frontend/.env

# Reiniciar frontend
cd frontend && yarn dev
```

## 🔧 Scripts de Diagnóstico

### **Script de Diagnóstico Completo**
```bash
#!/bin/bash
# diagnose-deploy-production.sh

echo "=== DIAGNÓSTICO DEPLOY PRODUCTION ==="

echo "1. Git Status:"
git status --porcelain
git branch --show-current

echo -e "\n2. Node.js Environment:"
node --version
yarn --version
pm2 --version 2>/dev/null || echo "PM2 não instalado"

echo -e "\n3. Portas em Uso:"
lsof -i :3001 :3002 :3000 :8888 2>/dev/null || echo "Nenhuma porta em uso"

echo -e "\n4. Processos Node:"
ps aux | grep node | grep -v grep || echo "Nenhum processo Node ativo"

echo -e "\n5. Status PM2 (se aplicável):"
pm2 status 2>/dev/null || echo "PM2 não configurado"

echo -e "\n6. Verificar Frontend Build:"
ls -la frontend/dist/ 2>/dev/null || echo "Frontend não buildado"

echo -e "\n7. Verificar Assets Server:"
ls -la server/public/ 2>/dev/null || echo "Server public vazio"

echo -e "\n8. Test API Local:"
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3002/api/ping 2>/dev/null || echo "API não respondendo"

echo -e "\n=== FIM DIAGNÓSTICO ==="
```

### **Script de Reset Desenvolvimento**
```bash
#!/bin/bash
# reset-dev-environment.sh

echo "🔄 Resetando ambiente de desenvolvimento..."

echo "1. Parando processos..."
killall node 2>/dev/null || true

echo "2. Limpando configurações..."
rm -f server/.env.development frontend/.env collector/.env

echo "3. Reinstalando setup..."
./scripts/setup-simple.sh

echo "4. Iniciando serviços..."
./scripts/manage-env-simple.sh dev

echo "🎉 Reset concluído!"
```

## 📊 Comandos de Validação Rápida

### **Desenvolvimento Local**
```bash
# Status geral
./scripts/manage-env-simple.sh status

# Health checks
curl http://localhost:3002/api/ping          # Server
curl http://localhost:8888/ping              # Collector
curl http://localhost:3004                   # Frontend

# Verificar logs
tail -f server/logs/*.log
```

### **Produção (PM2)**
```bash
# Status PM2
pm2 status
pm2 logs --lines 50

# Health checks
curl -I http://localhost:3001/api/ping       # API
curl -I https://gpt.jholy.com.br             # Frontend HTTPS
curl -I http://gpt.jholy.com.br              # Redirect test

# Verificar SSL
certbot certificates
systemctl status certbot.timer
```

## 🆘 Procedimentos de Emergency

### **Rollback Completo (Desenvolvimento)**
```bash
# 1. Parar tudo
killall node

# 2. Reset git (se necessário)
git stash
git checkout main
git pull origin main

# 3. Setup limpo
rm -rf node_modules */node_modules
yarn setup

# 4. Restart
./scripts/manage-env-simple.sh dev
```

### **Rollback Produção (Docker)**
```bash
# Se migração nativa falhar, voltar para Docker
cd /opt/anythingllm-docker-backup

# Parar PM2
pm2 stop all
pm2 delete all

# Restart Docker
docker-compose -f docker-compose.production.yml up -d

# Verificar funcionamento
curl -I http://localhost:3001/api/ping
```

## 📋 Checklists de Validação

### **Pré-Deploy Checklist**
- [ ] Código commitado e sincronizado
- [ ] Environment variables definidas
- [ ] Frontend buildado (`yarn build`)
- [ ] Assets copiados (`cp -r frontend/dist/* server/public/`)
- [ ] PM2 config com extensão `.cjs`

### **Pós-Deploy Checklist**
- [ ] PM2 services online (`pm2 status`)
- [ ] API respondendo (`curl -I http://localhost:3001/api/ping`)
- [ ] Frontend carregando (`curl -I http://localhost:3001/`)
- [ ] Static files com MIME correto (`curl -I http://localhost:3001/index.js`)
- [ ] Logs sem erros (`pm2 logs`)

### **SSL Implementation Checklist**
- [ ] DNS resolvendo (`nslookup domain.com`)
- [ ] Firewall configurado (`ufw allow 'Nginx Full'`)
- [ ] Certificado obtido (`certbot certificates`)
- [ ] HTTPS funcionando (`curl -I https://domain.com`)
- [ ] Redirect HTTP→HTTPS (`curl -I http://domain.com`)
- [ ] Renovação automática (`systemctl status certbot.timer`)

## 🔗 Links de Referência

- **[Sessão Principal](sessao-deploy-production.md)** - Documentação completa
- **[Base de Prompts](prompts-utilizados-deploy-production.md)** - Comandos reutilizáveis
- **[CLAUDE.md](../../CLAUDE.md)** - Orientações gerais do projeto

---

**💡 Dica**: Sempre executar diagnóstico completo antes de iniciar troubleshooting. A maioria dos problemas tem causas óbvias que aparecem no diagnóstico inicial.