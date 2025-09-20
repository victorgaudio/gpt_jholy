import React, { useState, useEffect } from "react";
import {
  Gear,
  Eye,
  EyeSlash,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import showToast from "@/utils/toast";
import MenuSettings from "@/models/menuSettings";

export default function MenuVisibility() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = () => {
    try {
      const items = MenuSettings.getMenuItems();
      setMenuItems(items);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar itens do menu:", error);
      showToast("Erro ao carregar configurações do menu", "error");
      setLoading(false);
    }
  };

  const toggleMenuItem = (itemKey, subitemKey = null) => {
    // Verificar se é o item "Visibilidade do Menu" que não pode ser desativado
    if (itemKey === "tools" && subitemKey === "menu-visibility") {
      showToast("Este item não pode ser desativado", "error");
      return;
    }

    const result = MenuSettings.toggleMenuItem(itemKey, subitemKey);
    if (result.success) {
      // Recarregar os itens do menu para refletir as mudanças
      loadMenuItems();
      setHasChanges(true);
      showToast("Configuração atualizada", "success");
    } else {
      showToast("Erro ao atualizar configuração: " + result.error, "error");
    }
  };

  const resetToDefaults = () => {
    if (
      window.confirm(
        "Tem certeza que deseja restaurar as configurações padrão do menu?"
      )
    ) {
      const result = MenuSettings.resetToDefaults();
      if (result.success) {
        loadMenuItems();
        setHasChanges(false);
        showToast("Configurações restauradas para o padrão", "success");
      } else {
        showToast("Erro ao restaurar configurações: " + result.error, "error");
      }
    }
  };

  const refreshPage = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-theme-bg-primary flex">
        <Sidebar />
        <div className="relative w-full h-full flex flex-col">
          <div className="w-full h-full flex justify-center items-center">
            <div className="text-theme-text-primary">Carregando...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-primary flex">
      <Sidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll no-scroll"
      >
        <div className="flex flex-col w-full px-1 md:pl-6 md:pr-6 md:py-6 py-4">
          <div className="w-full flex flex-col gap-y-1 pb-6 border-white light:border-slate-200 border-b-2 border-opacity-10">
            <div className="items-center flex gap-x-4">
              <p className="text-lg leading-6 font-bold text-theme-text-primary">
                Visibilidade do Menu Admin
              </p>
            </div>
            <p className="text-xs leading-[18px] font-base text-theme-text-secondary">
              Configure quais itens do menu administrativo devem ser exibidos.
              Isso permite simplificar a interface removendo funcionalidades que
              não estão sendo utilizadas.
            </p>
          </div>

          <div className="w-full py-6">

            <div className="flex items-center justify-between mb-6">
              <h3 className="text-md font-semibold text-theme-text-primary">
                Itens do Menu
              </h3>
              <div className="flex gap-2">
                {hasChanges && (
                  <button
                    onClick={refreshPage}
                    className="flex items-center gap-2 px-4 py-2 bg-theme-action-menu-bg hover:bg-theme-action-menu-item-hover text-white rounded-lg transition-all"
                  >
                    <Eye size={16} />
                    Visualizar Mudanças
                  </button>
                )}
                <button
                  onClick={resetToDefaults}
                  className="flex items-center gap-2 px-4 py-2 border border-theme-sidebar-border hover:bg-theme-action-menu-item-hover text-theme-text-primary rounded-lg transition-all"
                >
                  <ArrowCounterClockwise size={16} />
                  Restaurar Padrão
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {menuItems.map((item) => (
                <div key={item.key} className="space-y-2">
                  {/* Item Principal */}
                  <div className="flex items-center justify-between p-4 bg-theme-bg-primary rounded-lg border border-theme-sidebar-border">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`p-2 rounded-lg ${
                            item.visible
                              ? "bg-green-500/20"
                              : item.state?.protected
                                ? "bg-blue-500/20"
                                : "bg-gray-500/20"
                          }`}
                        >
                          {item.state?.protected ? (
                            <Gear size={16} className="text-blue-400" />
                          ) : item.visible ? (
                            <Eye size={16} className="text-green-400" />
                          ) : (
                            <EyeSlash size={16} className="text-gray-400" />
                          )}
                        </div>
                        <h4 className="text-sm font-medium text-theme-text-primary">
                          {item.name}
                        </h4>
                        {item.state?.protected && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">
                            Protegido
                          </span>
                        )}
                        {item.state?.standalone === false && (
                          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded border border-purple-500/30">
                            Hierárquico
                          </span>
                        )}
                        {item.hasSubitems && (
                          <span className="text-xs bg-theme-action-menu-bg text-theme-text-secondary px-2 py-1 rounded">
                            {item.subitems?.filter((sub) => sub.visible).length || 0}
                            /{item.subitems?.length || 0} subitens
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-theme-text-secondary ml-11">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center ml-4">
                      {item.state?.protected ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
                            Sempre Ativo
                          </span>
                          <div className="w-11 h-6 bg-blue-600 rounded-full relative">
                            <div className="absolute top-[2px] right-[2px] bg-white border-gray-300 border rounded-full h-5 w-5"></div>
                          </div>
                        </div>
                      ) : (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.visible}
                            onChange={() => toggleMenuItem(item.key)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Subitens */}
                  {item.hasSubitems && item.subitems && (
                    <div className="ml-8 space-y-2">
                      {item.subitems.map((subitem) => (
                        <div
                          key={`${item.key}-${subitem.key}`}
                          className={`flex items-center justify-between p-3 rounded-lg border border-theme-sidebar-border border-opacity-50 ${
                            item.visible
                              ? "bg-theme-bg-secondary"
                              : "bg-theme-bg-secondary opacity-60"
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <div
                                className={`p-1.5 rounded ${
                                  subitem.state?.protected
                                    ? "bg-blue-500/20"
                                    : subitem.visible
                                      ? "bg-green-500/20"
                                      : "bg-gray-500/20"
                                }`}
                              >
                                {subitem.state?.protected ? (
                                  <Gear size={12} className="text-blue-400" />
                                ) : subitem.visible ? (
                                  <Eye size={12} className="text-green-400" />
                                ) : (
                                  <EyeSlash size={12} className="text-gray-400" />
                                )}
                              </div>
                              <h5 className="text-xs font-medium text-theme-text-primary">
                                {subitem.name}
                              </h5>
                              {subitem.state?.protected && (
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded text-[10px]">
                                  Protegido
                                </span>
                              )}
                              {!item.visible && (
                                <span className="text-xs bg-orange-500/20 text-orange-400 px-1 py-0.5 rounded text-[10px]">
                                  Pai Oculto
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-theme-text-secondary ml-8 opacity-75">
                              {subitem.description}
                            </p>
                            {!subitem.state?.parentVisible && subitem.state?.ownVisible && (
                              <p className="text-xs text-orange-400 ml-8 mt-1">
                                ⚠️ Oculto porque o item pai está desabilitado
                              </p>
                            )}
                          </div>

                          <div className="flex items-center ml-4">
                            {subitem.state?.protected ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
                                  Sempre Ativo
                                </span>
                                <div className="w-9 h-5 bg-blue-600 rounded-full relative">
                                  <div className="absolute top-[2px] right-[2px] bg-white border-gray-300 border rounded-full h-4 w-4"></div>
                                </div>
                              </div>
                            ) : (
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={subitem.state?.ownVisible || false}
                                  onChange={() =>
                                    toggleMenuItem(item.key, subitem.key)
                                  }
                                  className="sr-only peer"
                                />
                                <div
                                  className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"
                                ></div>
                              </label>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {hasChanges && (
              <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-orange-400 text-sm">
                  <Gear size={16} />
                  <span>
                    Configurações alteradas. Recarregue a página para ver as
                    mudanças no menu lateral.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
