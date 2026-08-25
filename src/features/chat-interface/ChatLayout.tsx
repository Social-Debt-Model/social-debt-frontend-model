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
      {/* Overlay para móviles */}
      {sidebar && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={onToggleSidebar}
        />
      )}

      {/* Sidebar - offcanvas en móviles, estático en desktop */}
      {sidebar && (
        <aside
          className={`fixed md:relative inset-y-0 left-0 z-40 transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-[120%]"
          } md:translate-x-0 transition-transform duration-300 ease-in-out h-full flex-shrink-0 p-4 w-80 md:w-auto bg-transparent`}
        >
          {sidebar}
        </aside>
      )}

      <div className="flex flex-col flex-1 relative overflow-hidden w-full overscroll-none">
        <header className="flex-none py-3 md:py-5 px-3 md:px-6 flex items-center justify-between glass-panel mt-4 mx-4 mb-0 z-20 relative shadow-2xl shadow-slate-900/10 border-white/60">
          <div className="flex-shrink-0 w-[40px] flex items-center md:hidden">
            {sidebar && (
              <button
                onClick={onToggleSidebar}
                className="w-full h-[40px] flex items-center justify-center text-slate-600 hover:text-indigo-600 bg-white/90 border border-white/40 shadow-sm rounded-full backdrop-blur-md transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
          </div>

          <h1 className="text-md md:text-xl font-black tracking-widest uppercase text-slate-700 text-center flex-1 mx-3 md:mx-0 truncate">
            Social Debt Model
          </h1>

          <div className="flex-shrink-0 w-[40px] flex justify-end md:hidden">
            {headerAction}
          </div>
        </header>

        <main
          className={`flex-grow px-4 pb-0 flex flex-col ${
            isFocusMode
              ? "pt-3 overflow-hidden mb-2"
              : "pt-6 overflow-y-auto overscroll-none mb-[108px] space-y-6"
          }`}
        >
          {children}
        </main>
        {footer}
      </div>
    </div>
  );
};
