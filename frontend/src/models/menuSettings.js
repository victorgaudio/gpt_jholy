import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

const MenuSettings = {
  // Configuração padrão dos itens do menu - Nova estrutura hierárquica
  DEFAULT_CONFIG: {
    "ai-providers": {
      visible: true,
      standalone: false, // Item pai depende dos filhos
      subitems: {
        llm: { visible: true, enabled: true },
        "vector-database": { visible: true, enabled: true },
        embedder: { visible: true, enabled: true },
        "text-splitting": { visible: true, enabled: true },
        "voice-speech": { visible: true, enabled: true },
        transcription: { visible: true, enabled: true },
      },
    },
    admin: {
      visible: true,
      standalone: false,
      subitems: {
        users: { visible: true, enabled: true },
        workspaces: { visible: true, enabled: true },
        "workspace-chats": { visible: true, enabled: true },
        invites: { visible: true, enabled: true },
      },
    },
    "agent-skills": {
      visible: true,
      standalone: true, // Item independente (sem filhos)
    },
    "community-hub": {
      visible: false, // Oculto por padrão
      standalone: false,
      subitems: {
        "explore-trending": { visible: false, enabled: true },
        "your-account": { visible: false, enabled: true },
        "import-item": { visible: false, enabled: true },
      },
    },
    customization: {
      visible: true,
      standalone: false,
      subitems: {
        interface: { visible: true, enabled: true },
        branding: { visible: true, enabled: true },
        chat: { visible: true, enabled: true },
      },
    },
    tools: {
      visible: true,
      standalone: false,
      subitems: {
        embeds: { visible: true, enabled: true },
        "event-logs": { visible: true, enabled: true },
        "api-keys": { visible: true, enabled: true },
        "system-prompt-variables": { visible: true, enabled: true },
        "browser-extension": { visible: true, enabled: true },
        "menu-visibility": { visible: true, enabled: true, protected: true },
      },
    },
    security: {
      visible: true,
      standalone: true,
    },
    "experimental-features": {
      visible: true,
      standalone: true,
    },
  },

  // Chave para localStorage
  STORAGE_KEY: "anythingllm_menu_visibility_settings",

  /**
   * Faz merge profundo de duas configurações de menu com estrutura hierárquica
   * @param {Object} defaultConfig - Configuração padrão
   * @param {Object} userConfig - Configuração do usuário
   * @returns {Object} Configuração merged
   */
  deepMergeConfigs(defaultConfig, userConfig) {
    const result = { ...defaultConfig };

    for (const key in userConfig) {
      if (userConfig.hasOwnProperty(key)) {
        const userValue = userConfig[key];
        const defaultValue = defaultConfig[key];

        if (typeof userValue === "boolean") {
          // Item simples (standalone: true)
          result[key] = userValue;
        } else if (
          typeof userValue === "object" &&
          userValue !== null &&
          typeof defaultValue === "object" &&
          defaultValue !== null
        ) {
          // Item com estrutura hierárquica
          result[key] = {
            visible: userValue.hasOwnProperty("visible")
              ? userValue.visible
              : defaultValue.visible,
            standalone: defaultValue.standalone,
            protected: defaultValue.protected,
          };

          // Fazer merge dos subitens se existirem
          if (defaultValue.subitems) {
            result[key].subitems = { ...defaultValue.subitems };

            if (userValue.subitems) {
              for (const subKey in userValue.subitems) {
                if (userValue.subitems.hasOwnProperty(subKey)) {
                  const userSubValue = userValue.subitems[subKey];
                  const defaultSubValue = defaultValue.subitems[subKey];

                  if (typeof userSubValue === "boolean") {
                    // Compatibilidade com formato antigo
                    result[key].subitems[subKey] = {
                      visible: userSubValue,
                      enabled: defaultSubValue ? defaultSubValue.enabled : true,
                      protected: defaultSubValue ? defaultSubValue.protected : false,
                    };
                  } else if (typeof userSubValue === "object" && userSubValue !== null) {
                    // Formato novo
                    result[key].subitems[subKey] = {
                      visible: userSubValue.hasOwnProperty("visible")
                        ? userSubValue.visible
                        : (defaultSubValue ? defaultSubValue.visible : true),
                      enabled: userSubValue.hasOwnProperty("enabled")
                        ? userSubValue.enabled
                        : (defaultSubValue ? defaultSubValue.enabled : true),
                      protected: defaultSubValue ? defaultSubValue.protected : false,
                    };
                  }
                }
              }
            }
          }
        }
      }
    }

    return result;
  },

  /**
   * Normaliza as configurações para garantir estrutura hierárquica consistente
   * @param {Object} config - Configuração a ser normalizada
   * @returns {Object} Configuração normalizada
   */
  normalizeConfig(config) {
    const normalized = {};

    for (const key in config) {
      if (config.hasOwnProperty(key)) {
        const value = config[key];
        const defaultItem = this.DEFAULT_CONFIG[key];

        if (typeof value === "boolean") {
          // Item simples - manter estrutura hierárquica mesmo para standalone
          if (defaultItem && typeof defaultItem === "object") {
            normalized[key] = {
              visible: value,
              standalone: defaultItem.standalone !== undefined ? defaultItem.standalone : true,
              protected: defaultItem.protected || false,
            };
          } else {
            // Fallback para compatibilidade
            normalized[key] = value;
          }
        } else if (typeof value === "object" && value !== null) {
          // Item com estrutura hierárquica
          normalized[key] = {
            visible: typeof value.visible === "boolean" ? value.visible : true,
            standalone: defaultItem ? defaultItem.standalone : false,
            protected: defaultItem ? defaultItem.protected : false,
          };

          // Normalizar subitens se existirem
          if (defaultItem && defaultItem.subitems) {
            normalized[key].subitems = {};

            for (const subKey in defaultItem.subitems) {
              if (defaultItem.subitems.hasOwnProperty(subKey)) {
                const defaultSubValue = defaultItem.subitems[subKey];
                const userSubValue = value.subitems ? value.subitems[subKey] : null;

                if (typeof userSubValue === "boolean") {
                  // Compatibilidade com formato antigo
                  normalized[key].subitems[subKey] = {
                    visible: userSubValue,
                    enabled: defaultSubValue.enabled,
                    protected: defaultSubValue.protected || false,
                  };
                } else if (typeof userSubValue === "object" && userSubValue !== null) {
                  // Formato novo
                  normalized[key].subitems[subKey] = {
                    visible: typeof userSubValue.visible === "boolean" ? userSubValue.visible : defaultSubValue.visible,
                    enabled: typeof userSubValue.enabled === "boolean" ? userSubValue.enabled : defaultSubValue.enabled,
                    protected: defaultSubValue.protected || false,
                  };
                } else {
                  // Usar valores padrão
                  normalized[key].subitems[subKey] = {
                    visible: defaultSubValue.visible,
                    enabled: defaultSubValue.enabled,
                    protected: defaultSubValue.protected || false,
                  };
                }
              }
            }
          }
        }
      }
    }

    return normalized;
  },

  /**
   * Obtém as configurações de visibilidade do menu
   * @returns {Object} Configurações de visibilidade
   */
  getVisibilitySettings() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Usar merge profundo e normalização
        const merged = this.deepMergeConfigs(this.DEFAULT_CONFIG, parsed);
        return this.normalizeConfig(merged);
      }
      return this.normalizeConfig(this.DEFAULT_CONFIG);
    } catch (error) {
      console.error("Erro ao carregar configurações do menu:", error);
      return this.normalizeConfig(this.DEFAULT_CONFIG);
    }
  },

  /**
   * Salva as configurações de visibilidade do menu
   * @param {Object} settings - Configurações de visibilidade
   */
  saveVisibilitySettings(settings) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
      return { success: true };
    } catch (error) {
      console.error("Erro ao salvar configurações do menu:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtém o estado completo de um item do menu (incluindo hierarquia)
   * @param {string} itemKey - Chave do item do menu
   * @param {string} subitemKey - Chave do subitem (opcional)
   * @returns {Object} Estado completo do item
   */
  getMenuItemState(itemKey, subitemKey = null) {
    const settings = this.getVisibilitySettings();
    const itemConfig = settings[itemKey];
    const defaultItem = this.DEFAULT_CONFIG[itemKey];

    if (!itemConfig) {
      return { visible: false, enabled: false, protected: false, exists: false };
    }

    if (subitemKey) {
      // Estado do subitem
      const subitemConfig = itemConfig.subitems?.[subitemKey];
      const defaultSubitem = defaultItem?.subitems?.[subitemKey];

      if (!subitemConfig || !defaultSubitem) {
        return { visible: false, enabled: false, protected: false, exists: false };
      }

      // Subitem protegido (sempre visível)
      if (subitemConfig.protected) {
        return { visible: true, enabled: true, protected: true, exists: true };
      }

      // Lógica hierárquica: subitem só é visível se pai estiver visível
      const parentVisible = typeof itemConfig.visible === "boolean" ? itemConfig.visible : true;
      const subitemVisible = typeof subitemConfig.visible === "boolean" ? subitemConfig.visible : true;
      const finalVisible = parentVisible && subitemVisible && subitemConfig.enabled;

      return {
        visible: finalVisible,
        enabled: subitemConfig.enabled,
        protected: subitemConfig.protected,
        exists: true,
        parentVisible,
        ownVisible: subitemVisible
      };
    } else {
      // Estado do item principal
      if (typeof itemConfig === "boolean") {
        // Item standalone simples
        return { visible: itemConfig, enabled: true, protected: false, exists: true, standalone: true };
      }

      // Item com estrutura hierárquica
      const itemVisible = typeof itemConfig.visible === "boolean" ? itemConfig.visible : true;
      const isProtected = itemConfig.protected || false;

      // Para itens não-standalone, verificar se tem subitens visíveis (apenas para informação)
      let hasVisibleSubitems = true;
      if (!itemConfig.standalone && itemConfig.subitems) {
        hasVisibleSubitems = Object.keys(itemConfig.subitems).some(subKey => {
          const subState = this.getMenuItemState(itemKey, subKey);
          return subState.visible;
        });
      }

      // CORREÇÃO: Item pai pode ser habilitado independentemente dos subitens
      // Isso evita trava onde pai desabilitado impede reativação dos filhos
      const finalVisible = isProtected || itemVisible;

      return {
        visible: finalVisible,
        enabled: true,
        protected: isProtected,
        exists: true,
        standalone: itemConfig.standalone,
        hasVisibleSubitems,
        ownVisible: itemVisible
      };
    }
  },

  /**
   * Verifica se um item do menu deve ser visível (API simplificada)
   * @param {string} itemKey - Chave do item do menu
   * @param {string} subitemKey - Chave do subitem (opcional)
   * @returns {boolean} Se o item deve ser visível
   */
  isMenuItemVisible(itemKey, subitemKey = null) {
    // Sempre manter "Visibilidade do Menu" ativo
    if (itemKey === "tools" && subitemKey === "menu-visibility") {
      return true;
    }

    const state = this.getMenuItemState(itemKey, subitemKey);
    return state.visible;
  },

  /**
   * Alterna a visibilidade de um item do menu com regras hierárquicas
   * @param {string} itemKey - Chave do item do menu
   * @param {string} subitemKey - Chave do subitem (opcional)
   * @returns {Object} Resultado da operação
   */
  toggleMenuItem(itemKey, subitemKey = null) {
    try {
      // Verificar proteção
      const currentState = this.getMenuItemState(itemKey, subitemKey);
      if (currentState.protected) {
        return { success: false, error: "Este item é protegido e não pode ser desativado" };
      }

      if (!currentState.exists) {
        return { success: false, error: "Item não encontrado na configuração" };
      }

      const settings = this.getVisibilitySettings();

      if (subitemKey) {
        // Alternar subitem
        const itemConfig = settings[itemKey];
        if (!itemConfig || !itemConfig.subitems || !itemConfig.subitems[subitemKey]) {
          return { success: false, error: "Subitem não encontrado" };
        }

        const subitemConfig = itemConfig.subitems[subitemKey];
        const currentVisible = typeof subitemConfig.visible === "boolean" ? subitemConfig.visible : true;

        // Toggle da visibilidade do subitem
        settings[itemKey].subitems[subitemKey] = {
          ...subitemConfig,
          visible: !currentVisible
        };

        console.log(`🔍 DEBUG: Toggle subitem ${itemKey}.${subitemKey}: ${currentVisible} -> ${!currentVisible}`);

      } else {
        // Alternar item principal
        const itemConfig = settings[itemKey];

        if (typeof itemConfig === "boolean") {
          // Item standalone simples
          settings[itemKey] = !itemConfig;
        } else if (typeof itemConfig === "object" && itemConfig !== null) {
          // Item com estrutura hierárquica
          const currentVisible = typeof itemConfig.visible === "boolean" ? itemConfig.visible : true;
          settings[itemKey] = {
            ...itemConfig,
            visible: !currentVisible
          };

          // Se desabilitando o pai, avisar sobre subitens
          if (currentVisible && !itemConfig.standalone && itemConfig.subitems) {
            const visibleSubitems = Object.keys(itemConfig.subitems).filter(subKey => {
              const subState = this.getMenuItemState(itemKey, subKey);
              return subState.ownVisible;
            });

            if (visibleSubitems.length > 0) {
              console.log(`🔍 DEBUG: Desabilitando item pai ${itemKey} ocultará ${visibleSubitems.length} subitens`);
            }
          }
        }

        console.log(`🔍 DEBUG: Toggle item principal ${itemKey}: ${currentState.ownVisible} -> ${!currentState.ownVisible}`);
      }

      const result = this.saveVisibilitySettings(settings);

      if (result.success) {
        console.log('🔍 DEBUG: Configurações salvas com sucesso');
      }

      return result;
    } catch (error) {
      console.error("Erro ao alternar item do menu:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Restaura as configurações padrão
   * @returns {Object} Resultado da operação
   */
  resetToDefaults() {
    const normalizedDefaults = this.normalizeConfig(this.DEFAULT_CONFIG);
    return this.saveVisibilitySettings(normalizedDefaults);
  },

  /**
   * Obtém a lista de todos os itens configuráveis do menu com estado hierárquico
   * @returns {Array} Lista de itens do menu com suas configurações
   */
  getMenuItems() {
    // Definir estrutura de metadados para exibição
    const menuStructure = [
      {
        key: "ai-providers",
        name: "AI Providers",
        description: "Configurações de provedores de IA (LLM, Vector DB, etc.)",
        subitems: [
          { key: "llm", name: "LLM", description: "Configurações do modelo de linguagem" },
          { key: "vector-database", name: "Vector Database", description: "Configurações do banco de dados vetorial" },
          { key: "embedder", name: "Embedder", description: "Configurações do embedder" },
          { key: "text-splitting", name: "Text Splitting", description: "Configurações de divisão de texto" },
          { key: "voice-speech", name: "Voice & Speech", description: "Configurações de voz e fala" },
          { key: "transcription", name: "Transcription", description: "Configurações de transcrição" },
        ],
      },
      {
        key: "admin",
        name: "Administração",
        description: "Usuários, workspaces, chats e convites",
        subitems: [
          { key: "users", name: "Usuários", description: "Gerenciamento de usuários" },
          { key: "workspaces", name: "Workspaces", description: "Gerenciamento de workspaces" },
          { key: "workspace-chats", name: "Workspace Chats", description: "Histórico de chats dos workspaces" },
          { key: "invites", name: "Convites", description: "Gerenciamento de convites" },
        ],
      },
      {
        key: "agent-skills",
        name: "Agent Skills",
        description: "Configuração de habilidades dos agentes",
        subitems: null,
      },
      {
        key: "community-hub",
        name: "Community Hub",
        description: "Explorar trending, conta e importar itens",
        subitems: [
          { key: "explore-trending", name: "Explore Trending", description: "Explorar itens em tendência" },
          { key: "your-account", name: "Your Account", description: "Configurações da sua conta" },
          { key: "import-item", name: "Import Item", description: "Importar itens da comunidade" },
        ],
      },
      {
        key: "customization",
        name: "Personalização",
        description: "Interface, branding e configurações de chat",
        subitems: [
          { key: "interface", name: "Interface", description: "Configurações da interface" },
          { key: "branding", name: "Branding e White Label", description: "Configurações de marca e white label" },
          { key: "chat", name: "Chat", description: "Configurações de chat" },
        ],
      },
      {
        key: "tools",
        name: "Ferramentas",
        description: "Embeds, logs, API keys e extensões",
        subitems: [
          { key: "embeds", name: "Embeds", description: "Widgets de chat incorporados" },
          { key: "event-logs", name: "Event Logs", description: "Logs de eventos do sistema" },
          { key: "api-keys", name: "API Keys", description: "Gerenciamento de chaves de API" },
          { key: "system-prompt-variables", name: "System Prompt Variables", description: "Variáveis do prompt do sistema" },
          { key: "browser-extension", name: "Browser Extension", description: "Extensão do navegador" },
          { key: "menu-visibility", name: "Visibilidade do Menu", description: "Configurar visibilidade dos itens do menu" },
        ],
      },
      {
        key: "security",
        name: "Segurança",
        description: "Configurações de segurança do sistema",
        subitems: null,
      },
      {
        key: "experimental-features",
        name: "Recursos Experimentais",
        description: "Funcionalidades em desenvolvimento e testes",
        subitems: null,
      },
    ];

    // Aplicar estado atual a cada item
    return menuStructure.map(item => {
      const itemState = this.getMenuItemState(item.key);
      const processedItem = {
        key: item.key,
        name: item.name,
        description: item.description,
        visible: itemState.visible,
        hasSubitems: item.subitems !== null,
        state: itemState,
      };

      // Processar subitens se existirem
      if (item.subitems) {
        processedItem.subitems = item.subitems.map(subitem => {
          const subitemState = this.getMenuItemState(item.key, subitem.key);
          return {
            key: subitem.key,
            name: subitem.name,
            description: subitem.description,
            visible: subitemState.visible,
            state: subitemState,
          };
        });
      }

      return processedItem;
    });
  },
};

export default MenuSettings;
