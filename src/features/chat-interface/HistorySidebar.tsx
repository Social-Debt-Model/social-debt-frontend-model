import React from "react";
import { HistoryItem } from "@/lib/historyDB";
import { FileText, MessageSquarePlus, Trash2, Clock } from "lucide-react";

type HistorySidebarProps = {
  items: HistoryItem[];
  focusedJobId: string | null;
  onSelect: (jobId: string) => void;
  onNewChat: () => void;
  onDelete: (jobId: string) => void;
};

export const HistorySidebar = ({
  items,
  focusedJobId,
  onSelect,
  onNewChat,
  onDelete,
}: HistorySidebarProps) => {
  return (
    <div className="w-96 h-full bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg rounded-3xl text-slate-700 flex flex-col flex-shrink-0 overflow-hidden">
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 border border-emerald-500/30 font-medium py-2.5 px-4 rounded-xl transition-all shadow-sm backdrop-blur-md"
        >
          <MessageSquarePlus className="w-5 h-5" />
          Nuevo Análisis
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-2 pb-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1 mt-2">
          Historial de Archivos
        </h3>

        {items.length === 0 ? (
          <p className="text-xs text-slate-400 text-center italic px-2 mt-4">
            No hay análisis previos guardados.
          </p>
        ) : (
          items.map((item) => {
            const isActive = focusedJobId === item.jobId;
            const date = new Date(item.timestamp);

            return (
              <div
                key={item.jobId}
                className={`w-full flex items-center justify-between text-left py-3 px-2 rounded-2xl transition-all group cursor-pointer border ${isActive ? "bg-white/60 shadow-sm border-white/60 backdrop-blur-md" : "hover:bg-white/30 border-transparent"}`}
                onClick={() => onSelect(item.jobId)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-2 overflow-hidden">
                  <div
                    className={`p-2 rounded-xl flex-shrink-0 transition-all ${isActive ? "bg-blue-500 text-white shadow-md shadow-blue-200" : "bg-slate-50/30 text-slate-400 group-hover:bg-white/50 group-hover:text-blue-500"}`}
                  >
                    <FileText className="w-5 h-5" />
                  </div>
                  <div
                    className="flex-1 min-w-0 overflow-hidden flex flex-col justify-center"
                    style={{ containerType: "inline-size" }}
                  >
                    <p
                      className={`text-lg animate-marquee w-max font-bold ${isActive ? "text-slate-800" : "text-slate-600"}`}
                      title={item.filename}
                    >
                      {item.filename}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-sm text-slate-500 font-medium">
                      <Clock className="w-4 h-4" />
                      <span>
                        {date.toLocaleDateString()}{" "}
                        {date.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.jobId);
                  }}
                  title="Eliminar análisis"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
