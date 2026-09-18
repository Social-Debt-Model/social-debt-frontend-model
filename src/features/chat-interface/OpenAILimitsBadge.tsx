"use client";

import React, { useEffect, useState, useRef } from "react";
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

  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLimits = async () => {
      setLoading(true);
      const res = await checkOpenAILimits();
      if (res?.error) {
        setErrorObj({ isError: true, code: res.code });
        console.error(`[Social Debt API] Error de conexión (${res.code}). ${res.code === 401 ? "Verifica la API_SECRET_KEY en el backend." : "Servidor inalcanzable."}`);
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (badgeRef.current && !badgeRef.current.contains(e.target as Node)) {
        setIsHovered(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="relative z-50 flex justify-end">
        <div className="glass-panel px-0 md:px-4 w-[40px] md:w-auto h-[40px] rounded-full md:rounded-xl flex items-center justify-center gap-2 text-slate-500 shadow-sm ml-auto">
          <Activity className="w-4 h-4 animate-spin" />
          <span className="hidden md:inline text-xs">Consultando red...</span>
        </div>
      </div>
    );
  }

  const isLow = parseInt(limits?.remaining_requests || "0") < 500;
  const isAuthError = errorObj.code === 401;

  let badgeColor = "text-slate-700 bg-white/95 md:bg-white/80 border-white/40";
  if (errorObj.isError || !limits)
    badgeColor = "text-red-600 bg-red-50/95 md:bg-red-50/80 border-red-200";
  else if (isLow)
    badgeColor =
      "text-orange-600 bg-orange-50/95 md:bg-orange-50/80 border-orange-200";

  return (
    <div className="relative z-50 flex justify-end" ref={badgeRef}>
      {/* Botón principal */}
      <div
        className={`glass-panel h-[40px] flex items-center justify-center rounded-full md:rounded-xl border shadow-sm backdrop-blur-md cursor-pointer transition-all ${badgeColor} w-[40px] md:w-auto md:px-4`}
        onClick={() => setIsHovered(!isHovered)}
      >
        <div className="hidden md:flex items-center gap-2 text-sm font-semibold whitespace-nowrap mr-2">
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

        <div className="relative flex-shrink-0 flex items-center justify-center">
          {!isHovered && (
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-30 animate-ping ${errorObj.isError ? "bg-red-400" : "bg-blue-400"}`}
            ></span>
          )}
          <Info
            className={`w-5 h-5 md:w-4 md:h-4 relative ${errorObj.isError ? "text-red-500" : "text-blue-500"}`}
          />
        </div>
      </div>

      {/* Popover desplegable absoluto */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-[48px] right-0 w-[280px] p-4 backdrop-blur-xl border shadow-2xl rounded-2xl ${badgeColor}`}
          >
            {errorObj.isError ? (
              <>
                <h4 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-2">
                  Sin Conexión
                </h4>
                <p className="text-xs text-red-700/80 leading-relaxed">
                  El sistema se encuentra desconectado. Las funciones de análisis pueden no estar disponibles en este momento.
                </p>
              </>
            ) : (
              <>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Cuota de Red OpenAI
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  Número estimado de comentarios restantes que se pueden analizar
                  antes de alcanzar el límite dinámico de la API.
                </p>
                <div className="flex items-center gap-2 text-lg font-bold text-slate-800">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  {limits?.remaining_requests ?? 0} restantes
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
