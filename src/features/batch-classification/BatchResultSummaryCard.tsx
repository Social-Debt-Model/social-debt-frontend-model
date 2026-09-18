import React from "react";
import { CheckCircle2, BarChart2, Trash2 } from "lucide-react";
import { BatchResultData } from "./actions";

type BatchResultSummaryCardProps = {
  resultData: BatchResultData;
  filename: string;
  isDeleted: boolean;
  onViewDashboard: () => void;
};

export const BatchResultSummaryCard = ({
  resultData,
  filename,
  isDeleted,
  onViewDashboard,
}: BatchResultSummaryCardProps) => {
  const comments = resultData?.comments || [];
  const count = comments.length || 0;

  return (
    <div
      className={`glass-panel p-5 rounded-2xl rounded-bl-none shadow-sm flex flex-col gap-3 min-w-[280px] max-w-[350px] ${isDeleted ? "opacity-75 grayscale" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDeleted ? "bg-slate-100" : "bg-emerald-100"}`}
        >
          {isDeleted ? (
            <Trash2 className="w-5 h-5 text-slate-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          )}
        </div>
        <div className="min-w-0">
          <h4
            className={`font-semibold text-sm truncate ${isDeleted ? "text-slate-500" : "text-slate-800"}`}
          >
            {filename}
          </h4>
          <p className="text-xs text-slate-500">
            {count}{" "}
            {count === 1 ? "comentario procesado" : "comentarios procesados"}
          </p>
        </div>
      </div>

      <button
        onClick={onViewDashboard}
        disabled={isDeleted}
        className={`mt-1 w-full flex items-center justify-center gap-2 font-medium py-2 px-4 rounded-lg transition-colors border text-sm
          ${
            isDeleted
              ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
              : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
          }`}
      >
        {isDeleted ? (
          <>
            <Trash2 className="w-4 h-4" />
            Resultados Eliminados
          </>
        ) : (
          <>
            <BarChart2 className="w-4 h-4" />
            Ver Resultados
          </>
        )}
      </button>
    </div>
  );
};
