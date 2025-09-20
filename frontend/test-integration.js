import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar logs do console
  page.on('console', msg => {
    if (msg.text().includes('🔍 DEBUG') || msg.text().includes('Toggle') || msg.text().includes('Configurações')) {
      console.log('🔍 CONSOLE:', msg.text());
    }
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

    console.log('📋 Verificando estado inicial do menu...');

    // Verificar se menu AI Providers está visível
    const aiProvidersMenuButton = await page.locator('text=AI Providers').first();
    const aiProvidersVisible = await aiProvidersMenuButton.isVisible();
    console.log('✅ AI Providers menu visível:', aiProvidersVisible);

    if (aiProvidersVisible) {
      // Clicar para expandir
      await aiProvidersMenuButton.click();
      await page.waitForTimeout(1000);

      // Verificar subitens
      const llmSubitem = await page.locator('text=LLM').first();
      const llmVisible = await llmSubitem.isVisible();
      console.log('👁️ LLM subitem visível:', llmVisible);

      // Testar outros subitens
      const vectorDbSubitem = await page.locator('text=Vector Database').first();
      const vectorDbVisible = await vectorDbSubitem.isVisible();
      console.log('👁️ Vector Database subitem visível:', vectorDbVisible);
    }

    console.log('⚙️ Navegando para Menu Visibility...');
    await page.goto('http://localhost:3000/settings/menu-visibility');
    await page.waitForTimeout(3000);

    console.log('🎯 Testando toggle do LLM...');

    // Procurar por elementos que contenham "LLM" na página
    const llmElements = await page.locator('text=LLM').count();
    console.log('🔍 Elementos "LLM" encontrados:', llmElements);

    // Buscar pelo checkbox do LLM de forma mais direta
    const allCheckboxes = await page.locator('input[type="checkbox"]').count();
    console.log('🔍 Total de checkboxes encontrados:', allCheckboxes);

    // Tentar encontrar o toggle específico do LLM
    let llmCheckbox = null;
    for (let i = 0; i < allCheckboxes; i++) {
      const checkbox = page.locator('input[type="checkbox"]').nth(i);
      const parentText = await checkbox.locator('..').locator('..').textContent();
      if (parentText && parentText.includes('LLM')) {
        llmCheckbox = checkbox;
        console.log('✅ Encontrado checkbox do LLM:', i);
        break;
      }
    }

    if (llmCheckbox && await llmCheckbox.isVisible()) {
      const initialState = await llmCheckbox.isChecked();
      console.log('🎛️ Estado inicial do LLM toggle:', initialState);

      // Executar toggle através do JavaScript para garantir que funciona
      await page.evaluate(() => {
        console.log('🔍 DEBUG: Testando toggle através do browser...');
        window.MenuSettings?.toggleMenuItem('ai-providers', 'llm');
      });

      await page.waitForTimeout(2000);

      const newState = await llmCheckbox.isChecked();
      console.log('🎛️ Estado após toggle:', newState);

      if (initialState !== newState) {
        console.log('✅ Toggle funcionou! Testando menu...');

        await page.goto('http://localhost:3000/settings/llm-preference');
        await page.waitForTimeout(2000);

        // Verificar se AI Providers ainda está visível
        const aiProviders2 = await page.locator('text=AI Providers').first();
        const aiVisible2 = await aiProviders2.isVisible();
        console.log('🔍 AI Providers visível após toggle:', aiVisible2);

        if (aiVisible2) {
          await aiProviders2.click();
          await page.waitForTimeout(1000);

          const llmAfter = await page.locator('text=LLM').first();
          const llmVisibleAfter = await llmAfter.isVisible();
          console.log('🔍 LLM visível no menu após toggle:', llmVisibleAfter);
        }
      } else {
        console.log('❌ Toggle não mudou o estado');
      }
    } else {
      console.log('❌ Toggle do LLM não encontrado');
    }

    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await browser.close();
  }
})();