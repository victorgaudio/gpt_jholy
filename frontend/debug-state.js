import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🚀 Navegando para debug do estado...');
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

    console.log('🔍 Verificando estado do MenuSettings...');

    const debugInfo = await page.evaluate(() => {
      // Verificar se MenuSettings está disponível
      if (typeof window.MenuSettings === 'undefined') {
        return { error: 'MenuSettings não está disponível no window' };
      }

      const localStorage = window.localStorage.getItem('anythingllm_menu_visibility_settings');

      return {
        localStorageExists: !!localStorage,
        localStorageContent: localStorage,

        // Testar visibilidade de alguns itens chave
        aiProvidersVisible: window.MenuSettings.isMenuItemVisible('ai-providers'),
        llmVisible: window.MenuSettings.isMenuItemVisible('ai-providers', 'llm'),
        adminVisible: window.MenuSettings.isMenuItemVisible('admin'),
        securityVisible: window.MenuSettings.isMenuItemVisible('security'),

        // Obter estado completo de AI Providers
        aiProvidersState: window.MenuSettings.getMenuItemState('ai-providers'),
        llmState: window.MenuSettings.getMenuItemState('ai-providers', 'llm'),

        // Testar configuração padrão
        defaultConfig: window.MenuSettings.DEFAULT_CONFIG['ai-providers'],

        // Obter todos os itens do menu
        allMenuItems: window.MenuSettings.getMenuItems().map(item => ({
          key: item.key,
          name: item.name,
          visible: item.visible,
          hasSubitems: item.hasSubitems,
          subitemsCount: item.subitems ? item.subitems.length : 0
        }))
      };
    });

    console.log('📊 Estado do MenuSettings:');
    console.log('LocalStorage existe:', debugInfo.localStorageExists);
    console.log('LocalStorage content:', debugInfo.localStorageContent);
    console.log('');
    console.log('🎯 Visibilidade dos itens:');
    console.log('AI Providers:', debugInfo.aiProvidersVisible);
    console.log('LLM:', debugInfo.llmVisible);
    console.log('Admin:', debugInfo.adminVisible);
    console.log('Security:', debugInfo.securityVisible);
    console.log('');
    console.log('📋 Estado do AI Providers:', debugInfo.aiProvidersState);
    console.log('📋 Estado do LLM:', debugInfo.llmState);
    console.log('');
    console.log('⚙️ Config padrão AI Providers:', debugInfo.defaultConfig);
    console.log('');
    console.log('📜 Todos os itens do menu:');
    debugInfo.allMenuItems.forEach(item => {
      console.log(`- ${item.name} (${item.key}): visible=${item.visible}, subitems=${item.subitemsCount}`);
    });

    if (debugInfo.error) {
      console.error('❌ Erro:', debugInfo.error);

      // Tentar carregar MenuSettings manualmente
      await page.addScriptTag({
        path: './src/models/menuSettings.js'
      });

      console.log('🔄 Tentando recarregar MenuSettings...');
    }

    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Erro no debug:', error);
  } finally {
    await browser.close();
  }
})();