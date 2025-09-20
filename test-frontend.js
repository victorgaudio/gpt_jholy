const { chromium } = require('playwright');

async function testFrontend() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Navegando para http://localhost:3000...');
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('Título da página:', await page.title());

    // Aguardar carregamento da aplicação
    await page.waitForTimeout(3000);

    // Fazer screenshot
    await page.screenshot({ path: 'frontend-test.png' });
    console.log('Screenshot salvo como frontend-test.png');

    // Verificar se há erros no console
    const logs = [];
    page.on('console', (msg) => {
      logs.push(`${msg.type()}: ${msg.text()}`);
    });

    await page.waitForTimeout(2000);

    console.log('Logs do console:');
    logs.forEach(log => console.log(log));

    // Verificar se a tela de chat está sendo exibida
    const chatElements = await page.$$eval('textarea', (textareas) =>
      textareas.map(t => ({
        id: t.id,
        placeholder: t.placeholder,
        visible: t.offsetParent !== null
      }))
    );

    console.log('Elementos de chat encontrados:', chatElements);

    // Verificar botões na interface de chat
    const buttons = await page.$$eval('button', (btns) =>
      btns.map(b => ({
        text: b.textContent.trim(),
        visible: b.offsetParent !== null,
        title: b.title || b.getAttribute('data-tooltip-content') || ''
      })).filter(b => b.visible && (b.text || b.title))
    );

    console.log('Botões visíveis:', buttons);

    // Aguardar mais um pouco para visualização
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('Erro ao testar frontend:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
  }
}

testFrontend();
