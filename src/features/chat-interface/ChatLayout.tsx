import React from "react";
import { OpenAILimitsBadge } from "./OpenAILimitsBadge";

export const ChatLayout = ({
  children,
  sidebar,
  isFocusMode = false,
}: {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  isFocusMode?: boolean;
}) => {
  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-slate-50/50">
      {sidebar && (
        <aside className="h-full flex-shrink-0 z-20 p-4">{sidebar}</aside>
      )}

      <div className="flex flex-col flex-1 relative overflow-hidden">
        <header className="flex-none py-6 px-4 flex items-center justify-center glass-panel mt-4 mx-4 mb-0 z-20 relative shadow-2xl shadow-slate-900/10 border-white/60">
          <h1 className="text-xl font-black tracking-widest uppercase text-slate-700">
            Social Debt Model
          </h1>
        </header>

        <main
          className={`flex-grow pt-6 px-4 pb-0 flex flex-col ${
            isFocusMode
              ? "overflow-hidden mb-4"
              : "overflow-y-auto mb-[108px] space-y-6"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
