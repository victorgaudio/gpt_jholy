# Base de Conhecimento: Prompts Utilizados na Sessão

Este documento contém todos os prompts principais utilizados durante a sessão de setup local do AnythingLLM, servindo como base de conhecimento para futuras sessões.

## 📝 Contexto da Sessão

**Objetivo**: Setup local lean do AnythingLLM com APIs online
**Duração**: ~2 horas
**Status**: ✅ Concluída com sucesso

## 🗣 Prompts do Usuário (Íntegra)

### Prompt Inicial - Definição de Estratégia Lean

```
acredito que o ollama local fique muito pesado para a maquina. consigo usar api keys de llms online. minha intencao nesse momento é levantar o projeto localmente da forma mais enxuta possivel, de forma que depois tenha pouco atrito para deployar no digital ocean. dessa forma existem alteracoes para seu plano de levantamento do sistema localmente? pense sempre de forma enxuta e com o minimo de alteracoes ou friccao
```

**Contexto**: User rejeitou abordagem com Ollama, priorizando configuração lean com APIs online.

**Resultado**: Pivô completo para estratégia OpenAI-first, eliminando overhead local.

### Prompt de Validação - Verificação de Documentação

```
verifique se na documentacao do projeto já há instruções para um deploy local e depois online com o que estamos planejando e pesquise online por orientações tb para sabermos se o que estamos planejando está adequado ou se há orientacoes que já estão prontas na documentacao original do projeto
```

**Contexto**: Verificação de compatibilidade com documentação oficial antes de prosseguir.

**Resultado**: Confirmação de 100% compatibilidade com docs oficiais, criação do arquivo `COMPATIBILIDADE.md`.

### Prompt de Execução - Início do Setup

```
vamos em frente. levante ele localmente por favor
```

**Contexto**: Autorização para iniciar o processo de setup após validação.

**Resultado**: Execução dos scripts automatizados e descoberta dos conflitos de porta.

### Prompt de Debug - Investigação com Playwright

```
acesse o frontend usando o playwright e verifique o que está acontecendo
```

**Contexto**: Frontend carregando mas não funcionando completamente, necessidade de debug visual.

**Resultado**: Identificação dos problemas CORS e resolução completa.

### Prompt de Documentação - Solicitação de Documentação Completa

```
o que foi executado e o que foi aprendido nesse ciclo e como podemos deixar a documentacao do projeto relevante com as informacoes do que foi feito aqui e como foram resolvidos os problemas? no readme vale ter o incremento das orientacoes para se levantar o projeto localmente e orientacoes de quais configuracoes precisam ser feitas, e em uma pasta chamada docs, a ser criada na raiz do projeto, precisamos de uma documentacao mais elaborada de como foi executada essa etapa, os problemas que enfrentamos e as solucoes aplicadas. bem como um passo a passo para se executar novamente o que foi o objetivo final dessa etapa, ja contando com as correcoes aplicadas, para que proximos ciclos de desenvolvimentos estejam contextualizados com o que foi executado nessa sessão e consigam executar o objetivo que foi dessa sessao. ou seja, documentar qual foi o objetivo, o que foi feito, quais problemas passamos e como foi reslvido e já com as correcoes aplicadas, como executar novamente o objetivo que foi essa etapa, ou orientar para etapas que sejam similares e o que vivemos nessa etapa possa auxiliar com informacoes relevantes. e por fim, como seria adaptar o CLAUDE.md para estar atualizado com os aprnedizados e implantações dessa etapa. se consegui na pasta doc tb sintetizar quais prompts foram feitos nessa etapa seria otimo para termos uma base de conhecimento de prompts feitos (em sua integra) que foram utilizados nessa etapa
```

**Contexto**: Solicitação abrangente de documentação para preservar conhecimento da sessão.

**Resultado**: Este documento e toda a estrutura de documentação criada.

### Prompt de Ajuste - Inclusão de Mensagem de Commit

```
está perfeita, pode seguir dessa forma, só esqueci de incluir a necessidade de se criar o comentario que vai ser incluído no commit, sem fazer o commit ou qq operacao no git, apenas criar o comentario que pode ser incluido para que o usuario copie e cole. esse conteudo pode estar em alguma sessao do doc que vai ser criado dentro da pasta doc que contem outras informacoes sobre a sessão, tendo mais esse informacao nele.
```

**Contexto**: Solicitação para incluir mensagem de commit pronta na documentação.

**Resultado**: Mensagem de commit estruturada incluída em `docs/sessao-setup-local.md`.

## 🤖 Prompts Internos do Claude (Principais)

### Análise de Estratégia Lean

**Prompt interno implícito**: Como configurar AnythingLLM priorizando APIs online sobre modelos locais?

**Estratégia aplicada**:
- Eliminação completa do Ollama
- Configuração OpenAI como padrão
- Manutenção de compatibilidade total com documentação oficial
- Criação de scripts automatizados

### Debug Sistemático

**Prompt interno implícito**: Como diagnosticar problemas de conectividade frontend-backend?

**Abordagem aplicada**:
1. Verificação de logs de servidor
2. Análise de configurações de porta
3. Teste de endpoints API diretamente
4. Debug visual com Playwright
5. Análise de erros CORS no browser

### Documentação Estruturada

**Prompt interno implícito**: Como criar documentação que preserve conhecimento e facilite reprodução?

**Estrutura criada**:
- Resumo executivo da sessão
- Problemas específicos e soluções
- Comandos de reprodução
- Base de conhecimento de prompts
- Guias de troubleshooting

## 🛠 Prompts de Debugging Técnico

### Investigação de Conflitos de Porta

```bash
# Prompt técnico aplicado
lsof -i :3001  # Verificar o que usa a porta
netstat -an | grep LISTEN  # Ver todas as portas ocupadas
```

**Contexto**: Servidor falhando ao iniciar por conflito de porta.

**Solução**: Migração para porta 3002.

### Análise de CORS

```javascript
// Prompt técnico aplicado no browser console
fetch('http://localhost:3001/api/ping')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Contexto**: Frontend não conseguindo acessar API.

**Solução**: Correção da URL do frontend.

### Validação com Playwright

```javascript
// Script de debug automático
const response = await page.evaluate(async () => {
    try {
        const resp = await fetch('http://localhost:3002/api/ping');
        return {
            status: resp.status,
            ok: resp.ok,
            data: await resp.text()
        };
    } catch (error) {
        return { error: error.message };
    }
});
```

**Contexto**: Necessidade de validação automatizada da interface.

**Resultado**: Confirmação de funcionamento completo.

## 🎯 Prompts de Configuração

### Setup de Environment Variables

```bash
# Prompts de configuração aplicados
echo "SERVER_PORT=3002" >> server/.env.development
echo "VITE_API_BASE='http://localhost:3002/api'" > frontend/.env
```

**Contexto**: Necessidade de ajustar configurações após conflitos.

**Resultado**: Sistema funcionando em portas alternativas.

### Verificação de Compatibilidade

**Prompt conceitual**: A configuração lean mantém compatibilidade com documentação oficial?

**Verificação realizada**:
- ✅ Segue práticas de `yarn setup`
- ✅ Usa estrutura de 3 serviços oficial
- ✅ Mantém configurações via .env
- ✅ Suporta deploy Digital Ocean sem mudanças

## 📊 Padrões de Prompts Identificados

### 1. Prompts de Estratégia (User)
- Focam em objetivos de alto nível
- Priorizam eficiência e baixo atrito
- Consideram context de deploy futuro

### 2. Prompts de Execução (User)
- Diretos e orientados a ação
- Confiam na estratégia já validada
- Delegam detalhes técnicos

### 3. Prompts de Debug (Claude)
- Sistemáticos e metódicos
- Usam múltiplas ferramentas de verificação
- Documentam o processo de investigação

### 4. Prompts de Documentação (User)
- Abrangentes e orientados ao futuro
- Focam em reproduzibilidade
- Valorizam preservação de conhecimento

## 🚀 Reutilização de Prompts

### Para Setup Similar
```
Configure [projeto] de forma enxuta usando APIs online ao invés de modelos locais, priorizando baixo atrito para deploy futuro em [plataforma cloud].
```

### Para Debug de Conectividade
```
Use Playwright para acessar o frontend e verificar o que está acontecendo, capturando logs de console e erros de rede.
```

### Para Resolução de Conflitos de Porta
```
Identifique processos usando porta [X] e configure porta alternativa, atualizando todas as referências necessárias.
```

### Para Documentação de Sessão
```
Documente o que foi executado, problemas enfrentados, soluções aplicadas e como reproduzir, incluindo mensagem de commit pronta para uso.
```

## 🎓 Aprendizados sobre Prompting

### Efetivos
- **Específicos sobre contexto**: "forma mais enxuta possível"
- **Orientados a objetivo**: "pouco atrito para deploy"
- **Incluem restrições**: "sem fazer commit"
- **Solicitam documentação**: "prompts em sua íntegra"

### Padrões de Sucesso
- Combinar estratégia + execução + validação + documentação
- Delegar detalhes técnicos após alinhamento de estratégia
- Solicitar múltiplas perspectivas (docs oficiais + experiência)
- Incluir requisitos não-funcionais (performance, manutenibilidade)

---

**Última atualização**: 20 de Setembro de 2025
**Uso**: Base de conhecimento para futuras sessões de setup e troubleshooting
**Próximos passos**: Expandir com prompts de deploy e otimização