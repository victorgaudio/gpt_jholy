# Troubleshooting: CORS e Configuração de Portas

Este documento detalha os problemas específicos de CORS e conflitos de porta enfrentados durante o setup local do AnythingLLM e suas soluções.

## 🔍 Diagnóstico de Problemas

### Como Identificar Conflitos de Porta

#### Sintomas
```bash
# Error típico de porta ocupada
Error: listen EADDRINUSE: address already in use :::3001
```

#### Verificação de Portas
```bash
# Verificar o que está usando porta específica
lsof -i :3001
lsof -i :3002
lsof -i :3000

# Ver todas as portas em uso
netstat -an | grep LISTEN

# macOS específico
sudo lsof -PiTCP -sTCP:LISTEN
```

#### Soluções para Conflitos de Porta

1. **Identificar e Parar Processo**
```bash
# Encontrar PID do processo
lsof -i :3001

# Parar processo específico
kill -9 <PID>
```

2. **Usar Porta Alternativa** (Solução Aplicada)
```bash
# Alterar porta no .env
echo "SERVER_PORT=3002" >> server/.env.development

# Verificar se nova porta está livre
lsof -i :3002
```

## 🌐 Problemas de CORS

### Identificação de Problemas CORS

#### Sintomas no Browser Console
```
Access to fetch at 'http://localhost:3001/api/setup-complete'
from origin 'http://localhost:3000' has been blocked by CORS policy:
Network error
```

#### Sintomas no Network Tab
- Status: `(failed)`
- Type: `cors`
- Response: Empty

### Diagnóstico CORS Step-by-Step

#### 1. Verificar Configuração do Servidor
```javascript
// Verificar se CORS está configurado no server/index.js
app.use(cors({ origin: true }));  // ✅ Permite todas as origens
```

#### 2. Verificar URLs no Frontend
```javascript
// Verificar frontend/.env
VITE_API_BASE='http://localhost:3001/api'  // ❌ Porta errada
VITE_API_BASE='http://localhost:3002/api'  // ✅ Porta correta
```

#### 3. Verificar se Servidor Está Rodando
```bash
# Testar endpoint diretamente
curl http://localhost:3002/api/ping
# Esperado: {"online":true}
```

### Soluções para Problemas CORS

#### Solução 1: Corrigir URL do Frontend (Aplicada)
```bash
# Editar frontend/.env
echo "VITE_API_BASE='http://localhost:3002/api'" > frontend/.env

# Restart frontend para aplicar
cd frontend && yarn dev
```

#### Solução 2: Configuração Manual de CORS (se necessário)
```javascript
// server/index.js - Se precisar de configuração específica
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3004'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

#### Solução 3: Proxy no Vite (Alternativa)
```javascript
// vite.config.js - Se quiser manter frontend na 3000
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true
      }
    }
  }
});
```

## 🛠 Ferramentas de Debug

### Debug com Browser DevTools

#### Network Tab
1. Abrir DevTools (F12)
2. Ir para Network tab
3. Filtrar por `Fetch/XHR`
4. Verificar:
   - Status codes
   - Request URL
   - Response headers

#### Console Tab
1. Procurar erros CORS
2. Verificar se há erros JavaScript
3. Testar requisições manuais:
```javascript
// Testar no console do browser
fetch('http://localhost:3002/api/ping')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

### Debug com Playwright (Automatizado)

#### Script Básico de Teste
```javascript
// test-frontend.js (já existente)
import { chromium } from 'playwright';

async function testFrontend() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // Capturar erros de console
    page.on('console', msg => console.log(`Console: ${msg.text()}`));

    // Capturar erros de rede
    page.on('response', response => {
        if (!response.ok()) {
            console.log(`Network Error: ${response.status()} ${response.url()}`);
        }
    });

    await page.goto('http://localhost:3000');
    // ... resto do teste
}
```

#### Comandos de Teste Manual
```bash
# Testar API diretamente
curl -v http://localhost:3002/api/ping

# Testar com headers específicos
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:3002/api/ping
```

## 📊 Matriz de Troubleshooting

| Problema | Sintoma | Causa Provável | Solução |
|----------|---------|----------------|---------|
| Porta ocupada | `EADDRINUSE` | Processo usando porta | Mudar porta ou parar processo |
| CORS Error | Browser console error | URL incorreta no frontend | Corrigir `VITE_API_BASE` |
| API não responde | Network timeout | Servidor não rodando | Iniciar `yarn dev:server` |
| Frontend branco | Nada carrega | Vite não iniciou | Iniciar `yarn dev:frontend` |
| 404 API | Not found | Endpoint incorreto | Verificar rotas do servidor |

## 🚨 Problemas Comuns e Soluções Rápidas

### Frontend não Conecta na API

#### Checklist Rápido
```bash
# 1. Servidor rodando?
curl http://localhost:3002/api/ping

# 2. Frontend configurado corretamente?
cat frontend/.env | grep VITE_API_BASE

# 3. Portas corretas?
lsof -i :3002  # Servidor
lsof -i :3000  # Frontend (ou 3004)

# 4. Restart frontend após mudança de .env?
cd frontend && yarn dev
```

### Configuração Inconsistente

#### Reset Completo
```bash
# Parar todos os processos
killall node

# Verificar configurações
cat server/.env.development | grep PORT
cat frontend/.env | grep VITE_API_BASE

# Restart em ordem
yarn dev:server &
sleep 5
yarn dev:frontend &
yarn dev:collector &
```

## 🔄 Configurações Padrão Funcionais

### server/.env.development
```bash
SERVER_PORT=3002
LLM_PROVIDER='openai'
OPEN_AI_KEY=your_key_here
OPEN_AI_MODEL_PREF='gpt-4o-mini'
```

### frontend/.env
```bash
VITE_API_BASE='http://localhost:3002/api'
```

### Portas Padrão do Sistema
- **Server**: 3002 (era 3001)
- **Frontend**: 3000 ou primeira porta livre (3004 no nosso caso)
- **Collector**: 8888

## 📝 Logs Úteis para Debug

### Server Logs
```bash
# Ao iniciar servidor, verificar:
yarn dev:server

# Esperado:
# Server running on http://localhost:3002
# Database connected
# CORS enabled
```

### Frontend Logs
```bash
# Ao iniciar frontend, verificar:
yarn dev:frontend

# Esperado:
# VITE v4.5.3 ready in 370 ms
# Local: http://localhost:3004/
# VITE_API_BASE: 'http://localhost:3002/api'
```

### Network Logs (Browser)
```javascript
// No console do browser:
console.log(import.meta.env.VITE_API_BASE);
// Esperado: 'http://localhost:3002/api'
```

---

**Última atualização**: 20 de Setembro de 2025
**Status**: Problemas resolvidos e documentados
**Próximos passos**: Monitoramento contínuo e expansão dos testes automatizados