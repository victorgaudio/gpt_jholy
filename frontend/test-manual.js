import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000  // Slow down actions for manual observation
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar logs do console
  page.on('console', msg => {
    console.log('🔍 CONSOLE:', msg.text());
  });

  try {
    console.log('🚀 Abrindo aplicação para teste manual...');
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

    console.log('📋 Aplicação pronta para teste manual!');
    console.log('');
    console.log('🧪 INSTRUÇÕES PARA TESTE MANUAL:');
    console.log('1. Observe o menu lateral esquerdo');
    console.log('2. Verifique se "AI Providers" está visível');
    console.log('3. Se estiver, clique para expandir e veja os subitens');
    console.log('4. Navegue para Settings > Tools > Visibilidade do Menu');
    console.log('5. Teste os toggles dos itens e subitens');
    console.log('6. Verifique se as mudanças refletem no menu lateral');
    console.log('');
    console.log('👀 Teste manual em andamento... Feche o navegador quando terminar.');

    // Aguardar até o navegador ser fechado manualmente
    await page.waitForTimeout(10 * 60 * 1000); // 10 minutos max

  } catch (error) {
    console.error('❌ Erro:', error);
  }
})();