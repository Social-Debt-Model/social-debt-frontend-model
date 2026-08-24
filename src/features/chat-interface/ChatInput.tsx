"use client";

import React, { useState, useRef } from "react";
import { Send, Paperclip, X, Download } from "lucide-react";
import {
  useFileValidation,
  FileProcessingResult,
  ValidationReport,
} from "../file-validation/useFileValidation";
import { ValidationChecklistModal } from "./ValidationChecklistModal";

export const ChatInput = ({
  onSendMessage,
  onSendFile,
}: {
  onSendMessage: (text: string) => void;
  onSendFile?: (file: File) => void;
}) => {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);

  const [pendingFileResult, setPendingFileResult] =
    useState<FileProcessingResult | null>(null);
  const [validationReport, setValidationReport] =
    useState<ValidationReport | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { processFile, regenerateCsvFile, error, setError, clearError } =
    useFileValidation();

  const handleAttachmentClick = () => {
    setPendingFileResult(null);
    setValidationReport(null);
    setIsValidationModalOpen(true);
  };

  const handleFileSelectFromModal = async (file: File) => {
    const result = await processFile(file);
    setPendingFileResult(result);
    setValidationReport(result.report || null);
  };

  const handleProceedValidation = (
    decision?: "group" | "individual" | "discard",
  ) => {
    setIsValidationModalOpen(false);
    if (pendingFileResult?.valid && pendingFileResult.report) {
      let finalData = [...pendingFileResult.parsedData!];

      const originalIssueCol = pendingFileResult.issueColumnName;
      const originalIdCol = pendingFileResult.report.matchedIdColumn;
      const originalCommentCol = pendingFileResult.report.matchedCommentColumn!;

      const tempIssueCol = originalIssueCol || "issue_number";

      if (
        pendingFileResult.hasOrphans &&
        decision &&
        decision !== "individual"
      ) {
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
        return {
          comment_id: row[originalIdCol || "comment_id"],
          comment: row[originalCommentCol],
          issue_number: row[tempIssueCol] || "",
        };
      });

      if (mappedData.length === 0) {
        setError(
          "Al descartar los comentarios huérfanos, el archivo quedó completamente vacío. Por favor, sube otro archivo o escoge agruparlos.",
        );
        setPendingFileResult(null);
        return;
      }

      const newFile = regenerateCsvFile(
        mappedData,
        pendingFileResult.file!.name,
      );
      setSelectedFile(newFile);
      setPendingFileResult(null);
    }
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
    <div className="absolute bottom-0 left-0 w-full px-4 pt-4 pb-8 z-20">
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
            disabled={!!selectedFile}
            className={`p-3 rounded-xl transition self-end ${selectedFile ? "text-blue-500 bg-blue-50/50" : "text-slate-400 hover:text-blue-500 hover:bg-blue-50"}`}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {selectedFile ? (
            <div className="flex-1 flex items-center justify-between bg-blue-50/80 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800 shadow-sm h-[44px] mb-[2px]">
              <span className="flex items-center gap-2 truncate">
                <span
                  className="font-medium truncate"
                  title={selectedFile.name}
                >
                  {selectedFile.name}
                </span>
                <span className="text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                  Listo para analizar
                </span>
              </span>
              <div className="flex items-center flex-shrink-0">
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
                  className="ml-3 text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-200/50 transition-colors"
                  title="Descargar archivo procesado para auditoría"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={removeFile}
                  className="ml-1 text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-200/50 transition-colors"
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
              placeholder="Escribe un comentario o adjunta un dataset..."
              className="w-full max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-3 px-2 text-slate-800 placeholder-slate-400"
              rows={1}
            />
          )}

          <button
            type="submit"
            disabled={!message.trim() && !selectedFile}
            className="p-3 bg-slate-800 text-white rounded-full hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all self-end shadow-sm"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <div className="flex justify-center items-center mt-4">
          <p className="text-center text-xs text-slate-500 font-medium">
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
      />
    </div>
  );
};
