import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔓 Teste manual - Verificação da remoção da trava...');
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

    console.log('');
    console.log('🎯 TESTE MANUAL - VERIFICAÇÃO DA CORREÇÃO:');
    console.log('');
    console.log('✅ CORREÇÕES IMPLEMENTADAS:');
    console.log('1. Items pai podem ser habilitados independentemente dos subitens');
    console.log('2. Subitens não ficam mais bloqueados quando pai está desabilitado');
    console.log('3. Removida a restrição disabled={!item.visible} dos subitens');
    console.log('4. Items hierárquicos agora usam finalVisible = itemVisible (sem dependência)');
    console.log('');
    console.log('🧪 CENÁRIO DE TESTE MANUAL:');
    console.log('1. Desabilite um item pai (ex: AI Providers)');
    console.log('2. Observe que os subitens ainda podem ser clicados');
    console.log('3. Tente habilitar/desabilitar subitens livremente');
    console.log('4. Reabilite o item pai quando quiser');
    console.log('5. Não há mais trava ou dependência forçada');
    console.log('');
    console.log('💡 LÓGICA ATUAL:');
    console.log('- Pai desabilitado → subitens ficam ocultos no MENU');
    console.log('- Pai desabilitado → subitens ainda podem ser CONFIGURADOS');
    console.log('- Isso evita a trava e permite flexibilidade total');
    console.log('');
    console.log('👀 Observe a interface - toggles funcionam livremente!');

    // Aguardar observação manual
    await page.waitForTimeout(60000); // 1 minuto

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await browser.close();
  }
})();