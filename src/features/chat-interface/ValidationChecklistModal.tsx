import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Columns,
  Check,
  XCircle,
  AlertTriangle,
  UploadCloud,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  ValidationReport,
  VALID_COMMENT_HEADERS,
  VALID_ISSUE_HEADERS,
  VALID_ID_HEADERS,
  VALID_AUTHOR_HEADERS,
} from "../file-validation/useFileValidation";

type ValidationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onProceed?: (decision?: "group" | "individual" | "discard") => void;
  onFileSelect?: (file: File) => void;
  report: ValidationReport | null;
  hasOrphans?: boolean;
  isProcessingFile?: boolean;
};

export const ValidationChecklistModal = ({
  isOpen,
  onClose,
  onProceed,
  onFileSelect,
  report,
  hasOrphans,
  isProcessingFile,
}: ValidationModalProps) => {
  const [decision, setDecision] = useState<
    "group" | "individual" | "discard" | undefined
  >();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen && decision !== undefined) {
      setDecision(undefined);
    }
  }

  if (!isOpen || typeof document === "undefined") return null;

  if (!report) {
    const content = (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-800/1 md:bg-slate-800/10 backdrop-blur-lg md:backdrop-blur-sm p-4 overflow-y-auto">
        <div className="glass-panel p-6 max-w-4xl w-full relative bg-white md:bg-white/80 my-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <Columns className="w-6 h-6 text-blue-500" />
            <h3 className="text-2xl font-bold text-slate-800">
              Requisitos del Archivo
            </h3>
          </div>

          <p className="text-lg text-slate-600 mb-6">
            Antes de subir tu dataset, asegúrate de que contenga las siguientes
            columnas para que podamos procesarlo correctamente.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border bg-slate-50/50 border-slate-200 h-full">
              <h4 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-emerald-500" /> Campos
                Obligatorios
              </h4>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                <div className="flex flex-col gap-3">
                  <p className="text-base font-semibold text-slate-700">
                    Contenido del Comentario
                  </p>
                  <p className="text-base text-slate-500">
                    Columna que contiene el texto del comentario, la cual debe
                    llamarse exactamente como una de estas opciones:
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {VALID_COMMENT_HEADERS.map((h) => (
                      <span
                        key={h}
                        className="font-mono text-base bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200 shadow-sm text-center"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border bg-slate-50/50 border-slate-200 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-500" /> Opcionales
                </h4>
                <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-0.5 shadow-sm">
                  <button
                    onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
                    disabled={activeSlide === 0}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium text-slate-500 min-w-[32px] text-center">
                    {activeSlide + 1}/3
                  </span>
                  <button
                    onClick={() => setActiveSlide(Math.min(2, activeSlide + 1))}
                    disabled={activeSlide === 2}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative flex-1 overflow-hidden min-h-[160px]">
                <div 
                  className="flex transition-transform duration-300 ease-in-out h-full"
                  style={{ transform: `translateX(-${activeSlide * 100}%)` }}
                >
                  {/* Slide 1: Autor */}
                  <div className="w-full shrink-0 px-1">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0"></div>
                      <div className="flex flex-col gap-3 w-full">
                        <p className="text-base font-semibold text-slate-700">Autor</p>
                        <p className="text-sm text-slate-500">Mantiene trazabilidad original.</p>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {VALID_AUTHOR_HEADERS.map((h) => (
                            <span key={h} className="font-mono text-xs bg-white text-slate-600 px-2 py-1 rounded border border-slate-200 shadow-sm text-center truncate">{h}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Slide 2: ID */}
                  <div className="w-full shrink-0 px-1">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0"></div>
                      <div className="flex flex-col gap-3 w-full">
                        <p className="text-base font-semibold text-slate-700">ID Comentario</p>
                        <p className="text-sm text-slate-500">Si no existe, se generará.</p>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {VALID_ID_HEADERS.map((h) => (
                            <span key={h} className="font-mono text-xs bg-white text-slate-600 px-2 py-1 rounded border border-slate-200 shadow-sm text-center truncate">{h}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Slide 3: Issue */}
                  <div className="w-full shrink-0 px-1">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0"></div>
                      <div className="flex flex-col gap-3 w-full">
                        <p className="text-base font-semibold text-slate-700">Issue / Ticket</p>
                        <p className="text-sm text-slate-500">Agrupa los comentarios.</p>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {VALID_ISSUE_HEADERS.map((h) => (
                            <span key={h} className="font-mono text-xs bg-white text-slate-600 px-2 py-1 rounded border border-slate-200 shadow-sm text-center truncate">{h}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`border-2 border-dashed ${
              isProcessingFile
                ? "border-indigo-300 bg-indigo-50/50 cursor-wait"
                : "border-blue-200 bg-blue-50/30 hover:bg-blue-50/80 cursor-pointer"
            } rounded-xl p-8 flex flex-col items-center justify-center transition`}
            onClick={() => {
              if (!isProcessingFile) fileInputRef.current?.click();
            }}
          >
            {isProcessingFile ? (
              <>
                <Loader2 className="w-8 h-8 text-indigo-500 mb-3 animate-spin" />
                <span className="text-base font-semibold text-indigo-900">
                  Subiendo y analizando dataset...
                </span>
                <span className="text-sm text-indigo-600/70 mt-1">
                  Por favor espera un momento
                </span>
              </>
            ) : (
              <>
                <UploadCloud className="w-8 h-8 text-blue-500 mb-3" />
                <span className="text-base font-semibold text-blue-900">
                  Haz clic o arrastra tu archivo aquí
                </span>
                <span className="text-sm text-blue-600/70 mt-1">
                  Soporta formatos .CSV y .XLSX
                </span>
              </>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv,.xlsx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onFileSelect) {
                  onFileSelect(file);
                }
              }}
              disabled={isProcessingFile}
            />
          </div>
        </div>
      </div>
    );
    return createPortal(content, document.body);
  }

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-800/1 md:bg-slate-800/10 backdrop-blur-lg md:backdrop-blur-sm p-4 overflow-y-auto">
      <div className="glass-panel p-5 max-w-3xl w-full relative bg-white md:bg-white/80 my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          {report.isValid ? (
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          ) : (
            <AlertCircle className="w-6 h-6 text-red-500" />
          )}
          <h3 className="text-xl font-bold text-slate-800">
            {report.isValid ? "Archivo Válido" : "Archivo Inválido"}
          </h3>
        </div>

        <p className="text-base text-slate-600 mb-4">
          {report.isValid
            ? "Las columnas de tu archivo cumplen con la estructura necesaria para procesar los datos."
            : "Faltan columnas requeridas. Por favor, corrige tu archivo y vuelve a subirlo."}
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Columns className="w-4 h-4" /> Resumen de Columnas
            </h4>
            {report.totalRows !== undefined && (
              <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                {report.totalRows.toLocaleString()} registros cargados
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div
              className={`p-3 rounded-xl border flex flex-col gap-2 ${report.hasCommentColumn ? "bg-emerald-50/50 border-emerald-200" : "bg-red-50/50 border-red-200"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-slate-800">
                  Comentario{" "}
                  <span className="text-sm font-normal text-slate-500">
                    (Req)
                  </span>
                </span>
                {report.hasCommentColumn ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="mt-auto">
                {report.hasCommentColumn ? (
                  <div className="inline-flex items-center gap-1 text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm text-base w-full">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-mono font-semibold truncate">
                      {report.matchedCommentColumn}
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 text-red-700 bg-red-100/50 border border-red-200 px-2 py-1 rounded-md text-base w-full">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Falta la columna</span>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border flex flex-col gap-2 ${!report.hasIdColumn || (report.missingIdCount ?? 0) > 0 ? "bg-orange-50/50 border-orange-200" : "bg-emerald-50/50 border-emerald-200"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-slate-800">
                  ID{" "}
                  <span className="text-sm font-normal text-slate-500">
                    (Opc)
                  </span>
                </span>
                {(report.missingIdCount ?? 0) > 0 && report.totalRows ? (
                  <div className="group relative cursor-help">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-700 bg-orange-200/60 px-2 py-0.5 rounded-full border border-orange-300/50">
                      <AlertTriangle className="w-3 h-3" />
                      {report.missingIdCount}/{report.totalRows}
                    </span>
                    <div className="absolute bottom-full right-0 mb-2 w-56 p-2.5 bg-slate-800 text-white text-sm leading-relaxed rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50 pointer-events-none text-left">
                      {report.hasIdColumn
                        ? `Falta el ID en ${report.missingIdCount} de los ${report.totalRows} comentarios existentes. El sistema los asignará de manera automática.`
                        : `Falta el ID en los ${report.totalRows} comentarios existentes. El sistema los asignará de manera automática.`}
                      <div className="absolute top-full right-4 border-4 border-transparent border-t-slate-800"></div>
                    </div>
                  </div>
                ) : !report.hasIdColumn ? (
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                )}
              </div>
              <div className="mt-auto">
                {report.hasIdColumn ? (
                  <div className="inline-flex items-center gap-1 text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm text-base w-full">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-mono font-semibold truncate">
                      {report.matchedIdColumn}
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm text-base w-full">
                    <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                    <span className="truncate">Autogenerado</span>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border flex flex-col gap-2 ${!report.hasIssueColumn || (report.missingIssueCount ?? 0) > 0 ? "bg-orange-50/50 border-orange-200" : "bg-emerald-50/50 border-emerald-200"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-slate-800">
                  Issue{" "}
                  <span className="text-sm font-normal text-slate-500">
                    (Opc)
                  </span>
                </span>
                {(report.missingIssueCount ?? 0) > 0 && report.totalRows ? (
                  <div className="group relative cursor-help">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-700 bg-orange-200/60 px-2 py-0.5 rounded-full border border-orange-300/50">
                      <AlertTriangle className="w-3 h-3" />
                      {report.missingIssueCount}/{report.totalRows}
                    </span>
                    <div className="absolute bottom-full right-0 mb-2 w-56 p-2.5 bg-slate-800 text-white text-sm leading-relaxed rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50 pointer-events-none text-left">
                      {report.hasIssueColumn
                        ? `Falta el número de Issue en ${report.missingIssueCount} de los ${report.totalRows} comentarios existentes. Deberás decidir qué hacer con ellos más abajo.`
                        : `Falta el número de Issue en los ${report.totalRows} comentarios existentes. Deberás decidir qué hacer con ellos más abajo.`}
                      <div className="absolute top-full right-4 border-4 border-transparent border-t-slate-800"></div>
                    </div>
                  </div>
                ) : !report.hasIssueColumn ? (
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                )}
              </div>
              <div className="mt-auto">
                {report.hasIssueColumn ? (
                  <div className="inline-flex items-center gap-1 text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm text-base w-full">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-mono font-semibold truncate">
                      {report.matchedIssueColumn}
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm text-base w-full">
                    <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                    <span className="truncate">Falta la columna</span>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border flex flex-col gap-2 ${report.hasAuthorColumn ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-slate-800 flex items-center gap-1 group relative">
                  Autor{" "}
                  <span className="text-sm font-normal text-slate-500">
                    (Opc)
                  </span>
                  <HelpCircle className="w-3 h-3 text-slate-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 p-2 bg-slate-800 text-white text-[11px] leading-tight rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-[150] font-normal normal-case pointer-events-none text-center">
                    Si la columna existe pero está 100% vacía, se descartará automáticamente.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                  </div>
                </span>
                {report.hasAuthorColumn ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                )}
              </div>
              <div className="mt-auto">
                {report.hasAuthorColumn ? (
                  <div className="inline-flex items-center gap-1 text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm text-base w-full">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-mono font-semibold truncate">
                      {report.matchedAuthorColumn}
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm text-base w-full">
                    <span className="truncate">No requerido</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {report.isValid && hasOrphans && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h4 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" /> ¿Qué hacemos
              con los comentarios sueltos?
            </h4>
            <p className="text-sm text-slate-600 mb-4">
              Se detectaron{" "}
              <strong className="text-slate-800">
                {report.missingIssueCount} de los {report.totalRows} comentarios
              </strong>{" "}
              que no tienen un número de Issue asociado.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label
                className={`group relative flex flex-col gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${decision === "group" ? "bg-blue-50 border-blue-500 shadow-sm" : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50"}`}
              >
                <input
                  type="radio"
                  name="decision"
                  value="group"
                  checked={decision === "group"}
                  onChange={() => setDecision("group")}
                  className="hidden"
                />
                <div className="flex justify-between items-center">
                  <p
                    className={`text-base font-bold ${decision === "group" ? "text-blue-700" : "text-slate-700"}`}
                  >
                    Agrupar
                  </p>
                  {decision === "group" && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
                  )}
                </div>
                <p
                  className={`text-sm leading-snug mt-1 ${decision === "group" ? "text-blue-600/80" : "text-slate-500"}`}
                >
                  Agrupar en un mismo Issue
                </p>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-800 text-white text-sm leading-relaxed rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50 pointer-events-none text-center">
                  Se simulará que todos pertenecen al mismo hilo o discusión
                  (UNGROUPED-COMMENTS).
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
              </label>
              <label
                className={`group relative flex flex-col gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${decision === "individual" ? "bg-blue-50 border-blue-500 shadow-sm" : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50"}`}
              >
                <input
                  type="radio"
                  name="decision"
                  value="individual"
                  checked={decision === "individual"}
                  onChange={() => setDecision("individual")}
                  className="hidden"
                />
                <div className="flex justify-between items-center">
                  <p
                    className={`text-base font-bold ${decision === "individual" ? "text-blue-700" : "text-slate-700"}`}
                  >
                    Individual
                  </p>
                  {decision === "individual" && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
                  )}
                </div>
                <p
                  className={`text-sm leading-snug mt-1 ${decision === "individual" ? "text-blue-600/80" : "text-slate-500"}`}
                >
                  Evaluar por separado
                </p>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-800 text-white text-sm leading-relaxed rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50 pointer-events-none text-center">
                  Cada comentario se analizará de forma independiente sin
                  relacionarse con los demás.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
              </label>
              <label
                className={`group relative flex flex-col gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${decision === "discard" ? "bg-blue-50 border-blue-500 shadow-sm" : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50"}`}
              >
                <input
                  type="radio"
                  name="decision"
                  value="discard"
                  checked={decision === "discard"}
                  onChange={() => setDecision("discard")}
                  className="hidden"
                />
                <div className="flex justify-between items-center">
                  <p
                    className={`text-base font-bold ${decision === "discard" ? "text-blue-700" : "text-slate-700"}`}
                  >
                    Descartar
                  </p>
                  {decision === "discard" && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
                  )}
                </div>
                <p
                  className={`text-sm leading-snug mt-1 ${decision === "discard" ? "text-blue-600/80" : "text-slate-500"}`}
                >
                  Solo procesar válidos
                </p>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-800 text-white text-sm leading-relaxed rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50 pointer-events-none text-center">
                  Se ignorarán estos comentarios y solo se analizarán aquellos
                  que tengan Issue.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
              </label>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-base font-semibold text-slate-500 mb-2 uppercase tracking-wider">
            Columnas detectadas en el archivo ({report.detectedColumns.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {report.detectedColumns.map((col, idx) => (
              <span
                key={idx}
                className="text-base bg-slate-100 text-slate-600 px-2 py-1 rounded shadow-sm font-mono truncate max-w-[150px]"
                title={col}
              >
                {col}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {!report.isValid ? (
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition"
            >
              Entendido, corregiré el archivo
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-5 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg font-medium transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!hasOrphans || decision) {
                    onProceed?.(hasOrphans ? decision : undefined);
                  }
                }}
                disabled={(hasOrphans && !decision) || isProcessingFile}
                className={`px-5 py-2 rounded-lg font-medium transition shadow-sm flex items-center justify-center min-w-[120px] gap-2 ${
                  (hasOrphans && !decision) || isProcessingFile
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {isProcessingFile ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Continuar"
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
  return createPortal(content, document.body);
};
