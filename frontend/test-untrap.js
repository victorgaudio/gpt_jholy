import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar logs do console
  page.on('console', msg => {
    if (msg.text().includes('🔍 DEBUG')) {
      console.log('🔍 CONSOLE:', msg.text());
    }
  });

  try {
    console.log('🔓 Testando remoção da trava hierárquica...');
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

    console.log('🧪 Simulando cenário de trava...');
    console.log('1️⃣ Primeiro vou desabilitar o item pai "AI Providers"');

    // Encontrar o toggle do AI Providers
    const aiProvidersToggle = await page.locator('text=AI Providers').locator('..').locator('..').locator('input[type="checkbox"]').first();

    if (await aiProvidersToggle.isVisible()) {
      const initialState = await aiProvidersToggle.isChecked();
      console.log('🎛️ Estado inicial AI Providers:', initialState);

      if (initialState) {
        console.log('🔄 Desabilitando AI Providers...');
        await aiProvidersToggle.click();
        await page.waitForTimeout(1000);

        const newState = await aiProvidersToggle.isChecked();
        console.log('🎛️ Novo estado AI Providers:', newState);
      }

      console.log('2️⃣ Agora tentando habilitar um subitem (LLM) mesmo com pai desabilitado...');

      // Procurar pelo toggle do LLM
      const llmToggles = await page.locator('text=LLM').count();
      console.log('🔍 Elementos LLM encontrados:', llmToggles);

      if (llmToggles > 0) {
        // Tentar encontrar o checkbox do LLM nos subitens
        const llmCheckbox = await page.locator('text=LLM').locator('..').locator('..').locator('input[type="checkbox"]').last();

        if (await llmCheckbox.isVisible()) {
          const llmDisabled = await llmCheckbox.isDisabled();
          console.log('🔒 LLM checkbox está desabilitado:', llmDisabled);

          if (!llmDisabled) {
            console.log('✅ SUCESSO: LLM toggle não está mais bloqueado!');

            const llmState = await llmCheckbox.isChecked();
            console.log('🎛️ Estado atual do LLM:', llmState);

            console.log('🔄 Tentando alternar LLM...');
            await llmCheckbox.click();
            await page.waitForTimeout(1000);

            const newLlmState = await llmCheckbox.isChecked();
            console.log('🎛️ Novo estado do LLM:', newLlmState);

            if (llmState !== newLlmState) {
              console.log('🎉 PERFEITO: Toggle do LLM funciona mesmo com pai desabilitado!');
              console.log('✅ Trava hierárquica foi removida com sucesso!');
            } else {
              console.log('❌ Toggle não mudou o estado');
            }

          } else {
            console.log('❌ FALHA: LLM toggle ainda está bloqueado');
          }
        } else {
          console.log('❌ Checkbox do LLM não encontrado');
        }
      }

      console.log('3️⃣ Verificando se pai pode ser reabilitado facilmente...');
      console.log('🔄 Reabilitando AI Providers...');
      await aiProvidersToggle.click();
      await page.waitForTimeout(1000);

      const finalState = await aiProvidersToggle.isChecked();
      console.log('🎛️ Estado final AI Providers:', finalState);

      if (finalState) {
        console.log('✅ AI Providers reabilitado com sucesso!');
      }

    } else {
      console.log('❌ Toggle AI Providers não encontrado');
    }

    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await browser.close();
  }
})();