"use client";

import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart as RechartsPieChart,
  Pie,
  Legend,
} from "recharts";
import { useOntology } from "../ontology/useOntology";
import {
  BarChart3, Info,
  AlertTriangle,
  Layers,
  ListFilter, Download,
  Users,
  PieChart,
  ChevronDown, 
  Search,
  HelpCircle, 
} from "lucide-react";
import { TextResultCard } from "../text-classification/TextResultCard";

import { BatchResultData, MetricsData } from "../batch-classification/actions";
import { AlgorithmAuditTrail } from "./AlgorithmAuditTrail";

type BatchDashboardProps = {
  resultData: BatchResultData;
  filename?: string;
  onDownload?: () => void;
};

const CHART_PALETTE = ["#4f46e5", "#818cf8"];
const PIE_PALETTE = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6", "#14b8a6"];

export const BatchDashboard = ({ resultData, filename = "Analisis", onDownload }: BatchDashboardProps) => {
  const { comments = [], social_debt_metrics, issues_metrics } = resultData;
  const metrics: Record<string, MetricsData> = (social_debt_metrics ||
    issues_metrics ||
    {}) as Record<string, MetricsData>;
  const issueKeys = Object.keys(metrics);
  const [activeTab, setActiveTab] = useState<"audit" | "dashboard">("audit");

  const orphanComments = useMemo(() => {
    return comments.filter((c) => !c.issue_number);
  }, [comments]);

  const hasOrphanComments = orphanComments.length > 0;

  const [selectedIssue, setSelectedIssue] = useState<string>(
    issueKeys[0] || (hasOrphanComments ? "individuales" : "all"),
  );
  const [showComments, setShowComments] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 10;
  
  const [showNoise, setShowNoise] = useState(false);
  const [selectedMacrocauseFilter, setSelectedMacrocauseFilter] = useState<string | null>(null);
  const commentsListRef = React.useRef<HTMLDivElement>(null);
  const mainHeaderRef = React.useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  React.useEffect(() => {
    if (mainHeaderRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        setHeaderHeight(entries[0].target.getBoundingClientRect().height);
      });
      resizeObserver.observe(mainHeaderRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [activeTab]);

  const filteredIssues = useMemo(() => {
    return issueKeys.filter((key) =>
      key.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [issueKeys, searchQuery]);

  const [prevSelectedIssue, setPrevSelectedIssue] = useState(selectedIssue);
  if (selectedIssue !== prevSelectedIssue) {
    setPrevSelectedIssue(selectedIssue);
    if (currentPage !== 1) setCurrentPage(1);
    setSelectedMacrocauseFilter(null);
  }

  const { getMacroCauseDescription } = useOntology();

  const currentMetrics = metrics[selectedIssue] as MetricsData | undefined;

  const issueComments = useMemo(() => {
    if (selectedIssue === "individuales") return orphanComments;
    return comments.filter(
      (c) => c.issue_number && String(c.issue_number) === selectedIssue
    );
  }, [selectedIssue, comments, orphanComments]);

  const funnelStats = useMemo(() => {
    const total = issueComments.length;
    const noise = issueComments.filter((c) => c.is_noise).length;
    const causeH = issueComments.filter((c) => !c.is_noise && c.macro_cause_code === "H").length;
    const debt = total - noise - causeH;
    return { total, noise, causeH, debt };
  }, [issueComments]);

  
  const microChartData = useMemo(() => {
    if (!currentMetrics?.dominant_microcauses) return [];
    return currentMetrics.dominant_microcauses.map((item: [string, number], index: number) => ({
      name: item[0],
      value: parseFloat(item[1].toFixed(2)),
      color: CHART_PALETTE[index % CHART_PALETTE.length]
    }));
  }, [currentMetrics]);

  const chartData = useMemo(() => {
    if (!currentMetrics?.dominant_macrocauses) return [];
    let colorIndex = 0;
    return [...currentMetrics.dominant_macrocauses].sort((a, b) => b[1] - a[1]).map((item: [string, number]) => {
      const code = item[0];
      const color = code === "H" ? "#94a3b8" : PIE_PALETTE[colorIndex % PIE_PALETTE.length];
      if (code !== "H") colorIndex++;
      return {
        name: code,
        desc: getMacroCauseDescription(code),
        label: `${code} - ${getMacroCauseDescription(code)}`,
        count: item[1],
        color,
      };
    });
  }, [currentMetrics, getMacroCauseDescription]);

  if (issueKeys.length === 0 && hasOrphanComments) {
    const totalPages = Math.ceil(comments.length / pageSize);
    const paginatedComments = comments.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    );

    return (
      <div className="glass-panel p-6 flex flex-col gap-4 rounded-bl-none w-full h-full overflow-hidden">
        <h2 className="text-xl font-bold text-slate-800 flex-shrink-0">
          Resultados del Análisis
        </h2>
        <p className="text-sm text-slate-600 flex-shrink-0">
          Se analizaron {comments.length} comentarios individualmente.
        </p>
        <button
          onClick={() => setShowComments(!showComments)}
          className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg w-fit text-sm font-medium border border-blue-100 hover:bg-blue-100 transition flex-shrink-0"
        >
          {showComments ? "Ocultar Comentarios" : "Ver Comentarios"}
        </button>
        {showComments && (
          <div className="flex-1 overflow-y-auto pr-2 pb-4 mt-2 flex flex-col gap-8">
            {paginatedComments.map((c, i) => (
              <TextResultCard
                key={i}
                result={c}
                isDashboardMode={true}
                index={(currentPage - 1) * pageSize + i + 1}
              />
            ))}
            {totalPages > 1 && (
              <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-slate-200 mt-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-white text-slate-600 text-sm font-medium rounded-lg shadow-sm border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
                >
                  Anterior
                </button>
                <span className="text-sm font-medium text-slate-600">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className="px-3 py-1 bg-white text-slate-600 text-sm font-medium rounded-lg shadow-sm border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const sdiPercent = typeof currentMetrics?.social_debt_index === "number" ? Math.round(currentMetrics.social_debt_index * 100) : 0;
  const isSingleIssue = issueKeys.length === 1;

  let sdiColor = "text-emerald-500";
  if (isSingleIssue) {
    sdiColor = "text-slate-500";
  } else {
    if (sdiPercent > 33) sdiColor = "text-amber-500";
    if (sdiPercent > 66) sdiColor = "text-red-500";
  }

  return (
    <div className="glass-panel flex flex-col rounded-bl-none w-full h-full overflow-hidden border border-slate-100/40 shadow-xl">
      <div className="flex border-b border-slate-200/50 bg-white/40 relative z-30">
        <button 
          onClick={() => { setActiveTab("audit"); setTimeout(() => document.getElementById("dashboard-scroll-container")?.scrollTo({ top: 0, behavior: "smooth" }), 50); }} 
          className={`flex-1 py-4 flex items-center justify-center gap-2 text-center font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === "audit" ? "text-indigo-700 border-b-2 border-indigo-500 bg-indigo-50/50" : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-700"}`}
        >
          <Search className="w-4 h-4" /> Trazabilidad del Modelo
        </button>
        <button 
          onClick={() => { setActiveTab("dashboard"); setTimeout(() => document.getElementById("dashboard-scroll-container")?.scrollTo({ top: 0, behavior: "smooth" }), 50); }} 
          className={`flex-1 py-4 flex items-center justify-center gap-2 text-center font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === "dashboard" ? "text-blue-700 border-b-2 border-blue-500 bg-blue-50/50" : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-700"}`}
        >
          <BarChart3 className="w-4 h-4" /> Dashboard por Issue
        </button>
      </div>

      <div id="dashboard-scroll-container" className="flex-1 overflow-y-auto overflow-x-hidden relative">
        {activeTab === "audit" && (
          <div className="p-4 md:p-6 w-full max-w-5xl mx-auto">
            <AlgorithmAuditTrail resultData={resultData} filename={filename} />
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="flex flex-col min-h-full">
            <div ref={mainHeaderRef} className="bg-white/90 backdrop-blur-md p-4 md:p-6 border-b border-slate-100/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm z-30 sticky top-0">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Panel de Deuda Social
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Análisis completado para {comments.length} comentarios totales.
                </p>
              </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-end w-full md:w-auto gap-4 flex-shrink-0">
          {onDownload && (
            <button
              onClick={onDownload}
              className="px-5 py-2.5 bg-white text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all w-full md:w-auto whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Descargar Resultados
            </button>
          )}
          
          {hasOrphanComments && (
            <div className="relative flex flex-col items-start md:items-end gap-1">
              <span className="text-xs font-semibold text-slate-500 ml-1 md:mr-1 md:ml-0 uppercase tracking-wide opacity-0 hidden md:block">
                .
              </span>
              <button
                onClick={() => setSelectedIssue("individuales")}
                className={`bg-white w-full md:w-auto px-5 py-2.5 flex items-center justify-center gap-2 outline-none text-sm font-bold transition-all duration-200 cursor-pointer shadow-sm border rounded-xl ${
                  selectedIssue === "individuales"
                    ? "border-slate-300 ring-0 text-slate-800 bg-slate-50"
                    : "text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Individuales ({orphanComments.length})
              </button>
            </div>
          )}

          {issueKeys.length > 0 && (
            <div className="relative flex flex-col items-start md:items-end gap-1">
              <span className="text-xs font-semibold text-slate-500 mr-1 uppercase tracking-wide">
                Explorar Issues (Total: {issueKeys.length})
              </span>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`bg-white w-full md:w-72 px-5 py-2.5 flex items-center justify-between gap-3 outline-none text-sm font-bold transition-all duration-200 cursor-pointer shadow-sm border rounded-xl ${
                  selectedIssue !== "individuales"
                    ? "border-slate-300 ring-0 text-slate-800 bg-slate-50"
                    : "text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span className="truncate flex items-center gap-2">
                  {selectedIssue === "individuales"
                    ? "Selecciona un Issue para explorar..."
                    : `Issue: ${selectedIssue} (${metrics[selectedIssue]?.comment_count || 0} mensajes)`}
                </span>
                <ChevronDown className="w-5 h-5 flex-shrink-0 text-indigo-600" />
              </button>

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  ></div>

                  <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl p-2 z-[999] flex flex-col gap-2 shadow-2xl border border-slate-100">
                    <div className="relative flex-shrink-0">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Buscar Issue..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/70 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all placeholder:text-slate-400"
                      />
                    </div>

                    <div className="max-h-60 overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
                      {filteredIssues.length === 0 ? (
                        <p className="text-xs text-center text-slate-500 py-3">
                          No se encontraron issues.
                        </p>
                      ) : (
                        filteredIssues.map((key) => (
                          <button
                            key={key}
                            onClick={() => {
                              setSelectedIssue(key);
                              setIsDropdownOpen(false);
                              setSearchQuery("");
                            }}
                            className={`text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                              selectedIssue === key
                                ? "bg-indigo-50 text-indigo-700 font-medium"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            Issue: {key}
                            <span className="block text-xs text-slate-500">
                              {metrics[key].comment_count} comentarios
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col w-full">
        {currentMetrics && (
          <div className="flex flex-col w-full">
            <div className="px-4 md:px-6 pt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center flex-1">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comentarios en Issue</span>
                 <span className="text-2xl font-black text-slate-700">{funnelStats.total}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center flex-1">
                 <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Ruido (Descartado)</span>
                 <span className="text-2xl font-black text-red-500">{funnelStats.noise}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center flex-1">
                 <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider">Causa H (No identificable)</span>
                 <span className="text-2xl font-black text-yellow-500">{funnelStats.causeH}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center flex-1">
                 <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Con Deuda Social</span>
                 <span className="text-2xl font-black text-emerald-600">{funnelStats.debt}</span>
              </div>
            </div>
            
            <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="flex flex-col gap-6">
              <div
                className={"bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between relative "}
              >
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-1 flex items-center gap-1.5 relative group cursor-help w-max">
                    Índice de Deuda Social (SDI)
                    <Info className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs leading-relaxed rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-[999] pointer-events-none font-normal text-center normal-case tracking-normal">
                      {isSingleIssue 
                        ? "El SDI es un índice de ranking relativo. Requiere el análisis simultáneo de al menos 2 Issues distintos para poder calcular y comparar la varianza de la deuda social."
                        : "El SDI (Social Debt Index) es un índice relativo. Se calcula comparando el volumen y severidad de este Issue con respecto a todos los demás Issues analizados en este lote."}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                    </div>
                  </div>
                  <p className="text-lg font-semibold">
                    {isSingleIssue ? "No Calculable" : currentMetrics.social_debt_level}
                  </p>
                </div>
                <div className={`text-4xl md:text-5xl font-black ${sdiColor}`}>
                  {isSingleIssue ? "N/A" : sdiPercent}
                  {!isSingleIssue && <span className="text-lg md:text-xl text-slate-400 font-bold ml-1">/100</span>}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative ">
                <h3 className="text-sm md:text-base font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Distribución de Macrocausas
                  </h3>
                <div className="w-full">
                  <ResponsiveContainer width="100%" height={240}>
                    <RechartsPieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Pie
                        data={chartData}
                        cx="35%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="label"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip wrapperStyle={{ zIndex: 999 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 text-xs">
                                <p className="font-bold text-slate-800 mb-1">
                                  {payload[0].payload.name}:{" "}
                                  {payload[0].payload.desc}
                                </p>
                                <p className="text-blue-600 font-medium">
                                  Frecuencia: {payload[0].value}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        wrapperStyle={{ fontSize: '15px', lineHeight: '22px', width: '55%', right: 0 }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {currentMetrics.macro_diversity !== undefined && (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative ">
                  <h3 className="text-sm md:text-base font-semibold text-slate-700 mb-3 flex items-center gap-2 group relative">
                  <PieChart className="w-4 h-4 text-emerald-500" /> Métricas de Diversidad
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-slate-800 text-white text-xs leading-tight rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-[999] font-normal normal-case pointer-events-none">
                    Cuantifica cuántos tipos distintos de causas, riesgos o patrones nocivos están ocurriendo de forma simultánea en este hilo.
                    <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800"></div>
                  </div>
                </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50/80 p-2 rounded-md border border-slate-100 flex justify-between items-center">
                      <span className="text-xs md:text-sm text-slate-600">
                        Macrocausas
                      </span>
                      <span className="text-sm md:text-base font-bold text-slate-800">
                        {currentMetrics.macro_diversity}
                      </span>
                    </div>
                    <div className="bg-slate-50/80 p-2 rounded-md border border-slate-100 flex justify-between items-center">
                      <span className="text-xs md:text-sm text-slate-600">
                        Microcausas
                      </span>
                      <span className="text-sm md:text-base font-bold text-slate-800">
                        {currentMetrics.micro_diversity}
                      </span>
                    </div>
                    <div className="bg-slate-50/80 p-2 rounded-md border border-slate-100 flex justify-between items-center">
                      <span className="text-xs md:text-sm text-slate-600">
                        Riesgos
                      </span>
                      <span className="text-sm md:text-base font-bold text-slate-800">
                        {currentMetrics.risk_diversity}
                      </span>
                    </div>
                    <div className="bg-slate-50/80 p-2 rounded-md border border-slate-100 flex justify-between items-center">
                      <span className="text-xs md:text-sm text-slate-600">
                        Smells
                      </span>
                      <span className="text-sm md:text-base font-bold text-slate-800">
                        {currentMetrics.smell_diversity}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-sm md:text-base font-semibold text-slate-700 mb-3 flex items-center gap-2 group relative">
                  <Users className="w-4 h-4 text-purple-600" /> Community Smells
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-slate-800 text-white text-xs leading-tight rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-[999] font-normal normal-case pointer-events-none">
                    Patrones de comportamiento tóxico o ineficiente en la comunidad. El número entero indica la frecuencia absoluta de apariciones de este patrón a lo largo de todo el hilo.
                    <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800"></div>
                  </div>
                </h3>
                <ul className="space-y-2">
                  {currentMetrics.dominant_community_smells?.map(
                    (s: [string, number], idx: number) => (
                      <li
                        key={idx}
                        className="text-xs md:text-sm py-1.5 flex justify-between items-center border-b border-slate-100/50 last:border-0"
                      >
                        <span className="text-slate-700 pr-2">
                          {s[0].split("_").pop()?.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span className="font-bold text-slate-700 flex-shrink-0">
                          {Math.round(s[1])}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-[2] flex flex-col">
                <h3 className="text-sm md:text-base font-semibold text-slate-700 mb-3 flex items-center gap-2 group relative">
                  <ListFilter className="w-4 h-4 text-indigo-500" /> Microcausas
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-slate-800 text-white text-xs leading-tight rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-[999] font-normal normal-case pointer-events-none">
                    Lista de los problemas sociales o técnicos específicos más graves detectados. El valor representa la masa acumulada de certeza de la IA; es decir, la suma de las probabilidades semánticas cada vez que este problema fue detectado en el hilo. Un valor alto indica que el problema se discutió repetidamente y con mucha evidencia.
                    <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800"></div>
                  </div>
                </h3>
                <div className="w-full mt-2 flex-1 relative min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={microChartData}
                      layout="vertical"
                      margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={230}
                        tick={{ fontSize: 14, fill: "#334155" }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                      />
                      <Tooltip wrapperStyle={{ zIndex: 999 }}
                        cursor={{ fill: "rgba(0,0,0,0.05)" }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 rounded shadow border border-slate-100 text-xs z-[999]">
                                <p className="font-bold text-slate-800 mb-1 max-w-[200px] whitespace-normal">
                                  {payload[0].payload.name}
                                </p>
                                <p className="text-indigo-600 font-medium">
                                  Certeza Acumulada: {payload[0].value}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                         {microChartData.map((entry, idx) => (
                           <Cell key={`cell-${idx}`} fill={entry.color} />
                         ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-1">
                <h3 className="text-sm md:text-base font-semibold text-slate-700 mb-3 flex items-center gap-2 group relative">
                  <AlertTriangle className="w-4 h-4 text-orange-500" /> Riesgos
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-slate-800 text-white text-xs leading-tight rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-[999] font-normal normal-case pointer-events-none">
                    Posibles consecuencias negativas si la deuda social de este hilo no se resuelve. El número indica la frecuencia absoluta, es decir, cuántas veces el modelo infirió este riesgo específico basándose en los comentarios.
                    <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800"></div>
                  </div>
                </h3>
                <ul className="space-y-2">
                  {currentMetrics.dominant_risks?.map(
                    (r: [string, number], idx: number) => (
                      <li
                        key={idx}
                        className="text-xs md:text-sm py-1.5 flex justify-between items-center border-b border-slate-100/50 last:border-0"
                      >
                        <span className="text-slate-700 pr-2">
                          {r[0].split("_").pop()?.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span className="font-bold text-slate-700 flex-shrink-0">
                          {Math.round(r[1])}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-sm md:text-base font-semibold text-slate-700 mb-3 flex items-center gap-2 group relative">
                  <Layers className="w-4 h-4 text-pink-500" /> Tipos de Causa
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-slate-800 text-white text-xs leading-tight rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-[999] font-normal normal-case pointer-events-none">
                    Naturaleza teórica subyacente de los problemas detectados. El valor indica cuántas veces problemas de esta naturaleza fueron detectados en este hilo.
                    <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800"></div>
                  </div>
                </h3>
                <ul className="space-y-2">
                  {currentMetrics.dominant_microcause_types?.map(
                    (m: [string, number], idx: number) => (
                      <li
                        key={idx}
                        className="text-xs md:text-sm py-1.5 flex justify-between items-center border-b border-slate-100/50 last:border-0"
                      >
                        <span className="text-slate-700 pr-2">
                          {m[0].replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span className="font-bold text-slate-700 flex-shrink-0">
                          {Math.round(m[1])}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
        )}

        {true && (
          <div className="bg-slate-50/50 flex-shrink-0 flex-1">
            {selectedIssue === "individuales" && (
              <div className="px-4 md:px-6 pt-6 pb-2">
                <h3 className="text-lg font-semibold text-slate-800 mb-1">
                  Comentarios Individuales
                </h3>
                <p className="text-sm text-slate-500">
                  Estos comentarios no estaban asociados a ningún issue, o elegiste procesarlos de manera individual. Utiliza los filtros a continuación para explorarlos.
                </p>
              </div>
            )}
            {selectedIssue !== "individuales" && (
              <div className="p-4 border-t border-slate-200 bg-white/50 mt-auto">
                <button
                  onClick={() => {
                    setShowComments(!showComments);
                    setCurrentPage(1);
                  }}
                  className="w-full py-2 bg-white text-slate-600 rounded-lg text-sm font-medium border border-slate-200 hover:bg-slate-50 transition shadow-sm"
                >
                  {showComments
                    ? "Ocultar Detalles de Comentarios"
                    : `Ver los ${currentMetrics?.comment_count || issueComments.length} comentarios clasificados`}
                </button>
              </div>
            )}

            {(showComments || selectedIssue === "individuales") && (
              <div ref={commentsListRef} className="flex flex-col">
                <div className="sticky z-20 bg-slate-50/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm flex flex-wrap gap-2 items-center transition-all duration-75" style={{ top: headerHeight ? `${headerHeight}px` : "100px" }}>
                  <span className="text-xs font-bold text-slate-500 uppercase mr-2">Filtros:</span>
                  
                  {(() => {
                    const macrocauseCounts: Record<string, number> = {};
                    let noiseCount = 0;
                    let cleanCount = 0;
                    issueComments.forEach(c => {
                      if (c.is_noise) {
                        noiseCount++;
                      } else {
                        cleanCount++;
                        if (c.macro_cause_code) {
                          macrocauseCounts[c.macro_cause_code] = (macrocauseCounts[c.macro_cause_code] || 0) + 1;
                        }
                      }
                    });
                    
                    const sortedMacrocauses = Object.entries(macrocauseCounts).sort((a, b) => {
                      if (a[0] === "H") return 1;
                      if (b[0] === "H") return -1;
                      return b[1] - a[1];
                    });
                    
                    return (
                      <>
                        <button
                          onClick={() => { setSelectedMacrocauseFilter(null); setCurrentPage(1); }}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                            selectedMacrocauseFilter === null 
                              ? "bg-slate-800 text-white shadow-md" 
                              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          Todos <span className="opacity-70 ml-1">({cleanCount})</span>
                        </button>

                        {sortedMacrocauses.map(([code, count]) => (
                          <button
                            key={code}
                            onClick={() => { setSelectedMacrocauseFilter(code); setCurrentPage(1); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                              selectedMacrocauseFilter === code
                                ? "bg-blue-600 text-white shadow-md border border-blue-600"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            Causa {code} <span className="opacity-70 ml-1">({count})</span>
                          </button>
                        ))}
                        
                        <div className="flex-1 min-w-[20px]"></div>
                        
                        <button
                          onClick={() => { setShowNoise(!showNoise); setCurrentPage(1); }}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${
                            showNoise
                              ? "bg-amber-100 text-amber-800 border-amber-300 shadow-sm"
                              : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100 opacity-80"
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${showNoise ? "bg-amber-500" : "bg-slate-300"}`}></div>
                          Incluir Ruido ({noiseCount})
                        </button>
                      </>
                    );
                  })()}
                </div>

                <div className="flex flex-col gap-8 p-4 mt-2">
                  {(() => {
                    const filteredComments = issueComments.filter(c => {
                      if (!showNoise && c.is_noise) return false;
                      if (selectedMacrocauseFilter && c.macro_cause_code !== selectedMacrocauseFilter) return false;
                      return true;
                    });

                    const totalPages = Math.ceil(filteredComments.length / pageSize) || 1;
                    const paginatedComments = filteredComments.slice(
                      (currentPage - 1) * pageSize,
                      currentPage * pageSize,
                    );

                    const handlePageChange = (newPage: number) => {
                      setCurrentPage(newPage);
                      if (commentsListRef.current) {
                        const y = commentsListRef.current.getBoundingClientRect().top + window.scrollY - (headerHeight + 60);
                        window.scrollTo({ top: y, behavior: "smooth" });
                      }
                    };

                    return (
                      <>
                        {filteredComments.length === 0 ? (
                          <div className="text-center py-10 text-slate-400 bg-white/50 rounded-xl border border-slate-100 font-medium">
                            No hay comentarios que coincidan con estos filtros.
                          </div>
                        ) : (
                          paginatedComments.map((c, i) => (
                            <TextResultCard
                              key={i}
                              result={c}
                              isDashboardMode={true}
                              index={(currentPage - 1) * pageSize + i + 1}
                            />
                          ))
                        )}
                        
                        {totalPages > 1 && (
                          <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 mt-2 shadow-sm">
                            <button
                              disabled={currentPage === 1}
                              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                              className="px-4 py-1.5 bg-slate-50 text-slate-700 text-sm font-medium rounded-lg shadow-sm border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                            >
                              Anterior
                            </button>
                            <span className="text-sm font-semibold text-slate-600">
                              Página {currentPage} de {totalPages}
                            </span>
                            <button
                              disabled={currentPage === totalPages}
                              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                              className="px-4 py-1.5 bg-slate-50 text-slate-700 text-sm font-medium rounded-lg shadow-sm border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                            >
                              Siguiente
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
