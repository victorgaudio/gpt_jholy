import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔧 Testando remoção da legenda e nome do Branding...');
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

    console.log('🔍 Verificando se legenda foi removida...');
    const legend = await page.locator('text=Como funciona a hierarquia').count();
    console.log('📋 Legenda "Como funciona a hierarquia":', legend > 0 ? 'AINDA EXISTE ❌' : 'REMOVIDA ✅');

    const legendBox = await page.locator('text=💡').count();
    console.log('📦 Box da legenda:', legendBox > 0 ? 'AINDA EXISTE ❌' : 'REMOVIDO ✅');

    console.log('🔍 Verificando nome do Branding...');
    const brandingText = await page.locator('text=Branding e White Label').count();
    console.log('🏷️ "Branding e White Label":', brandingText > 0 ? 'ENCONTRADO ✅' : 'NÃO ENCONTRADO ❌');

    const oldBrandingText = await page.locator('text=Marca e Etiqueta Branca').count();
    console.log('🏷️ "Marca e Etiqueta Branca" (antigo):', oldBrandingText > 0 ? 'AINDA EXISTE ❌' : 'REMOVIDO ✅');

    console.log('');
    console.log('🎯 RESULTADO DAS ALTERAÇÕES:');
    if (legend === 0 && brandingText > 0) {
      console.log('✅ Ambas alterações foram aplicadas com sucesso!');
    } else {
      console.log('⚠️ Algumas alterações podem não ter sido aplicadas completamente');
    }

    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await browser.close();
  }
})();