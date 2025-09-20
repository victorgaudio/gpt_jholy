import { chromium } from 'playwright';

async function testChat() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000 // Slow down by 1 second for visualization
  });

  const page = await browser.newPage();

  try {
    console.log('🚀 Navegando para http://localhost:3000...');

    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('📄 Título da página:', await page.title());

    // Wait for the page to load
    await page.waitForTimeout(3000);

    // Take a screenshot
    await page.screenshot({ path: 'homepage.png' });
    console.log('📷 Screenshot salvo como homepage.png');

    // Check if we need to login or if there's a workspace
    const pageContent = await page.content();

    if (pageContent.includes('Login') || pageContent.includes('login')) {
      console.log('🔐 Página de login detectada');
      // Try to find and fill login form if exists

      // Try different input selectors
      let userInput = await page.$('input[type="email"]') ||
                      await page.$('input[name="username"]') ||
                      await page.$('input[placeholder*="username"], input[placeholder*="email"]') ||
                      await page.$('input[type="text"]');

      let passwordInput = await page.$('input[type="password"]');

      if (userInput && passwordInput) {
        console.log('📝 Preenchendo formulário de login...');
        await userInput.fill('jholy');
        await passwordInput.fill('Jholy1234tuna');

        const loginButton = await page.$('button[type="submit"]') ||
                           await page.$('button:has-text("Login")') ||
                           await page.$('button:has-text("Entrar")');

        if (loginButton) {
          await loginButton.click();
          console.log('🔄 Aguardando login...');
          await page.waitForTimeout(5000);
        }
      } else {
        console.log('⚠️  Campos de login não encontrados, tentando continuar...');
      }
    }

    // Look for chat elements
    console.log('🔍 Procurando elementos de chat...');

    // Check for textarea (message input)
    const chatInput = await page.$('textarea[placeholder*="message"], textarea[id*="prompt"], textarea');
    if (chatInput) {
      console.log('✅ Campo de mensagem encontrado!');

      // Check which buttons are visible
      const visibleButtons = await page.$$eval('button:visible', buttons =>
        buttons.map(btn => ({
          text: btn.textContent?.trim() || '',
          title: btn.title || btn.getAttribute('data-tooltip-content') || '',
          className: btn.className,
          id: btn.id
        })).filter(btn => btn.text || btn.title)
      );

      console.log('🔘 Botões visíveis no chat:');
      visibleButtons.forEach((btn, index) => {
        console.log(`  ${index + 1}. "${btn.text}" (${btn.title})`);
      });

      // Take screenshot of chat area
      await page.screenshot({ path: 'chat-interface.png' });
      console.log('📷 Screenshot da interface de chat salvo como chat-interface.png');

    } else {
      console.log('❌ Campo de mensagem não encontrado');

      // Check what's actually on the page
      const headings = await page.$$eval('h1, h2, h3', headings =>
        headings.map(h => h.textContent?.trim()).filter(Boolean)
      );
      console.log('📋 Títulos encontrados na página:', headings);
    }

    // Wait for manual inspection
    console.log('⏳ Aguardando 10 segundos para inspeção manual...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    await page.screenshot({ path: 'error-test.png' });
    console.log('📷 Screenshot do erro salvo como error-test.png');
  } finally {
    await browser.close();
    console.log('🔚 Teste finalizado');
  }
}

testChat().catch(console.error);