import { chromium } from 'playwright';

async function debugConsole() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const page = await browser.newPage();

  // Capturar todos os logs do console
  const consoleLogs = [];
  const errors = [];

  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    consoleLogs.push(`[${type.toUpperCase()}] ${text}`);
    console.log(`🔍 [CONSOLE-${type.toUpperCase()}] ${text}`);
  });

  page.on('pageerror', (error) => {
    errors.push(error.message);
    console.log(`❌ [PAGE ERROR] ${error.message}`);
  });

  page.on('requestfailed', (request) => {
    console.log(`🚫 [REQUEST FAILED] ${request.url()} - ${request.failure()?.errorText}`);
  });

  try {
    console.log('🚀 Navegando para http://localhost:3000...');

    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Login
    console.log('🔐 Fazendo login...');
    const userInput = await page.$('input[type="email"], input[type="text"], input[name="username"]');
    const passwordInput = await page.$('input[type="password"]');

    if (userInput && passwordInput) {
      await userInput.fill('jholy');
      await passwordInput.fill('Jholy1234tuna');

      const loginButton = await page.$('button[type="submit"], button:has-text("Login"), button:has-text("Entrar")');
      if (loginButton) {
        await loginButton.click();
        await page.waitForTimeout(3000);
      }
    }

    // Aguardar e encontrar workspace
    console.log('🔍 Procurando workspaces...');
    await page.waitForTimeout(2000);

    const workspaceLinks = await page.$$('a[href*="/workspace/"]');

    if (workspaceLinks.length > 0) {
      console.log(`✅ Encontrados ${workspaceLinks.length} workspaces.`);

      // Pegar a URL do primeiro workspace
      const workspaceUrl = await workspaceLinks[0].getAttribute('href');
      console.log(`🔗 URL do workspace: ${workspaceUrl}`);

      console.log('🖱️  Clicando no workspace...');
      await workspaceLinks[0].click();

      // Aguardar navegação
      await page.waitForTimeout(5000);

      console.log(`📍 URL atual após clique: ${page.url()}`);

      // Aguardar mais um pouco para ver se a página carrega
      console.log('⏳ Aguardando página carregar...');
      await page.waitForTimeout(10000);

      // Verificar se há elementos na página
      const bodyContent = await page.textContent('body');
      console.log(`📄 Tamanho do conteúdo da página: ${bodyContent?.length || 0} caracteres`);

      if (bodyContent && bodyContent.trim().length > 0) {
        console.log(`📝 Primeiros 200 caracteres: ${bodyContent.substring(0, 200)}...`);
      } else {
        console.log('⚠️  Página parece estar vazia!');
      }

      // Verificar todos os elementos React
      const reactElements = await page.$$eval('*', (elements) => {
        return elements.filter(el => {
          return el.hasAttribute('data-reactroot') ||
                 el.className.includes('react') ||
                 Object.keys(el).some(key => key.startsWith('__react'));
        }).length;
      });

      console.log(`⚛️  Elementos React encontrados: ${reactElements}`);

      // Verificar se há erros de JavaScript
      const jsErrors = await page.evaluate(() => {
        const errors = [];
        const originalError = window.console.error;
        window.console.error = function(...args) {
          errors.push(args.join(' '));
          originalError.apply(console, args);
        };
        return window.__jsErrors || [];
      });

      console.log(`🐛 Erros JavaScript capturados: ${jsErrors.length}`);
      jsErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });

      // Fazer screenshot da página em branco
      await page.screenshot({ path: 'debug-blank-page.png', fullPage: true });
      console.log('📷 Screenshot da página em branco salvo como debug-blank-page.png');

    }

    // Aguardar para análise manual
    console.log('⏳ Aguardando 15 segundos para análise...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('❌ Erro durante debug:', error.message);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
  } finally {
    // Resumo dos logs
    console.log('\n📊 RESUMO DOS LOGS:');
    console.log(`Total de logs do console: ${consoleLogs.length}`);
    console.log(`Total de erros de página: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ ERROS ENCONTRADOS:');
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    await browser.close();
    console.log('🔚 Debug finalizado');
  }
}

debugConsole().catch(console.error);