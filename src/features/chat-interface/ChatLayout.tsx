import React from "react";
import { Menu } from "lucide-react";

export const ChatLayout = ({
  children,
  sidebar,
  headerAction,
  footer,
  isFocusMode = false,
  isSidebarOpen = false,
  onToggleSidebar,
}: {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  isFocusMode?: boolean;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}) => {
  return (
    <div className="flex fixed inset-0 w-full h-[100dvh] max-h-[100dvh] overflow-hidden bg-slate-50/50">
      {/* Overlay para desktop/tablets. Oculto en móvil puro (< md) */}
      {sidebar && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 hidden md:block 2xl:hidden transition-opacity"
          onClick={onToggleSidebar}
        />
      )}

      {/* Sidebar - Oculto en móvil (< md), Offcanvas en md-2xl, estático en 2xl+ */}
      {sidebar && (
        <aside
          className={`fixed 2xl:relative inset-y-0 left-0 z-40 transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-[150%]"
          } 2xl:translate-x-0 transition-transform duration-300 ease-in-out h-full flex-shrink-0 p-4 w-80 2xl:w-auto bg-transparent hidden md:block ${!isSidebarOpen ? "2xl:opacity-100 opacity-0 pointer-events-none 2xl:pointer-events-auto" : "opacity-100 pointer-events-auto"}`}
        >
          {sidebar}
        </aside>
      )}

      <div className="flex flex-col flex-1 relative overflow-hidden w-full overscroll-none">
        <header className="flex-none py-3 md:py-5 px-3 md:px-6 flex items-center justify-between glass-panel mt-4 mx-4 mb-0 z-20 relative shadow-2xl shadow-slate-900/10 border-white/60">
          <div className="flex-shrink-0 w-[40px] flex items-center 2xl:hidden">
            {/* El botón de hamburguesa SOLO se muestra en md (tablet/mitad pantalla). Oculto en móvil puro. */}
            {sidebar && (
              <button
                onClick={onToggleSidebar}
                className="w-full h-[40px] hidden md:flex items-center justify-center text-slate-600 hover:text-indigo-600 bg-white/90 border border-white/40 shadow-sm rounded-full backdrop-blur-md transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
          </div>

          <h1 className="text-sm md:text-xl font-black tracking-wider md:tracking-widest uppercase text-slate-700 text-center flex-1 mx-2 md:mx-0 leading-tight">
            <span className="block md:inline">Social Debt</span>{" "}
            <span className="block md:inline">Adaptive Model</span>
          </h1>

          <div className="flex-shrink-0 w-[40px] flex justify-end 2xl:hidden">
            {headerAction}
          </div>
        </header>

        <main
          className={`flex-grow px-4 pb-0 flex flex-col ${
            isFocusMode
              ? "pt-3 overflow-hidden mb-2"
              : "pt-6 overflow-y-auto overscroll-none mb-[116px] md:mb-[128px] space-y-6"
          }`}
        >
          {children}
        </main>
        {footer}
      </div>
    </div>
  );
};
