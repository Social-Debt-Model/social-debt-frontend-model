"use client";

import React, { useState, useRef, useEffect } from "react";
import { useOntology } from "../ontology/useOntology";
import {
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Target,
  Users,
  Shield,
  Wrench,
  TrendingUp,
  Activity,
} from "lucide-react";
import { ClassifyTextResponse } from "./actions";

const MicrocauseCard = ({
  mc,
  isDashboardMode = false,
}: {
  mc: {
    ontology_id: string;
    similarity: number;
    cause_type?: string;
    risks?: string[];
    community_smells?: string[];
    preventive_strategies?: string[];
    corrective_strategies?: string[];
    effects?: string[];
    indicators?: string[];
    metrics?: string[];
  };
  isDashboardMode?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // SOLUCIÓN PUNTO 7: Importar el getter específico para los Community Smells
  const {
    getMicroCauseDetails,
    getStrategyDetails,
    getMicrocauseTypeDetails,
    getEffectDetails,
    getCommunitySmellDetails,
    getRiskDetails,
    getIndicatorDetails,
    getMetricDetails,
  } = useOntology();

  const microDesc = getMicroCauseDetails(mc.ontology_id);

  const hasDetails =
    mc.risks?.length ||
    mc.community_smells?.length ||
    mc.preventive_strategies?.length ||
    mc.corrective_strategies?.length ||
    mc.effects?.length ||
    mc.indicators?.length ||
    mc.metrics?.length;

  const renderList = (
    title: string,
    items: string[] | undefined,
    getter: (id: string) => { name: string; description?: string | null },
    Icon: React.ElementType,
    colorClass: string,
  ) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="break-inside-avoid mb-6 last:mb-0 inline-block w-full">
        <h4
          className={`text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${colorClass}`}
        >
          <Icon className="w-4 h-4" />
          {title}
        </h4>
        <ul className="flex flex-col gap-2">
          {items.map((id, idx) => {
            const detail = getter(id);
            return (
              <li
                key={idx}
                className="text-base bg-white/50 px-4 py-2.5 rounded-lg border border-slate-100 shadow-sm"
              >
                <span className="font-bold block text-slate-800">
                  {detail.name}
                </span>
                {detail.description && (
                  <span className="text-slate-600 text-sm mt-1 block">
                    {detail.description}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div
      className={`p-4 rounded-xl shadow-sm flex flex-col gap-1.5 transition-colors border min-w-0 break-words ${
        isDashboardMode
          ? "bg-slate-50 border-slate-200 hover:bg-slate-100"
          : "bg-white/60 border-white hover:bg-white/80"
      }`}
    >
      <div
        className="cursor-pointer min-w-0"
        onClick={() => hasDetails && setIsOpen(!isOpen)}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 md:gap-4 mb-2 min-w-0">
          <div className="flex items-start md:items-center justify-between gap-2 w-full md:w-auto md:flex-1 min-w-0">
            <div className="min-w-0 flex-1 break-words">
              <span className="font-bold text-lg text-indigo-900 inline mr-2">
                {microDesc.name}
              </span>
              {mc.cause_type && (
                <span className="hidden md:inline-flex text-sm font-semibold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md whitespace-nowrap align-middle mb-1">
                  {getMicrocauseTypeDetails(mc.cause_type).name}
                </span>
              )}
            </div>
            
            <span className="md:hidden flex items-center gap-1 text-sm font-medium bg-indigo-50/80 text-indigo-700 px-2 py-1 rounded-full shadow-sm whitespace-nowrap flex-shrink-0 mt-0.5" title="Nivel de similitud / confianza">
              <CheckCircle className="w-3.5 h-3.5 opacity-75 flex-shrink-0" />
              <span className="whitespace-nowrap block">{Math.round(mc.similarity * 100)}% sim.</span>
            </span>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto flex-shrink-0 flex-wrap md:flex-nowrap">
            {mc.cause_type && (
              <span className="md:hidden flex items-center text-sm font-semibold text-indigo-600 bg-indigo-50/80 px-2 py-1.5 rounded-md whitespace-nowrap flex-shrink-0">
                {getMicrocauseTypeDetails(mc.cause_type).name}
              </span>
            )}
            
            <span className="hidden md:flex items-center gap-1 text-sm font-medium bg-indigo-50/80 text-indigo-700 px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap flex-shrink-0" title="Nivel de similitud / confianza">
              <CheckCircle className="w-4 h-4 opacity-75 flex-shrink-0" />
              <span className="whitespace-nowrap block">{Math.round(mc.similarity * 100)}% sim.</span>
            </span>
            
            {hasDetails && (
              <button className="flex text-sm font-semibold text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100 transition px-2 py-1 md:py-0.5 rounded-md items-center gap-1 whitespace-nowrap flex-shrink-0 ml-auto md:ml-0">
                {isOpen ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 flex-shrink-0" />
                    Ocultar<span className="hidden md:inline">&nbsp;detalles</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                    Ver<span className="hidden md:inline">&nbsp;detalles</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        <span className="text-base text-indigo-900/80 leading-relaxed block break-words">
          {microDesc.description}
        </span>
      </div>

      {isOpen && hasDetails && (
        <div className="mt-4 pt-4 border-t border-indigo-100/50 animate-in fade-in slide-in-from-top-2 duration-200 columns-1 md:columns-2 gap-6">
          {renderList(
            "Community Smells",
            mc.community_smells,
            getCommunitySmellDetails, // <-- SOLUCIÓN PUNTO 7: Usamos el getter de la ontología
            Users,
            "text-purple-600",
          )}
          {renderList(
            "Riesgos",
            mc.risks,
            getRiskDetails,
            Shield,
            "text-red-500",
          )}
          {renderList(
            "Efectos",
            mc.effects,
            getEffectDetails,
            AlertCircle,
            "text-orange-500",
          )}
          {renderList(
            "Estrategias Preventivas",
            mc.preventive_strategies,
            getStrategyDetails,
            Target,
            "text-emerald-600",
          )}
          {renderList(
            "Estrategias Correctivas",
            mc.corrective_strategies,
            getStrategyDetails,
            Wrench,
            "text-blue-600",
          )}
          {renderList(
            "Indicadores",
            mc.indicators,
            getIndicatorDetails,
            Activity,
            "text-indigo-500",
          )}
          {renderList(
            "Métricas",
            mc.metrics,
            getMetricDetails,
            TrendingUp,
            "text-slate-600",
          )}
        </div>
      )}
    </div>
  );
};

export const TextResultCard = ({
  result,
  isDashboardMode = false,
  index,
}: {
  result: ClassifyTextResponse;
  isDashboardMode?: boolean;
  index?: number;
}) => {
  const [isCardOpen, setIsCardOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isInitialRender = useRef(true);
  const { getMacroCauseDescription } = useOntology();

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    if (cardRef.current && !isDashboardMode) {
      const timer = setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isCardOpen, isDashboardMode]);

  if (result.error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
        <AlertTriangle className="inline-block w-5 h-5 mr-2" />
        {result.error}
      </div>
    );
  }

  if (result.is_noise) {
    return (
      <div
        className={`w-full min-w-0 break-words p-4 md:p-5 flex flex-col gap-4 rounded-bl-none border-l-4 border-slate-300 ${
          isDashboardMode
            ? "bg-white border border-slate-100 shadow-sm"
            : "glass-panel"
        }`}
      >
        {result.cleaned_text && (
          <div
            className={`p-4 rounded-xl shadow-sm border ${
              isDashboardMode
                ? "bg-slate-50 border-slate-200"
                : "bg-white/60 border-slate-200"
            }`}
          >
            
            <div className="flex justify-between items-center mb-1">
              {index !== undefined && (
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                  Comentario {index}
                </span>
              )}
              {result.issue_number && (
                <p className="text-xs font-bold text-slate-400">
                  Issue #{result.issue_number}
                </p>
              )}
            </div>
            <p className="text-sm text-slate-700 italic leading-relaxed">
              &quot;{result.cleaned_text}&quot;
            </p>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-slate-500 relative group cursor-help w-max mt-1">
          <span className="font-semibold text-base">Ruido Operativo</span>
          <Info className="w-4 h-4" />
          <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-800 text-white text-xs leading-relaxed rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-[999] pointer-events-none font-normal normal-case tracking-normal">
            Este comentario ha sido clasificado como ruido operativo (Ej. logs de bots o mensajes automáticos) y no representa deuda social genuina.
            <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800"></div>
          </div>
        </div>
      </div>
    );
  }

  const macroDesc = getMacroCauseDescription(result.macro_cause_code);
  const confidencePercent = Math.round((result.confidence || 0) * 100);
  const hasMicrocauses = result.microcauses && result.microcauses.length > 0;

  return (
    <div
      ref={cardRef}
      className={`w-full min-w-0 break-words p-4 md:p-5 flex flex-col gap-3 md:gap-4 rounded-bl-none border-l-4 border-indigo-500 transition-all ${
        isDashboardMode
          ? "bg-white border border-slate-200 shadow-sm"
          : "glass-panel"
      } ${hasMicrocauses ? "cursor-pointer hover:bg-slate-50" : ""}`}
      onClick={() => hasMicrocauses && setIsCardOpen(!isCardOpen)}
    >
      <div>
        {result.cleaned_text && (
          <div
            className={`p-4 rounded-xl shadow-sm border transition-colors ${
              isDashboardMode
                ? "bg-slate-50 border-slate-200"
                : "bg-white/60 border-indigo-100"
            }`}
          >
            
            <div className="flex justify-between items-center mb-1">
              {index !== undefined && (
                <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">
                  Comentario {index}
                </span>
              )}
              {result.issue_number && (
                <p className="text-xs font-bold text-indigo-400">
                  Issue #{result.issue_number}
                </p>
              )}
            </div>
            <p className="text-sm text-slate-700 italic leading-relaxed">
              &quot;{result.cleaned_text}&quot;
            </p>
          </div>
        )}

        <div
          className={`flex flex-col md:flex-row md:items-start justify-between gap-3 md:gap-4 min-w-0 ${result.cleaned_text ? "mt-4" : ""}`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm font-semibold uppercase tracking-wider text-indigo-900/70 break-words flex-1 min-w-0">
                Macrocausa Principal ({result.macro_cause_code})
              </p>
              <div className="md:hidden flex items-center gap-1 text-xs bg-indigo-50/80 text-indigo-700 px-2 py-1 rounded-full shadow-sm whitespace-nowrap flex-shrink-0" title="Nivel de similitud / confianza">
                <CheckCircle className="w-3.5 h-3.5 opacity-75 flex-shrink-0" />
                <span className="whitespace-nowrap font-medium block">{confidencePercent}% sim.</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xl font-bold text-indigo-900 leading-tight break-words">
                {macroDesc}
              </h3>
              {hasMicrocauses && (
                <button className="md:hidden flex items-center gap-1 text-sm bg-indigo-50/80 hover:bg-indigo-100 transition text-indigo-700 px-3 py-1.5 rounded-full shadow-sm font-medium whitespace-nowrap ml-auto flex-shrink-0">
                  {isCardOpen ? (
                    <>
                      <ChevronUp className="w-4 h-4 flex-shrink-0" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                      Detalles
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          
          <div className="hidden md:flex items-center justify-end gap-2 w-full md:w-auto flex-shrink-0 flex-wrap md:flex-nowrap">
            <div className="flex items-center gap-1 text-sm bg-indigo-50/80 text-indigo-700 px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap flex-shrink-0" title="Nivel de similitud / confianza">
              <CheckCircle className="w-4 h-4 opacity-75 flex-shrink-0" />
              <span className="whitespace-nowrap font-medium block">{confidencePercent}% sim.</span>
            </div>
            {hasMicrocauses && (
              <button className="flex items-center gap-1 text-sm bg-indigo-50/80 hover:bg-indigo-100 transition text-indigo-700 px-3 py-1.5 rounded-full shadow-sm font-medium whitespace-nowrap ml-auto md:ml-0">
                {isCardOpen ? (
                  <>
                    <ChevronUp className="w-4 h-4 flex-shrink-0" />
                    Ocultar<span className="hidden md:inline">&nbsp;detalles</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    Ver<span className="hidden md:inline">&nbsp;detalles</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {isCardOpen && hasMicrocauses && (
        <div 
          className="mt-2 space-y-3 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200 cursor-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-semibold uppercase tracking-wider mb-2 text-indigo-900/70">
            Microcausas Encontradas
          </p>
          {result.microcauses.map((mc, idx) => (
            <MicrocauseCard
              key={idx}
              mc={mc}
              isDashboardMode={isDashboardMode}
            />
          ))}
        </div>
      )}
    </div>
  );
};
