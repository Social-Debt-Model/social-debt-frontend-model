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
} from "recharts";
import { useOntology } from "../ontology/useOntology";
import {
  BarChart3,
  AlertTriangle,
  Layers,
  ListFilter,
  Users,
  PieChart,
  ChevronDown,
  Search,
} from "lucide-react";
import { TextResultCard } from "../text-classification/TextResultCard";

import { BatchResultData, MetricsData } from "../batch-classification/actions";

type BatchDashboardProps = {
  resultData: BatchResultData;
};

export const BatchDashboard = ({ resultData }: BatchDashboardProps) => {
  const { comments = [], social_debt_metrics, issues_metrics } = resultData;
  const metrics: Record<string, MetricsData> = (social_debt_metrics ||
    issues_metrics ||
    {}) as Record<string, MetricsData>;
  const issueKeys = Object.keys(metrics);

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

  const filteredIssues = useMemo(() => {
    return issueKeys.filter((key) =>
      key.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [issueKeys, searchQuery]);

  const [prevSelectedIssue, setPrevSelectedIssue] = useState(selectedIssue);
  if (selectedIssue !== prevSelectedIssue) {
    setPrevSelectedIssue(selectedIssue);
    if (currentPage !== 1) setCurrentPage(1);
  }

  const { getMacroCauseDescription } = useOntology();

  const currentMetrics = metrics[selectedIssue] as MetricsData | undefined;

  const chartData = useMemo(() => {
    if (!currentMetrics?.dominant_macrocauses) return [];
    return currentMetrics.dominant_macrocauses.map((item: [string, number]) => {
      const code = item[0];
      return {
        name: code,
        desc: getMacroCauseDescription(code),
        count: item[1],
        color: code === "H" ? "#94a3b8" : "#3b82f6",
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

  const sdiPercent = Math.round((currentMetrics?.social_debt_index || 0) * 100);

  let sdiColor = "text-emerald-500 bg-emerald-50 border-emerald-200";
  if (sdiPercent > 33) sdiColor = "text-amber-500 bg-amber-50 border-amber-200";
  if (sdiPercent > 66) sdiColor = "text-red-500 bg-red-50 border-red-200";

  return (
    <div className="glass-panel flex flex-col rounded-bl-none w-full h-full overflow-hidden border border-white/40 shadow-xl">
      <div className="bg-white/50 p-6 border-b border-white/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Panel de Deuda Social
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Análisis completado para {comments.length} comentarios totales.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasOrphanComments && (
            <button
              onClick={() => setSelectedIssue("individuales")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm border ${
                selectedIssue === "individuales"
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : "bg-white/80 text-slate-700 border-slate-200 hover:bg-white"
              }`}
            >
              Individuales ({orphanComments.length})
            </button>
          )}

          {issueKeys.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`glass-panel px-4 py-2 flex items-center justify-between gap-3 w-auto outline-none text-sm font-medium transition-shadow cursor-pointer ${
                  selectedIssue !== "individuales"
                    ? "border-indigo-300 ring-1 ring-indigo-200 text-indigo-800"
                    : "text-slate-700 hover:shadow-md"
                }`}
              >
                <span className="truncate">
                  {selectedIssue === "individuales"
                    ? "Seleccionar Issue..."
                    : `Issue: ${selectedIssue} (${metrics[selectedIssue]?.comment_count || 0} comentarios)`}
                </span>
                <ChevronDown className="w-4 h-4 flex-shrink-0 text-slate-500" />
              </button>

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  ></div>

                  <div className="absolute top-full right-0 mt-2 w-72 glass-panel p-2 z-50 flex flex-col gap-2 shadow-2xl border border-white/50">
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

      <div className="flex-1 overflow-y-auto">
        {currentMetrics && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col gap-6">
              <div
                className={`p-5 rounded-2xl border flex items-center justify-between shadow-sm ${sdiColor}`}
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">
                    Índice de Deuda Social (SDI)
                  </p>
                  <p className="text-lg font-semibold">
                    {currentMetrics.social_debt_level}
                  </p>
                </div>
                <div className="text-4xl font-black">{sdiPercent}</div>
              </div>

              <div className="bg-white/60 p-4 rounded-2xl shadow-sm border border-white">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Distribución de Macrocausas
                </h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(0,0,0,0.05)" }}
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
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {chartData.map(
                          (entry: { color: string }, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ),
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {currentMetrics.macro_diversity !== undefined && (
                <div className="bg-white/60 p-4 rounded-2xl shadow-sm border border-white">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-emerald-500" /> Métricas
                    de Diversidad
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50/80 p-2 rounded-md border border-slate-100 flex justify-between items-center">
                      <span className="text-xs text-slate-600">
                        Macrocausas
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {currentMetrics.macro_diversity}
                      </span>
                    </div>
                    <div className="bg-slate-50/80 p-2 rounded-md border border-slate-100 flex justify-between items-center">
                      <span className="text-xs text-slate-600">
                        Microcausas
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {currentMetrics.micro_diversity}
                      </span>
                    </div>
                    <div className="bg-slate-50/80 p-2 rounded-md border border-slate-100 flex justify-between items-center">
                      <span className="text-xs text-slate-600">Riesgos</span>
                      <span className="text-sm font-bold text-slate-800">
                        {currentMetrics.risk_diversity}
                      </span>
                    </div>
                    <div className="bg-slate-50/80 p-2 rounded-md border border-slate-100 flex justify-between items-center">
                      <span className="text-xs text-slate-600">Smells</span>
                      <span className="text-sm font-bold text-slate-800">
                        {currentMetrics.smell_diversity}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white/60 p-4 rounded-2xl shadow-sm border border-white flex-1">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" /> Community Smells
                </h3>
                <ul className="space-y-2">
                  {currentMetrics.dominant_community_smells?.map(
                    (s: [string, number], idx: number) => (
                      <li
                        key={idx}
                        className="text-xs bg-slate-50/80 p-2 rounded-md flex justify-between items-center border border-slate-100"
                      >
                        <span className="text-slate-700 pr-2">{s[0]}</span>
                        <span className="font-semibold text-slate-500 bg-white px-2 py-0.5 rounded shadow-sm flex-shrink-0">
                          {s[1]}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-white/60 p-4 rounded-2xl shadow-sm border border-white flex-1">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" /> Riesgos
                </h3>
                <ul className="space-y-2">
                  {currentMetrics.dominant_risks?.map(
                    (r: [string, number], idx: number) => (
                      <li
                        key={idx}
                        className="text-xs bg-slate-50/80 p-2 rounded-md flex justify-between items-center border border-slate-100"
                      >
                        <span className="text-slate-700 pr-2">
                          {r[0].replace(/_/g, " ")}
                        </span>
                        <span className="font-semibold text-slate-500 bg-white px-2 py-0.5 rounded shadow-sm flex-shrink-0">
                          {r[1]}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </div>

              <div className="bg-white/60 p-4 rounded-2xl shadow-sm border border-white flex-1">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <ListFilter className="w-4 h-4 text-indigo-500" /> Microcausas
                </h3>
                <ul className="space-y-2">
                  {currentMetrics.dominant_microcauses?.map(
                    (m: [string, number], idx: number) => (
                      <li
                        key={idx}
                        className="text-xs bg-slate-50/80 p-2 rounded-md flex justify-between items-center border border-slate-100"
                      >
                        <span className="text-slate-700 pr-2" title={m[0]}>
                          {m[0]}
                        </span>
                        <span className="font-semibold text-slate-500 bg-white px-2 py-0.5 rounded shadow-sm flex-shrink-0">
                          {Math.round(m[1])}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {selectedIssue === "individuales" && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-1">
                Comentarios Individuales
              </h3>
              <p className="text-sm text-slate-500">
                Estos comentarios no estaban asociados a ningún issue, o
                elegiste procesarlos de manera individual. No poseen métricas
                grupales.
              </p>
            </div>
            <div className="flex flex-col gap-8 pr-2 pb-2">
              {(() => {
                const totalPages = Math.ceil(orphanComments.length / pageSize);
                const paginatedComments = orphanComments.slice(
                  (currentPage - 1) * pageSize,
                  currentPage * pageSize,
                );

                return (
                  <>
                    {paginatedComments.map((c, i) => (
                      <TextResultCard
                        key={i}
                        result={c}
                        isDashboardMode={true}
                        index={(currentPage - 1) * pageSize + i + 1}
                      />
                    ))}
                    {totalPages > 1 && (
                      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 mt-2 shadow-sm">
                        <button
                          disabled={currentPage === 1}
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          className="px-4 py-1.5 bg-slate-50 text-slate-700 text-sm font-medium rounded-lg shadow-sm border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                        >
                          Anterior
                        </button>
                        <span className="text-sm font-semibold text-slate-600">
                          Página {currentPage} de {totalPages}
                        </span>
                        <button
                          disabled={currentPage === totalPages}
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
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

        {selectedIssue !== "individuales" && (
          <div className="bg-slate-50/50 p-4 border-t border-slate-200 flex-shrink-0">
            <button
              onClick={() => {
                setShowComments(!showComments);
                setCurrentPage(1);
              }}
              className="w-full py-2 bg-white text-slate-600 rounded-lg text-sm font-medium border border-slate-200 hover:bg-slate-50 transition shadow-sm"
            >
              {showComments
                ? "Ocultar Detalles de Comentarios"
                : `Ver los ${currentMetrics?.comment_count} comentarios clasificados`}
            </button>

            {showComments && (
              <div className="flex flex-col gap-8 mt-4 pr-2 pb-2">
                {(() => {
                  const issueComments = comments.filter(
                    (c) =>
                      c.issue_number &&
                      String(c.issue_number) === selectedIssue,
                  );
                  const totalPages = Math.ceil(issueComments.length / pageSize);
                  const paginatedComments = issueComments.slice(
                    (currentPage - 1) * pageSize,
                    currentPage * pageSize,
                  );

                  return (
                    <>
                      {paginatedComments.map((c, i) => (
                        <TextResultCard
                          key={i}
                          result={c}
                          isDashboardMode={true}
                          index={(currentPage - 1) * pageSize + i + 1}
                        />
                      ))}
                      {totalPages > 1 && (
                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 mt-2 shadow-sm">
                          <button
                            disabled={currentPage === 1}
                            onClick={() =>
                              setCurrentPage((p) => Math.max(1, p - 1))
                            }
                            className="px-4 py-1.5 bg-slate-50 text-slate-700 text-sm font-medium rounded-lg shadow-sm border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                          >
                            Anterior
                          </button>
                          <span className="text-sm font-semibold text-slate-600">
                            Página {currentPage} de {totalPages}
                          </span>
                          <button
                            disabled={currentPage === totalPages}
                            onClick={() =>
                              setCurrentPage((p) => Math.min(totalPages, p + 1))
                            }
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};
