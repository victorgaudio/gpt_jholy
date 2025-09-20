import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar logs do console
  page.on('console', msg => {
    if (msg.text().includes('🔍 DEBUG') || msg.text().includes('Toggle subitem') || msg.text().includes('Configurações salvas')) {
      console.log('🔍 CONSOLE LOG:', msg.text());
    }
  });

  try {
    console.log('🚀 Navegando para a aplicação...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    console.log('🔐 Fazendo login...');
    // Tentar encontrar campos de login
    const usernameField = await page.locator('input[type="text"], input[name="username"], input[placeholder*="user"]').first();
    const passwordField = await page.locator('input[type="password"]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Entrar")').first();

    await usernameField.fill('jholy');
    await passwordField.fill('Jholy1234tuna');
    await loginButton.click();
    await page.waitForTimeout(3000);

    console.log('📋 Verificando estado inicial do menu...');
    // Ir direto para o sidebar
    const aiProvidersMenu = await page.locator('text=AI Providers').first();
    if (await aiProvidersMenu.isVisible()) {
      console.log('✅ AI Providers menu encontrado');
      await aiProvidersMenu.click();
      await page.waitForTimeout(1000);

      const llmItem = await page.locator('text=LLM').first();
      const llmVisible = await llmItem.isVisible();
      console.log('👁️ LLM atualmente visível:', llmVisible);
    }

    console.log('⚙️ Navegando para Menu Visibility...');
    await page.goto('http://localhost:3000/settings/menu-visibility');
    await page.waitForTimeout(3000);

    console.log('🔍 Verificando página de configuração...');
    const pageTitle = await page.locator('text=Visibilidade do Menu Admin').first();
    if (await pageTitle.isVisible()) {
      console.log('✅ Página de configuração carregada');
    } else {
      console.log('❌ Página de configuração não encontrada');
      await page.screenshot({ path: 'debug-menu-visibility.png' });
    }

    console.log('🎯 Procurando seção AI Providers...');
    const aiProvidersSection = await page.locator('text=AI Providers').first();
    if (await aiProvidersSection.isVisible()) {
      console.log('✅ Seção AI Providers encontrada');

      console.log('🔍 Procurando toggle do LLM...');
      // Procurar pelo elemento clicável correto (o div do toggle)
      const llmToggleDiv = await page.locator('text=LLM').locator('..').locator('..').locator('div[class*="w-9 h-5"]').first();
      const llmCheckbox = await page.locator('text=LLM').locator('..').locator('..').locator('input[type="checkbox"]').first();

      if (await llmToggleDiv.isVisible()) {
        const isChecked = await llmCheckbox.isChecked();
        console.log('🎛️ Estado atual do toggle LLM:', isChecked ? 'ATIVO' : 'INATIVO');

        console.log('🖱️ Clicando no toggle LLM (div clicável)...');
        await llmToggleDiv.click();
        await page.waitForTimeout(2000);

        const newState = await llmCheckbox.isChecked();
        console.log('🎛️ Novo estado do toggle LLM:', newState ? 'ATIVO' : 'INATIVO');

        console.log('🔙 Testando no menu lateral...');
        // Tentar ir para uma página com menu lateral
        await page.goto('http://localhost:3000/settings/llm-preference');
        await page.waitForTimeout(2000);

        const sidebarLlm = await page.locator('text=LLM').first();
        const llmStillVisible = await sidebarLlm.isVisible();
        console.log('👁️ LLM ainda visível no menu:', llmStillVisible);

      } else {
        console.log('❌ Toggle LLM não encontrado');

        // Debug: Capturar HTML da página para análise
        const pageHTML = await page.content();
        console.log('📄 Salvando HTML para debug...');
        import('fs').then(fs => {
          fs.writeFileSync('/Users/vcg/development/JHOLY/gpt_jholy/frontend/debug-page.html', pageHTML);
        });

        await page.screenshot({ path: '/Users/vcg/development/JHOLY/gpt_jholy/frontend/debug-llm-toggle.png' });

        // Verificar se existe algum LLM na página
        const allLLMTexts = await page.locator('text=LLM').count();
        console.log('🔍 Textos "LLM" encontrados na página:', allLLMTexts);

        // Verificar se AI Providers tem subitens
        const aiProvidersText = await page.locator('text=AI Providers').textContent();
        console.log('📝 Texto da seção AI Providers:', aiProvidersText);
      }
    } else {
      console.log('❌ Seção AI Providers não encontrada');
    }

    console.log('📊 Verificando localStorage...');
    const localStorage = await page.evaluate(() => {
      return window.localStorage.getItem('anythingllm_menu_visibility_settings');
    });
    console.log('💾 LocalStorage:', localStorage);

    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    await page.screenshot({ path: 'debug-error.png' });
  } finally {
    await browser.close();
  }
})();