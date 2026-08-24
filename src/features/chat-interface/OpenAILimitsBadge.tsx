"use client";

import React, { useEffect, useState } from "react";
import { Info, Activity, AlertCircle } from "lucide-react";
import { checkOpenAILimits } from "../batch-classification/actions";
import { motion, AnimatePresence } from "framer-motion";

export const OpenAILimitsBadge = () => {
  const [limits, setLimits] = useState<{
    remaining_requests?: string;
    reset_requests?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorObj, setErrorObj] = useState<{ isError: boolean; code?: number }>(
    { isError: false },
  );
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchLimits = async () => {
      setLoading(true);
      const res = await checkOpenAILimits();
      if (res?.error) {
        setErrorObj({ isError: true, code: res.code });
      } else if (res?.limits) {
        setLimits(res.limits);
        setErrorObj({ isError: false });
      }
      setLoading(false);
    };

    fetchLimits();
    const interval = setInterval(fetchLimits, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="relative z-10 glass-panel px-4 py-2 flex items-center gap-2 text-slate-500 text-xs shadow-sm w-fit ml-auto">
        <Activity className="w-4 h-4 animate-spin" />
        Consultando red...
      </div>
    );
  }

  const isLow = parseInt(limits?.remaining_requests || "0") < 500;
  const isAuthError = errorObj.code === 401;

  let badgeColor = "text-slate-700 bg-white/80 border-white/40";
  if (errorObj.isError || !limits)
    badgeColor = "text-red-600 bg-red-50/80 border-red-200";
  else if (isLow)
    badgeColor = "text-orange-600 bg-orange-50/80 border-orange-200";

  return (
    <div className="relative z-10 flex justify-end">
      <motion.div
        className={`glass-panel !rounded-xl overflow-hidden border shadow-lg backdrop-blur-md cursor-pointer ${badgeColor}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ height: 40, width: errorObj.isError ? 180 : 185 }}
        animate={{
          height: isHovered ? 160 : 40,
          width: isHovered ? 280 : errorObj.isError ? 180 : 185,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="w-full h-[40px] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold whitespace-nowrap">
            {errorObj.isError ? (
              <>
                <AlertCircle className="w-4 h-4 text-red-500" />
                {isAuthError ? "No Autorizado" : "Sin Conexión"}
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>
                  {limits?.remaining_requests ?? 0}{" "}
                  <span className="text-xs font-normal text-slate-500/80 ml-1">
                    restantes
                  </span>
                </span>
              </>
            )}
          </div>
          <div className="relative flex-shrink-0 ml-2">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-30 animate-ping ${errorObj.isError ? "bg-red-400" : "bg-blue-400"}`}></span>
            <Info className={`w-4 h-4 relative ${errorObj.isError ? "text-red-500" : "text-blue-500"}`} />
          </div>
        </div>

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="px-4 pb-4 pt-2 border-t border-slate-200/50 mt-1"
            >
              {errorObj.isError ? (
                <>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-2">
                    {isAuthError ? "Acceso Denegado (401)" : "Fallo de Red"}
                  </h4>
                  <p className="text-xs text-red-700/80 leading-relaxed mb-3">
                    {isAuthError
                      ? "La API rechazó la conexión. Por favor, asegúrate de haber colocado tu API_SECRET_KEY correctamente en el archivo .env.local."
                      : "No se pudo conectar con la API de Social Debt en la URL configurada. Verifica que el servidor remoto esté encendido."}
                  </p>
                </>
              ) : (
                <>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Cuota de Red OpenAI
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    Número estimado de comentarios restantes que puedes analizar antes de alcanzar el límite dinámico de la API.
                  </p>
                  <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-slate-200/30">
                    <span className="text-slate-500/90 font-medium">Reinicio de cuota en:</span>
                    <span className="font-mono text-slate-700 font-semibold tracking-wide">
                      {limits?.reset_requests}
                    </span>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
