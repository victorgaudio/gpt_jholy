import { chromium } from 'playwright';

async function debugFrontend() {
    console.log('🔍 Debug detalhado do frontend AnythingLLM...');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Capturar todos os logs de console
    const consoleLogs = [];
    page.on('console', msg => {
        const log = `[${msg.type().toUpperCase()}] ${msg.text()}`;
        consoleLogs.push(log);
        console.log(`🖥️  Console: ${log}`);
    });

    // Capturar erros de rede
    const networkErrors = [];
    page.on('response', response => {
        if (!response.ok()) {
            const error = `${response.status()} ${response.url()}`;
            networkErrors.push(error);
            console.log(`🌐 Network Error: ${error}`);
        }
    });

    // Capturar erros de página
    page.on('pageerror', error => {
        console.log(`❌ Page Error: ${error.message}`);
    });

    try {
        console.log('📱 Acessando http://localhost:3000...');

        // Acessar o frontend com timeout maior
        await page.goto('http://localhost:3000', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Aguardar um pouco para JavaScript carregar
        console.log('⏳ Aguardando carregamento do JavaScript...');
        await page.waitForTimeout(5000);

        // Verificar se o React renderizou algo
        const rootContent = await page.evaluate(() => {
            const root = document.getElementById('root');
            return {
                innerHTML: root?.innerHTML?.substring(0, 500) || 'Vazio',
                children: root?.children?.length || 0,
                classes: root?.className || 'Sem classes'
            };
        });

        console.log('🔍 Conteúdo do root:', rootContent);

        // Verificar se há erros JavaScript específicos
        const jsErrors = await page.evaluate(() => {
            const errors = [];

            // Verificar se React carregou
            if (typeof window.React === 'undefined') {
                errors.push('React não está disponível globalmente');
            }

            // Verificar se há elementos React
            const reactElements = document.querySelectorAll('[data-reactroot], [data-react-*]');
            if (reactElements.length === 0) {
                errors.push('Nenhum elemento React encontrado no DOM');
            }

            return errors;
        });

        if (jsErrors.length > 0) {
            console.log('⚠️  Problemas JavaScript detectados:');
            jsErrors.forEach(error => console.log(`   - ${error}`));
        }

        // Verificar se o Vite está funcionando
        const viteCheck = await page.evaluate(() => {
            return {
                hasViteClient: typeof window.__vite__ !== 'undefined',
                hasHMR: typeof window.__vite_plugin_react_preamble_installed__ !== 'undefined',
                scripts: Array.from(document.querySelectorAll('script')).map(s => s.src).filter(s => s)
            };
        });

        console.log('⚡ Status do Vite:', viteCheck);

        // Tentar acessar diretamente alguns recursos do Vite
        const viteClientCheck = await page.evaluate(async () => {
            try {
                const response = await fetch('/@vite/client');
                return { status: response.status, ok: response.ok };
            } catch (error) {
                return { error: error.message };
            }
        });

        console.log('📡 Vite Client Status:', viteClientCheck);

        // Aguardar mais tempo para debug visual
        console.log('⏳ Aguardando 15 segundos para debug visual...');
        await page.waitForTimeout(15000);

        // Resumo final
        console.log('\n📋 RESUMO DO DEBUG:');
        console.log(`   Console Logs: ${consoleLogs.length}`);
        console.log(`   Network Errors: ${networkErrors.length}`);
        console.log(`   Root Children: ${rootContent.children}`);

        if (consoleLogs.length > 0) {
            console.log('\n📝 Últimos Console Logs:');
            consoleLogs.slice(-5).forEach(log => console.log(`   ${log}`));
        }

        if (networkErrors.length > 0) {
            console.log('\n🌐 Network Errors:');
            networkErrors.forEach(error => console.log(`   ${error}`));
        }

    } catch (error) {
        console.error('❌ Erro durante o debug:', error.message);
    } finally {
        await browser.close();
        console.log('✅ Debug concluído!');
    }
}

debugFrontend().catch(console.error);