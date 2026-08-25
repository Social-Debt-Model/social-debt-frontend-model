"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  checkOpenAILimits,
  startBatchJob,
  checkBatchStatus,
  cancelBatchJob,
} from "./actions";
import {
  Loader2,
  Server,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { savePendingJob, deletePendingJob } from "@/lib/historyDB";
import { BatchResultData } from "./actions";

type BatchProgressCardProps = {
  file?: File;
  resumeJobId?: string;
  resumeFilename?: string;
  onCompleted?: (jobId: string, resultData: BatchResultData) => void;
  onCancelled?: (jobId: string) => void;
  onError?: (jobId: string) => void;
};

export const BatchProgressCard = ({
  file,
  resumeJobId,
  resumeFilename,
  onCompleted,
  onCancelled,
  onError,
}: BatchProgressCardProps) => {
  const [step, setStep] = useState<
    | "checking_limits"
    | "uploading"
    | "processing"
    | "completed"
    | "error"
    | "cancelled"
  >("checking_limits");
  const [progressMsg, setProgressMsg] = useState(
    "Verificando cuota disponible de OpenAI...",
  );
  const [progressPercent, setProgressPercent] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const hasStarted = useRef(false);

  const isCancelledRef = useRef(false);

  const callbacksRef = useRef({ onCompleted, onCancelled, onError });
  useEffect(() => {
    callbacksRef.current = { onCompleted, onCancelled, onError };
  });

  useEffect(() => {
    isCancelledRef.current = false;

    if (hasStarted.current) return;
    hasStarted.current = true;

    let intervalId: NodeJS.Timeout | undefined;

    const startFlow = async () => {
      let newJobId = resumeJobId;
      let isFinished = false;

      if (resumeJobId) {
        setJobId(resumeJobId || null);
        setStep("processing");
        setProgressMsg("Reanudando conexión con el lote...");
        setProgressPercent(20);
      } else if (file) {
        // 1. Verificación silenciosa
        const limitsRes = await checkOpenAILimits();
        if (isCancelledRef.current) return;
        if (limitsRes?.error) {
          setStep("error");
          setProgressMsg(
            `Error de cuota/límites: ${limitsRes?.details || "No se pudo verificar la conexión con OpenAI."}`,
          );
          if (callbacksRef.current.onError)
            callbacksRef.current.onError(newJobId || "");
          return;
        }

        // 2. Upload file
        setStep("uploading");
        setProgressMsg(`Enviando archivo ${file.name} al servidor...`);
        setProgressPercent(10);

        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await startBatchJob(formData);
        if (isCancelledRef.current) return;

        if (uploadRes?.error || !uploadRes?.job_id) {
          setStep("error");
          setProgressMsg(
            `Error al iniciar lote: ${uploadRes?.message || "job_id missing"}`,
          );
          if (callbacksRef.current.onError)
            callbacksRef.current.onError(newJobId || "");
          return;
        }

        newJobId = uploadRes.job_id;
        setJobId(newJobId || null);
        setStep("processing");
        setProgressMsg("Procesando (0%)");
        setProgressPercent(20);

        // Guardar como trabajo pendiente inmediatamente
        await savePendingJob({
          jobId: newJobId!,
          filename: file.name,
          timestamp: Date.now(),
        });
      } else {
        setStep("error");
        setProgressMsg("No se proporcionó archivo ni jobId.");
        if (callbacksRef.current.onError)
          callbacksRef.current.onError(newJobId || "");
        return;
      }

      if (!newJobId) return;

      // 3. Polling
      const pollStatus = async () => {
        if (isCancelledRef.current) return;
        const statusRes = await checkBatchStatus(newJobId!);
        if (isCancelledRef.current) return;

        if (statusRes?.error) {
          isFinished = true;
          if (intervalId) clearInterval(intervalId);
          setStep("error");
          if (statusRes.code === 404) {
            setProgressMsg(
              "El trabajo expiró o no fue encontrado en el servidor (404).",
            );
          } else {
            setProgressMsg(
              `Error de conexión: ${statusRes.message || "Desconocido"}`,
            );
          }
          await deletePendingJob(newJobId!);
          if (callbacksRef.current.onError)
            callbacksRef.current.onError(newJobId!);
          return;
        }

        if (statusRes.status === "cancelled") {
          isFinished = true;
          if (intervalId) clearInterval(intervalId);
          setStep("cancelled");
          setProgressMsg("Análisis cancelado.");
          await deletePendingJob(newJobId!);
          if (callbacksRef.current.onCancelled)
            callbacksRef.current.onCancelled(newJobId!);
          return;
        }

        if (
          statusRes.status === "completed" ||
          statusRes.status === "success"
        ) {
          isFinished = true;
          if (intervalId) clearInterval(intervalId);
          setStep("completed");
          setProgressPercent(100);
          setProgressMsg("Análisis completado exitosamente.");
          await deletePendingJob(newJobId!);
          if (callbacksRef.current.onCompleted) {
            callbacksRef.current.onCompleted(
              newJobId!,
              (statusRes.result ||
                statusRes.data ||
                statusRes) as unknown as BatchResultData,
            );
          }
          return;
        }

        const rawProgressStr = statusRes.progress
          ? String(statusRes.progress)
          : "";
        if (statusRes.status === "pending") {
          setProgressMsg(rawProgressStr || "En cola. Esperando turno...");
        } else if (rawProgressStr.toLowerCase().includes("cola de espera")) {
          setProgressMsg("En cola. Esperando turno...");
        } else {
          setProgressMsg(rawProgressStr || "Procesando en segundo plano...");
        }

        try {
          // Si el backend ya nos envía los campos, usémoslos:
          let extractedPercent = null;

          if (
            statusRes.total &&
            statusRes.total > 0 &&
            statusRes.processed !== undefined
          ) {
            extractedPercent = Math.round(
              (statusRes.processed / statusRes.total) * 100,
            );
          } else {
            const pctMatch = rawProgressStr.match(/(\d+)%/);
            if (pctMatch && pctMatch[1]) {
              extractedPercent = parseInt(pctMatch[1], 10);
            }
          }

          if (extractedPercent !== null && !isNaN(extractedPercent)) {
            setProgressPercent(20 + Math.floor(extractedPercent * 0.8));
          } else if (statusRes.status === "pending") {
            setProgressPercent(20); // Se queda en 20% si está en cola
          } else {
            setProgressPercent((prev) => Math.min(prev + 5, 95));
          }

          if (statusRes.estimated_remaining_time_formatted) {
            setEstimatedTime(
              `Tiempo estimado: ${statusRes.estimated_remaining_time_formatted}`,
            );
          } else if (
            statusRes.status === "pending" &&
            statusRes.estimated_wait_seconds
          ) {
            const m = Math.round(statusRes.estimated_wait_seconds / 60);
            setEstimatedTime(`Tiempo estimado de espera: ~${m} minutos`);
          } else {
            setEstimatedTime(null);
          }
        } catch (err) {
          setProgressPercent((prev) => Math.min(prev + 5, 95));
          console.error("Error parseando progreso:", err);
        }
      };

      if (resumeJobId) {
        // En reanudación, consultar inmediatamente sin esperar 3s
        await pollStatus();
      }

      if (isCancelledRef.current || isFinished) return;

      intervalId = setInterval(pollStatus, 3000);
    };

    startFlow();

    return () => {
      isCancelledRef.current = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [file, resumeJobId]);

  const handleCancel = async () => {
    if (!jobId) return;
    setStep("cancelled");
    setProgressMsg("Cancelando...");
    try {
      await cancelBatchJob(jobId);
    } catch (e) {
      console.error("Error cancelling job on server", e);
    }
    await deletePendingJob(jobId);
    if (onCancelled) onCancelled(jobId);
  };

  const handleDiscardError = async () => {
    if (!jobId) return;
    setStep("cancelled");
    setProgressMsg("Descartando trabajo fallido...");
    await deletePendingJob(jobId);
    if (onCancelled) onCancelled(jobId);
  };

  return (
    <div className="glass-panel p-6 flex flex-col gap-4 rounded-bl-none max-w-md w-full relative overflow-hidden">
      <div className="flex items-center gap-3">
        {step === "completed" ? (
          <CheckCircle className="w-6 h-6 text-emerald-500" />
        ) : step === "error" ? (
          <AlertTriangle className="w-6 h-6 text-red-500" />
        ) : step === "cancelled" ? (
          <XCircle className="w-6 h-6 text-slate-500" />
        ) : step === "checking_limits" ? (
          <Server className="w-6 h-6 text-slate-500 animate-pulse" />
        ) : (
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        )}

        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">
            {step === "completed"
              ? "Análisis Finalizado"
              : step === "error"
                ? "Error"
                : step === "cancelled"
                  ? "Análisis Cancelado"
                  : "Análisis Masivo en Progreso"}
          </h3>
          {(file?.name || resumeFilename) && (
            <p className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
              {file?.name || resumeFilename}
            </p>
          )}
        </div>

        {(step === "uploading" || step === "processing") && jobId && (
          <button
            onClick={handleCancel}
            className="text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors font-semibold shadow-sm ml-auto"
          >
            Cancelar
          </button>
        )}

        {step === "error" && jobId && (
          <button
            onClick={handleDiscardError}
            className="text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors font-semibold shadow-sm ml-auto"
          >
            Descartar
          </button>
        )}
      </div>

      <p className="text-sm text-slate-600 font-medium">{progressMsg}</p>
      {estimatedTime && step === "processing" && (
        <p className="text-xs text-slate-500 -mt-2 font-medium">
          {estimatedTime}
        </p>
      )}

      {step !== "error" && (
        <div className="w-full bg-slate-200 rounded-full h-3 mt-2 overflow-hidden shadow-inner">
          <motion.div
            className="bg-blue-600 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      )}

      {step === "completed" && (
        <p className="text-xs text-emerald-600 font-medium mt-2">
          Generando métricas y dashboard...
        </p>
      )}
    </div>
  );
};
