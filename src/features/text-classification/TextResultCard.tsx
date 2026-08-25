"use client";

import React, { useState } from "react";
import { useOntology } from "../ontology/useOntology";
import {
  AlertTriangle,
  CheckCircle,
  HelpCircle,
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
  const {
    getMicroCauseDetails,
    getStrategyDetails,
    getEffectDetails,
    getGenericDetails,
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
      <div className="mb-4 last:mb-0">
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
      className={`p-4 rounded-xl shadow-sm flex flex-col gap-1.5 transition-colors border ${
        isDashboardMode
          ? "bg-slate-50 border-slate-200 hover:bg-slate-100"
          : "bg-white/60 border-white hover:bg-white/80"
      }`}
    >
      <div
        className="cursor-pointer"
        onClick={() => hasDetails && setIsOpen(!isOpen)}
      >
        <div className="flex flex-col-reverse md:flex-row md:justify-between md:items-center gap-2 mb-1.5">
          <span className="font-bold text-lg text-indigo-900 flex-1 pr-0 md:pr-2">
            {microDesc.name}
          </span>
          <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-2 flex-shrink-0">
            <span className="text-sm font-semibold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md">
              {Math.round(mc.similarity * 100)}% sim
            </span>
            {hasDetails && (
              <button className="text-indigo-400 hover:text-indigo-600 transition bg-indigo-50/50 p-1 rounded-full">
                {isOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
        <span className="text-base text-indigo-900/80 leading-relaxed block">
          {microDesc.description}
        </span>
      </div>

      {isOpen && hasDetails && (
        <div className="mt-4 pt-4 border-t border-indigo-100/50 animate-in fade-in slide-in-from-top-2 duration-200">
          {renderList(
            "Community Smells",
            mc.community_smells,
            getGenericDetails,
            Users,
            "text-purple-600",
          )}
          {renderList(
            "Riesgos",
            mc.risks,
            getGenericDetails,
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
            getGenericDetails,
            Activity,
            "text-indigo-500",
          )}
          {renderList(
            "Métricas",
            mc.metrics,
            getGenericDetails,
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
  const { getMacroCauseDescription } = useOntology();

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
        className={`p-5 flex flex-col gap-4 rounded-bl-none border-l-4 border-slate-300 ${
          isDashboardMode
            ? "bg-white border border-slate-100 shadow-sm"
            : "glass-panel"
        }`}
      >
        {result.cleaned_text && (
          <div
            className={`p-4 rounded-xl shadow-sm relative border ${
              isDashboardMode
                ? "bg-slate-50 border-slate-200"
                : "bg-white/60 border-slate-200"
            }`}
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-slate-300 rounded-l-xl" />
            <div className="flex justify-between items-center mb-1">
              {index !== undefined && (
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                  #{index}
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

        <div className="flex items-center gap-2 text-slate-500">
          <HelpCircle className="w-5 h-5" />
          <span className="font-semibold text-base">Ruido Operativo</span>
        </div>
        <p className="text-sm text-slate-500">
          Este comentario ha sido clasificado como ruido operativo (Ej. logs de
          bots o mensajes automáticos) y no representa deuda social genuina.
        </p>
      </div>
    );
  }

  const macroDesc = getMacroCauseDescription(result.macro_cause_code);
  const confidencePercent = Math.round((result.confidence || 0) * 100);
  const hasMicrocauses = result.microcauses && result.microcauses.length > 0;

  return (
    <div
      className={`p-4 md:p-5 flex flex-col gap-3 md:gap-4 rounded-bl-none border-l-4 border-indigo-500 transition-all ${
        isDashboardMode
          ? "bg-white border border-slate-200 shadow-sm"
          : "glass-panel"
      }`}
    >
      <div
        className={hasMicrocauses ? "cursor-pointer group" : ""}
        onClick={() => hasMicrocauses && setIsCardOpen(!isCardOpen)}
      >
        {result.cleaned_text && (
          <div
            className={`p-4 rounded-xl shadow-sm relative border transition-colors ${
              isDashboardMode
                ? "bg-slate-50 border-slate-200 group-hover:bg-slate-100"
                : "bg-white/60 border-indigo-100 group-hover:bg-white/80"
            }`}
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-300 rounded-l-xl" />
            <div className="flex justify-between items-center mb-1">
              {index !== undefined && (
                <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">
                  #{index}
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
          className={`grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 md:gap-y-0.5 ${result.cleaned_text ? "mt-4" : ""}`}
        >
          <p className="col-start-1 row-start-1 text-sm font-semibold uppercase tracking-wider text-indigo-900/70 self-center md:self-end">
            Macrocausa Principal ({result.macro_cause_code})
          </p>
          <h3 className="col-span-2 md:col-span-1 col-start-1 row-start-2 text-xl font-bold text-indigo-900 leading-tight">
            {macroDesc}
          </h3>
          <div className="col-start-2 row-start-1 md:row-span-2 flex items-center justify-end gap-2 self-center md:self-start md:mt-1">
            <div className="flex items-center gap-1 text-sm bg-indigo-50/80 text-indigo-700 px-3 py-1.5 rounded-full shadow-sm">
              <CheckCircle className="w-4 h-4 opacity-75" />
              <span className="font-medium">{confidencePercent}%</span>
            </div>
            {hasMicrocauses && (
              <button className="text-indigo-400 group-hover:text-indigo-600 transition bg-indigo-50/50 p-1.5 rounded-full ml-1">
                {isCardOpen ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {isCardOpen && hasMicrocauses && (
        <div className="mt-2 space-y-3 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
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
