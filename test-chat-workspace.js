import { chromium } from 'playwright';

async function testChatWorkspace() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const page = await browser.newPage();

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

    // Procurar por workspace existente ou criar um novo
    console.log('🔍 Procurando workspaces...');

    // Aguardar a página carregar completamente
    await page.waitForTimeout(2000);

    // Procurar por links de workspace na sidebar ou área principal
    const workspaceLinks = await page.$$('a[href*="/workspace/"], button:has-text("workspace"), .workspace');

    if (workspaceLinks.length > 0) {
      console.log(`✅ Encontrados ${workspaceLinks.length} workspaces. Clicando no primeiro...`);
      await workspaceLinks[0].click();
      await page.waitForTimeout(3000);
    } else {
      // Tentar criar um novo workspace
      console.log('📝 Tentando criar um novo workspace...');

      const createWorkspaceBtn = await page.$('button:has-text("Create"), button:has-text("workspace"), button:has-text("New")');
      if (createWorkspaceBtn) {
        await createWorkspaceBtn.click();
        await page.waitForTimeout(2000);

        // Preencher nome do workspace se necessário
        const nameInput = await page.$('input[placeholder*="name"], input[name="name"]');
        if (nameInput) {
          await nameInput.fill('Test Workspace');

          const submitBtn = await page.$('button[type="submit"], button:has-text("Create")');
          if (submitBtn) {
            await submitBtn.click();
            await page.waitForTimeout(3000);
          }
        }
      }
    }

    // Agora procurar pela interface de chat
    console.log('💬 Procurando interface de chat...');

    // Aguardar elementos de chat carregarem
    await page.waitForTimeout(2000);

    // Procurar pelo campo de input de mensagem
    const chatInput = await page.$('textarea[placeholder*="message"], textarea[id*="prompt"], textarea[class*="prompt"], #primary-prompt-input');

    if (chatInput) {
      console.log('✅ Campo de mensagem encontrado!');

      // Verificar botões visíveis ao redor do input
      const chatContainer = await page.$('.chat, [class*="chat"], [class*="prompt"]');

      let visibleButtons = [];
      if (chatContainer) {
        visibleButtons = await chatContainer.$$eval('button:visible', buttons =>
          buttons.map(btn => ({
            text: btn.textContent?.trim() || '',
            title: btn.title || btn.getAttribute('data-tooltip-content') || '',
            ariaLabel: btn.getAttribute('aria-label') || '',
            className: btn.className
          })).filter(btn => btn.text || btn.title || btn.ariaLabel)
        );
      } else {
        visibleButtons = await page.$$eval('button:visible', buttons =>
          buttons.map(btn => ({
            text: btn.textContent?.trim() || '',
            title: btn.title || btn.getAttribute('data-tooltip-content') || '',
            ariaLabel: btn.getAttribute('aria-label') || '',
            className: btn.className
          })).filter(btn => btn.text || btn.title || btn.ariaLabel)
        );
      }

      console.log('🔘 Botões visíveis na interface de chat:');
      visibleButtons.forEach((btn, index) => {
        const label = btn.text || btn.title || btn.ariaLabel;
        console.log(`  ${index + 1}. "${label}" ${btn.title ? `(${btn.title})` : ''}`);
      });

      // Verificar especificamente os botões que deveriam estar ocultos/visíveis
      const expectedVisible = ['anexar', 'attach', 'file', 'tamanho', 'size', 'send', 'enviar'];
      const expectedHidden = ['slash', 'command', 'agent', 'llm', 'selector', 'speech', 'voice'];

      console.log('\n📊 Análise dos botões:');

      const visibleButtonsText = visibleButtons.map(b =>
        (b.text + ' ' + b.title + ' ' + b.ariaLabel).toLowerCase()
      ).join(' ');

      expectedVisible.forEach(keyword => {
        const found = visibleButtonsText.includes(keyword);
        console.log(`  ✅ ${keyword}: ${found ? 'VISÍVEL ✓' : 'NÃO ENCONTRADO ✗'}`);
      });

      expectedHidden.forEach(keyword => {
        const found = visibleButtonsText.includes(keyword);
        console.log(`  ❌ ${keyword}: ${found ? 'AINDA VISÍVEL ✗' : 'OCULTO ✓'}`);
      });

      // Fazer screenshot da interface de chat
      await page.screenshot({ path: 'chat-interface-final.png', fullPage: true });
      console.log('📷 Screenshot da interface de chat salvo como chat-interface-final.png');

      // Testar o campo de input
      console.log('✏️  Testando campo de input...');
      await chatInput.fill('Teste de mensagem - botões ocultos funcionando!');
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'chat-with-message.png' });
      console.log('📷 Screenshot com mensagem salvo como chat-with-message.png');

    } else {
      console.log('❌ Campo de mensagem não encontrado');

      // Debug: mostrar o que está na página
      const pageText = await page.textContent('body');
      console.log('📄 Conteúdo da página atual:', pageText.substring(0, 500) + '...');

      await page.screenshot({ path: 'debug-no-chat.png', fullPage: true });
      console.log('📷 Screenshot de debug salvo como debug-no-chat.png');
    }

    // Aguardar para inspeção manual
    console.log('⏳ Aguardando 15 segundos para inspeção manual...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    await page.screenshot({ path: 'error-workspace-test.png', fullPage: true });
    console.log('📷 Screenshot do erro salvo como error-workspace-test.png');
  } finally {
    await browser.close();
    console.log('🔚 Teste finalizado');
  }
}

testChatWorkspace().catch(console.error);