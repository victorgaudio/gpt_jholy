import { chromium } from 'playwright';

async function testFrontend() {
    console.log('🚀 Iniciando teste do frontend AnythingLLM...');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('📱 Acessando http://localhost:3000...');

        // Acessar o frontend
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

        // Aguardar um pouco para a página carregar completamente
        await page.waitForTimeout(3000);

        // Capturar informações básicas da página
        const title = await page.title();
        console.log(`📄 Título da página: ${title}`);

        // Verificar se há erros no console
        const logs = [];
        page.on('console', msg => {
            logs.push(`${msg.type()}: ${msg.text()}`);
        });

        // Capturar o URL atual
        const currentUrl = page.url();
        console.log(`🔗 URL atual: ${currentUrl}`);

        // Verificar se há elementos principais da interface
        const bodyText = await page.textContent('body');
        console.log(`📝 Primeiros 200 caracteres do body: ${bodyText.substring(0, 200)}...`);

        // Tentar encontrar elementos típicos do AnythingLLM
        const hasLogin = await page.locator('input[type="password"]').count() > 0;
        const hasWorkspace = await page.locator('text=workspace').count() > 0;
        const hasAnythingLLM = await page.locator('text=AnythingLLM').count() > 0;

        console.log(`🔐 Tem formulário de login: ${hasLogin}`);
        console.log(`💼 Menciona workspace: ${hasWorkspace}`);
        console.log(`🤖 Menciona AnythingLLM: ${hasAnythingLLM}`);

        // Verificar se há mensagens de erro visíveis
        const errorElements = await page.locator('.error, .alert-error, [class*="error"]').count();
        console.log(`❌ Elementos de erro encontrados: ${errorElements}`);

        // Capturar screenshot
        await page.screenshot({ path: 'frontend-screenshot.png', fullPage: true });
        console.log('📸 Screenshot salvo como frontend-screenshot.png');

        // Verificar network requests
        console.log('🌐 Verificando requisições de rede...');

        // Fazer uma requisição para a API
        const response = await page.evaluate(async () => {
            try {
                const resp = await fetch('http://localhost:3002/api/ping');
                return {
                    status: resp.status,
                    ok: resp.ok,
                    data: await resp.text()
                };
            } catch (error) {
                return { error: error.message };
            }
        });

        console.log('📡 Resposta da API:', response);

        // Verificar se há elementos específicos do setup inicial
        const setupElements = await page.evaluate(() => {
            const elements = {
                buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(t => t),
                inputs: Array.from(document.querySelectorAll('input')).map(i => i.type),
                headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim()).filter(t => t)
            };
            return elements;
        });

        console.log('🔍 Elementos encontrados:');
        console.log('  Botões:', setupElements.buttons.slice(0, 5));
        console.log('  Inputs:', setupElements.inputs.slice(0, 5));
        console.log('  Headings:', setupElements.headings.slice(0, 5));

        // Aguardar mais um pouco para observar a interface
        console.log('⏳ Aguardando 10 segundos para observação...');
        await page.waitForTimeout(10000);

    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);

        // Tentar capturar screenshot mesmo com erro
        try {
            await page.screenshot({ path: 'frontend-error-screenshot.png', fullPage: true });
            console.log('📸 Screenshot de erro salvo como frontend-error-screenshot.png');
        } catch (screenshotError) {
            console.error('❌ Erro ao capturar screenshot:', screenshotError.message);
        }
    } finally {
        await browser.close();
        console.log('✅ Teste concluído!');
    }
}

testFrontend().catch(console.error);