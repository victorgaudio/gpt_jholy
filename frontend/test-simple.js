import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar logs do console
  page.on('console', msg => {
    console.log('🔍 CONSOLE:', msg.text());
  });

  try {
    console.log('🚀 Navegando para a aplicação...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    console.log('🔐 Fazendo login...');
    const usernameField = await page.locator('input[type="text"]').first();
    const passwordField = await page.locator('input[type="password"]').first();
    const loginButton = await page.locator('button[type="submit"]').first();

    await usernameField.fill('jholy');
    await passwordField.fill('Jholy1234tuna');
    await loginButton.click();
    await page.waitForTimeout(3000);

    console.log('⚙️ Navegando para Menu Visibility...');
    await page.goto('http://localhost:3000/settings/menu-visibility');
    await page.waitForTimeout(3000);

    console.log('🧪 Testando toggle diretamente via JavaScript...');

    // Executar teste diretamente no navegador
    const testResult = await page.evaluate(() => {
      // Buscar primeiro toggle de LLM
      const llmCheckboxes = document.querySelectorAll('input[type="checkbox"]');
      let llmCheckbox = null;

      // Encontrar o checkbox do LLM
      for (let cb of llmCheckboxes) {
        const parentDiv = cb.closest('.flex.items-center.justify-between');
        if (parentDiv && parentDiv.textContent.includes('LLM')) {
          llmCheckbox = cb;
          break;
        }
      }

      if (!llmCheckbox) {
        return { success: false, error: 'LLM checkbox não encontrado' };
      }

      const initialState = llmCheckbox.checked;
      console.log('🎛️ Estado inicial do LLM:', initialState);

      // Simular clique no checkbox
      llmCheckbox.click();

      const newState = llmCheckbox.checked;
      console.log('🎛️ Novo estado do LLM:', newState);

      return {
        success: true,
        initialState,
        newState,
        changed: initialState !== newState
      };
    });

    console.log('📊 Resultado do teste:', testResult);

    if (testResult.success && testResult.changed) {
      console.log('✅ Toggle funcionou! Verificando localStorage...');

      const localStorage = await page.evaluate(() => {
        return window.localStorage.getItem('anythingllm_menu_visibility_settings');
      });

      console.log('💾 LocalStorage após toggle:', localStorage);

      console.log('🔙 Testando visibilidade no menu...');
      await page.goto('http://localhost:3000/settings/llm-preference');
      await page.waitForTimeout(2000);

      const llmVisible = await page.locator('text=LLM').first().isVisible();
      console.log('👁️ LLM visível no menu após toggle:', llmVisible);

    } else {
      console.log('❌ Toggle não funcionou:', testResult.error || 'Estado não mudou');
    }

    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await browser.close();
  }
})();