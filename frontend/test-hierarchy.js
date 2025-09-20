import MenuSettings from './src/models/menuSettings.js';

console.log('🔍 Testando nova estrutura hierárquica...');

try {
  // Testar configuração inicial
  const items = MenuSettings.getMenuItems();
  console.log('Total de itens:', items.length);

  // Verificar AI Providers
  const aiProviders = items.find(i => i.key === 'ai-providers');
  console.log('AI Providers visible:', aiProviders?.visible);
  console.log('AI Providers subitems count:', aiProviders?.subitems?.length);
  console.log('AI Providers state:', aiProviders?.state);

  // Testar visibilidade de LLM
  const llmVisible = MenuSettings.isMenuItemVisible('ai-providers', 'llm');
  console.log('LLM visível:', llmVisible);

  // Obter estado completo do LLM
  const llmState = MenuSettings.getMenuItemState('ai-providers', 'llm');
  console.log('LLM state completo:', llmState);

  // Testar toggle de LLM
  console.log('\n🎛️ Testando toggle do LLM...');
  const toggleResult = MenuSettings.toggleMenuItem('ai-providers', 'llm');
  console.log('Toggle result:', toggleResult);

  if (toggleResult.success) {
    const llmVisibleAfter = MenuSettings.isMenuItemVisible('ai-providers', 'llm');
    console.log('LLM visível após toggle:', llmVisibleAfter);

    const llmStateAfter = MenuSettings.getMenuItemState('ai-providers', 'llm');
    console.log('LLM state após toggle:', llmStateAfter);
  }

  // Testar Community Hub (inicialmente oculto)
  console.log('\n🏢 Testando Community Hub...');
  const communityVisible = MenuSettings.isMenuItemVisible('community-hub');
  console.log('Community Hub visível:', communityVisible);

  const communityState = MenuSettings.getMenuItemState('community-hub');
  console.log('Community Hub state:', communityState);

  console.log('\n✅ Teste básico concluído');

} catch (error) {
  console.error('❌ Erro no teste:', error);
}