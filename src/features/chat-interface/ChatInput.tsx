"use client";

import React, { useState, useRef } from "react";
import { Send, Paperclip, X, Download, Loader2 } from "lucide-react";
import {
  useFileValidation,
  FileProcessingResult,
  ValidationReport,
} from "../file-validation/useFileValidation";
import { ValidationChecklistModal } from "./ValidationChecklistModal";

type ChatInputProps = {
  onSendMessage: (message: string) => void;
  onSendFile?: (file: File) => void;
  isChatDisabled?: boolean;
};

export const ChatInput = ({
  onSendMessage,
  onSendFile,
  isChatDisabled,
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);

  const [pendingFileResult, setPendingFileResult] =
    useState<FileProcessingResult | null>(null);
  const [validationReport, setValidationReport] =
    useState<ValidationReport | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { processFile, regenerateCsvFile, error, setError, clearError } =
    useFileValidation();

  const handleAttachmentClick = () => {
    setPendingFileResult(null);
    setValidationReport(null);
    setIsValidationModalOpen(true);
  };

  const handleFileSelectFromModal = async (file: File) => {
    setIsProcessingFile(true);
    const start = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 100));
    try {
      const result = await processFile(file);

      const elapsed = Date.now() - start;
      const minDuration = 1000; // Mínimo 1 segundo de animación
      if (elapsed < minDuration) {
        await new Promise((resolve) =>
          setTimeout(resolve, minDuration - elapsed),
        );
      }

      setPendingFileResult(result);
      setValidationReport(result.report || null);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleProceedValidation = (
    decision?: "group" | "individual" | "discard",
  ) => {
    if (!pendingFileResult?.valid || !pendingFileResult.report) {
      setIsValidationModalOpen(false);
      return;
    }

    const validResult = pendingFileResult;
    const validReport = pendingFileResult.report;

    setIsProcessingFile(true);

    setTimeout(() => {
      try {
        const start = Date.now();
        let finalData = [...validResult.parsedData!];

        const originalIssueCol = validResult.issueColumnName;
        const originalIdCol = validReport.matchedIdColumn;
        const originalCommentCol = validReport.matchedCommentColumn!;
        const originalAuthorCol = validReport.matchedAuthorColumn;
        
        let hasValidAuthorData = false;
        if (originalAuthorCol) {
            hasValidAuthorData = finalData.some(row => row[originalAuthorCol] && String(row[originalAuthorCol]).trim() !== "");
        }

        const tempIssueCol = originalIssueCol || "issue_number";

        if (validResult.hasOrphans && decision && decision !== "individual") {
          if (decision === "group") {
            finalData = finalData.map((row) => {
              const newRow = { ...row };
              if (
                !newRow[tempIssueCol] ||
                String(newRow[tempIssueCol]).trim() === ""
              ) {
                newRow[tempIssueCol] = "UNGROUPED-COMMENTS";
              }
              return newRow;
            });
          } else if (decision === "discard") {
            finalData = finalData.filter(
              (row) =>
                row[tempIssueCol] && String(row[tempIssueCol]).trim() !== "",
            );
          }
        }

        const mappedData = finalData.map((row) => {
          const mappedRow: Record<string, unknown> = {
            comment_id: row[originalIdCol || "comment_id"],
            comment: row[originalCommentCol],
            issue_number: row[tempIssueCol] || "",
          };
          if (hasValidAuthorData && originalAuthorCol) {
            mappedRow.author = row[originalAuthorCol];
          }
          return mappedRow;
        });

        if (mappedData.length === 0) {
          setError(
            "Al descartar los comentarios huérfanos, el archivo quedó completamente vacío. Por favor, sube otro archivo o escoge agruparlos.",
          );
          setPendingFileResult(null);
          return;
        }

        const newFile = regenerateCsvFile(mappedData, validResult.file!.name);
        setSelectedFile(newFile);
        setPendingFileResult(null);

        const finishProcessing = () => {
          setIsValidationModalOpen(false);
          setIsProcessingFile(false);
        };

        const elapsed = Date.now() - start;
        const minDuration = 1000; // Mínimo 1 segundo de animación
        if (elapsed < minDuration) {
          setTimeout(finishProcessing, minDuration - elapsed);
        } else {
          finishProcessing();
        }
      } catch {
        setIsProcessingFile(false);
      }
    }, 100);
  };

  const handleCloseValidationModal = () => {
    setIsValidationModalOpen(false);
    clearError();
  };

  const removeFile = () => {
    setSelectedFile(null);
    clearError();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isChatDisabled) return;

    if (selectedFile && onSendFile) {
      onSendFile(selectedFile);
      removeFile();
      setMessage("");
    } else if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <div className="absolute bottom-0 left-0 w-full px-2 md:px-4 pt-2 md:pt-4 pb-2 md:pb-8 z-20">
      <div className="max-w-3xl mx-auto">
        {error && (
          <div className="mb-2 p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-200 shadow-sm flex justify-between items-start">
            <p>{error}</p>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-800 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="glass-panel bg-white/80 flex items-end p-2 gap-2 relative transition-shadow hover:shadow-2xl focus-within:shadow-2xl shadow-2xl shadow-slate-900/10 border-white/60"
        >
          <button
            type="button"
            onClick={handleAttachmentClick}
            disabled={!!selectedFile || isProcessingFile || isChatDisabled}
            className={`flex-shrink-0 p-3 rounded-xl transition self-end ${selectedFile ? "text-blue-500 bg-blue-50/50" : "text-slate-400 hover:text-blue-500 hover:bg-blue-50"} ${isProcessingFile || isChatDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isProcessingFile ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>

          {selectedFile ? (
            <div className="flex-1 min-w-0 flex items-center justify-between bg-blue-50/80 border border-blue-200 rounded-lg px-2 md:px-3 py-2 text-sm text-blue-800 shadow-sm h-[44px] mb-[2px]">
              <span className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className="font-medium truncate"
                  title={selectedFile.name}
                >
                  {selectedFile.name}
                </span>
                <span className="hidden md:inline-flex text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full flex-shrink-0">
                  Listo
                </span>
              </span>
              <div className="flex items-center flex-shrink-0 ml-1 md:ml-3">
                <button
                  type="button"
                  onClick={() => {
                    const url = URL.createObjectURL(selectedFile);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `auditoria_${selectedFile.name}`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-blue-600 hover:text-blue-900 p-1 md:p-1.5 rounded hover:bg-blue-200/50 transition-colors"
                  title="Descargar archivo procesado para auditoría"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={removeFile}
                  className="ml-0.5 md:ml-1 text-blue-600 hover:text-blue-900 p-1 md:p-1.5 rounded hover:bg-blue-200/50 transition-colors"
                  title="Quitar archivo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={
                isChatDisabled ? "Analizando..." : "Escribe un mensaje..."
              }
              className="w-full max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-3 px-2 text-base text-slate-800 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
              rows={1}
              disabled={isChatDisabled}
            />
          )}

          <button
            type="submit"
            disabled={(!message.trim() && !selectedFile) || isChatDisabled}
            className="flex-shrink-0 p-3 bg-slate-800 text-white rounded-full hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all self-end shadow-sm"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <div className="flex justify-center items-center mt-2">
          <p className="text-center text-[10px] md:text-xs text-slate-500 font-medium leading-tight">
            Los resultados son inferidos por el modelo y pueden no ser
            completamente exactos o deterministas.
          </p>
        </div>
      </div>

      <ValidationChecklistModal
        isOpen={isValidationModalOpen}
        onClose={handleCloseValidationModal}
        onProceed={handleProceedValidation}
        onFileSelect={handleFileSelectFromModal}
        report={validationReport}
        hasOrphans={pendingFileResult?.hasOrphans}
        isProcessingFile={isProcessingFile}
      />
    </div>
  );
};
