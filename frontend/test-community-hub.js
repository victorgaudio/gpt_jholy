import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🧪 Testando correção do Community Hub...');
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

    console.log('🔍 Verificando Community Hub...');

    // Procurar pela seção Community Hub
    const communityHubSection = await page.locator('text=Community Hub').first();

    if (await communityHubSection.isVisible()) {
      console.log('✅ Community Hub encontrado');

      // Verificar se tem badge "Hierárquico" (não deveria ter)
      const hierarchicalBadge = communityHubSection.locator('..').locator('..').locator('text=Hierárquico');
      const hasHierarchicalBadge = await hierarchicalBadge.count() > 0;

      console.log('🏷️ Tem badge "Hierárquico":', hasHierarchicalBadge ? 'SIM' : 'NÃO');

      // Verificar se tem contador de subitens (não deveria ter)
      const subitemsCount = communityHubSection.locator('..').locator('..').locator('text=/\\d+\\/\\d+ subitens/');
      const hasSubitemsCount = await subitemsCount.count() > 0;

      console.log('📊 Tem contador de subitens:', hasSubitemsCount ? 'SIM' : 'NÃO');

      // Verificar se há subitens expandidos abaixo (não deveria ter)
      const parentContainer = communityHubSection.locator('..').locator('..').locator('..');
      const subitemsContainer = parentContainer.locator('.ml-8.space-y-2');
      const hasSubitemsContainer = await subitemsContainer.count() > 0;

      console.log('🌳 Tem container de subitens:', hasSubitemsContainer ? 'SIM' : 'NÃO');

      if (!hasHierarchicalBadge && !hasSubitemsCount && !hasSubitemsContainer) {
        console.log('✅ Community Hub está correto - item standalone sem subitens!');
      } else {
        console.log('❌ Community Hub ainda tem elementos hierárquicos');
      }

    } else {
      console.log('❌ Community Hub não encontrado');
    }

    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await browser.close();
  }
})();