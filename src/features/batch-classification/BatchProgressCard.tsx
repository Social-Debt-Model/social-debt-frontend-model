"use client";

import React, { useEffect, useState, useRef } from "react";
import { checkOpenAILimits, startBatchJob, checkBatchStatus } from "./actions";
import { Loader2, Server, CheckCircle, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

type BatchProgressCardProps = {
  file: File;
  onCompleted?: (jobId: string, resultData: any) => void;
};

export const BatchProgressCard = ({
  file,
  onCompleted,
}: BatchProgressCardProps) => {
  const [step, setStep] = useState<
    "checking_limits" | "uploading" | "processing" | "completed" | "error"
  >("checking_limits");
  const [progressMsg, setProgressMsg] = useState(
    "Verificando cuota disponible de OpenAI...",
  );
  const [progressPercent, setProgressPercent] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    
    let intervalId: NodeJS.Timeout;

    const startFlow = async () => {
      // 1. Verificación silenciosa
      const limitsRes = await checkOpenAILimits();
      if (limitsRes?.error) {
        setStep("error");
        setProgressMsg("No se pudo verificar la conexión o límites de OpenAI.");
        return;
      }

      // 2. Upload file
      setStep("uploading");
      setProgressMsg(`Enviando archivo ${file.name} al servidor...`);
      setProgressPercent(10);

      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await startBatchJob(formData);
      if (uploadRes?.error || !uploadRes?.job_id) {
        setStep("error");
        setProgressMsg(
          `Error al iniciar lote: ${uploadRes?.message || "job_id missing"}`,
        );
        return;
      }

      const newJobId = uploadRes.job_id;
      setJobId(newJobId);
      setStep("processing");
      setProgressMsg("Procesando (0%)");
      setProgressPercent(20);

      // 3. Polling
      intervalId = setInterval(async () => {
        const statusRes = await checkBatchStatus(newJobId);
        if (statusRes?.error) {
          clearInterval(intervalId);
          setStep("error");
          setProgressMsg("Perdida la conexión con el servidor de Social Debt.");
          return;
        }

        if (
          statusRes.status === "completed" ||
          statusRes.status === "success"
        ) {
          clearInterval(intervalId);
          setStep("completed");
          setProgressPercent(100);
          setProgressMsg("Análisis completado exitosamente.");
          if (onCompleted) {
            onCompleted(
              newJobId,
              statusRes.result || statusRes.data || statusRes,
            );
          }
        } else if (statusRes.status === "processing" || statusRes.progress) {
          const rawProgress = statusRes.progress || "";
          if (rawProgress.toLowerCase().includes("cola de espera")) {
            setProgressMsg("Procesando en segundo plano...");
          } else {
            setProgressMsg(
              rawProgress || "Procesando en segundo plano...",
            );
          }

          // Try to extract percentage from progress string (e.g. "25 de 100 comentarios procesados (25%)")
          const match = statusRes.progress?.match(/\((\d+)%\)/);
          if (match && match[1]) {
            const num = parseInt(match[1]);
            setProgressPercent(20 + Math.floor(num * 0.8)); // map 0-100 to 20-100 on the bar
          } else {
            setProgressPercent((prev) => Math.min(prev + 5, 95));
          }
        }
      }, 3000);
    };

    startFlow();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [file]);

  return (
    <div className="glass-panel p-6 flex flex-col gap-4 rounded-bl-none max-w-md w-full relative overflow-hidden">
      <div className="flex items-center gap-3">
        {step === "completed" ? (
          <CheckCircle className="w-6 h-6 text-emerald-500" />
        ) : step === "error" ? (
          <AlertTriangle className="w-6 h-6 text-red-500" />
        ) : step === "checking_limits" ? (
          <Server className="w-6 h-6 text-slate-500 animate-pulse" />
        ) : (
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        )}

        <h3 className="font-semibold text-slate-800">
          {step === "completed"
            ? "Análisis Finalizado"
            : step === "error"
              ? "Error"
              : "Análisis Masivo en Progreso"}
        </h3>
      </div>

      <p className="text-sm text-slate-600 font-medium">{progressMsg}</p>

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
