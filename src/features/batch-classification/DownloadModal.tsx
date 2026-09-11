import React from "react";
import { Download, X } from "lucide-react";

type DownloadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (includeNoise: boolean) => void;
};

export const DownloadModal = ({ isOpen, onClose, onDownload }: DownloadModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-600" />
            Descargar Resultados
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-600 mb-6">
            El archivo Excel incluirá dos hojas: los comentarios clasificados y un catálogo con las definiciones de las causas.
            <br /><br />
            ¿Deseas incluir los comentarios descartados (identificados como ruido) en la descarga?
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                onDownload(false);
                onClose();
              }}
              className="flex-1 py-2.5 px-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold rounded-xl transition-colors border border-indigo-200 shadow-sm text-sm"
            >
              Solo limpios (Sin ruido)
            </button>
            <button
              onClick={() => {
                onDownload(true);
                onClose();
              }}
              className="flex-1 py-2.5 px-4 bg-indigo-600 text-white hover:bg-indigo-700 font-semibold rounded-xl transition-colors shadow-md text-sm"
            >
              Todos (Incluir ruido)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
