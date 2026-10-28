"use client";

import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
  LabelList,
} from "recharts";
import { useOntology } from "../../ontology-catalog/useOntology";
import {
  BarChart3,
  Info,
  AlertTriangle,
  Layers,
  ListFilter,
  Users,
  ChevronDown,
  Search,
  HelpCircle,
  TrendingUp,
  Trophy,
  Target,
  Database,
  ShieldAlert,
  Activity,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";
import { TextResultCard } from "../../social-debt-engine/components/TextResultCard";

import {
  BatchResultData,
  MetricsData,
} from "../../social-debt-engine/batch-actions";
import { flattenAndAggregateMetrics } from "./issueMetricsUtils";

type IssueLevelDashboardProps = {
  resultData: BatchResultData;
  filename?: string;
  jobId?: string;
};

const PIE_PALETTE = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#6366f1",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
];

const MetricBarChart = ({
  data,
  colorClass,
}: {
  data: { name: string; value: number; color?: string }[];
  colorClass: string;
}) => {
  if (data.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-slate-400 text-sm italic">No data detected</p>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={320}
          tick={{ fontSize: 13, fill: "#334155", fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <Tooltip
          wrapperStyle={{ zIndex: 999 }}
          cursor={{ fill: "rgba(0,0,0,0.05)" }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white p-2 rounded shadow border border-slate-100 text-xs z-999">
                  <p className="font-bold text-slate-800 mb-1 max-w-50 whitespace-normal">
                    {payload[0].payload.name}
                  </p>
                  <p className={`${colorClass} font-medium`}>
                    Value: {payload[0].value}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar
          isAnimationActive={false}
          dataKey="value"
          radius={[0, 4, 4, 0]}
          maxBarSize={30}
        >
          <LabelList
            dataKey="value"
            position="right"
            fill="#334155"
            fontSize={15}
            fontWeight={700}
          />
          {data.map((entry: { color?: string }, idx: number) => (
            <Cell key={`cell-${idx}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export const IssueLevelDashboard = ({
  resultData,
  filename = "Analysis",
  jobId,
}: IssueLevelDashboardProps) => {
  const { comments = [], social_debt_metrics, issues_metrics } = resultData;
  const metrics = useMemo<Record<string, MetricsData>>(() => {
    return (social_debt_metrics || issues_metrics || {}) as Record<
      string,
      MetricsData
    >;
  }, [social_debt_metrics, issues_metrics]);
  const issueKeys = Object.keys(metrics);
  const storageKey = jobId || filename;

  const orphanComments = useMemo(() => {
    return comments.filter((c) => !c.issue_number);
  }, [comments]);

  const hasOrphanComments = orphanComments.length > 0;

  const [selectedIssue, setSelectedIssue] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(
        `batchDashboard_selectedIssue_${storageKey}`,
      );
      if (saved) return saved;
    }
    return null;
  });

  React.useEffect(() => {
    if (selectedIssue !== null && typeof window !== "undefined") {
      sessionStorage.setItem(
        `batchDashboard_selectedIssue_${storageKey}`,
        selectedIssue,
      );
    } else if (selectedIssue === null && typeof window !== "undefined") {
      sessionStorage.removeItem(`batchDashboard_selectedIssue_${storageKey}`);
    }
  }, [selectedIssue, filename, storageKey]);

  const [showComments, setShowComments] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSdiModalOpen, setIsSdiModalOpen] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSdiModalOpen(false);
      }
    };
    if (isSdiModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSdiModalOpen]);

  React.useEffect(() => {
    let resetTimer: NodeJS.Timeout;
    if (
      selectedIssue !== null &&
      selectedIssue !== "individuales" &&
      selectedIssue !== "all" &&
      !issueKeys.includes(selectedIssue)
    ) {
      resetTimer = setTimeout(() => {
        setSelectedIssue(null);
        setCurrentPage(1);
      }, 0);
    } else if (
      issueKeys.length === 0 &&
      hasOrphanComments &&
      selectedIssue !== "individuales"
    ) {
      resetTimer = setTimeout(() => {
        setSelectedIssue("individuales");
        setCurrentPage(1);
      }, 0);
    }
    return () => clearTimeout(resetTimer);
  }, [issueKeys, selectedIssue, hasOrphanComments]);

  React.useEffect(() => {
    if (isDropdownOpen && selectedIssue !== "individuales") {
      setTimeout(() => {
        const el = document.getElementById(`issue-item-${selectedIssue}`);
        if (el) {
          el.scrollIntoView({ block: "nearest" });
        }
      }, 50);
    }
  }, [isDropdownOpen, selectedIssue]);
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 10;

  const [showNoise, setShowNoise] = useState(false);
  const [selectedMacrocauseFilter, setSelectedMacrocauseFilter] = useState<
    string | null
  >(null);
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
  }, []);

  const filteredIssues = useMemo(() => {
    return issueKeys
      .filter((key) => key.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        const sdiA = metrics[a]?.social_debt_index || 0;
        const sdiB = metrics[b]?.social_debt_index || 0;
        return sdiB - sdiA;
      });
  }, [issueKeys, searchQuery, metrics]);

  const [prevSelectedIssue, setPrevSelectedIssue] = useState(selectedIssue);
  if (selectedIssue !== prevSelectedIssue) {
    setPrevSelectedIssue(selectedIssue);
    if (currentPage !== 1) setCurrentPage(1);
    setSelectedMacrocauseFilter(null);
  }

  const {
    getMacroCauseDescription,
    getMicroCauseDetails,
    getCommunitySmellDetails,
    getRiskDetails,
    getMicrocauseTypeDetails,
    getMetricDetails,
    getStrategyDetails,
    getEffectDetails,
    getIndicatorDetails,
  } = useOntology();

  const currentMetrics = selectedIssue
    ? (metrics[selectedIssue as string] as MetricsData | undefined)
    : undefined;

  const formatPythonList = (
    strValue: string | undefined,
    getDetailsFn?: (key: string) => { name: string } | null | undefined,
  ) => {
    if (!strValue) return "N/A";
    const cleanStr = strValue.trim();
    if (cleanStr.startsWith("[") && cleanStr.endsWith("]")) {
      const inner = cleanStr.substring(1, cleanStr.length - 1).trim();
      if (!inner) return "N/A";
      return inner
        .split(/,(?=(?:[^'"]*['"'][^'"]*['"'])*[^'"]*$)/)
        .map((s) => {
          const cleaned = s.trim().replace(/^['"']|['"']$/g, "");
          if (getDetailsFn) {
            const detail = getDetailsFn(cleaned);
            return detail?.name || cleaned;
          }
          return cleaned;
        })
        .join(" + ");
    }
    if (getDetailsFn) {
      const detail = getDetailsFn(cleanStr);
      return detail?.name || cleanStr;
    }
    return cleanStr;
  };

  const issueComments = useMemo(() => {
    if (selectedIssue === "individuales") return orphanComments;
    return comments.filter(
      (c) => c.issue_number && String(c.issue_number) === selectedIssue,
    );
  }, [selectedIssue, comments, orphanComments]);

  const funnelStats = useMemo(() => {
    const total = issueComments.length;
    const noise = issueComments.filter((c) => c.is_noise).length;
    const causeH = issueComments.filter(
      (c) => !c.is_noise && c.macro_cause_code === "H",
    ).length;
    const debt = total - noise - causeH;
    return { total, noise, causeH, debt };
  }, [issueComments]);

  const microChartData = useMemo(() => {
    if (!currentMetrics?.dominant_microcauses) return [];
    const flattened = flattenAndAggregateMetrics(
      currentMetrics.dominant_microcauses as [string, number][],
    );
    return flattened
      .slice(0, 3)
      .map((item: [string, number], index: number) => ({
        name: getMicroCauseDetails(item[0])?.name || item[0],
        value: parseFloat(item[1].toFixed(2)),
        color: PIE_PALETTE[(index + 8) % PIE_PALETTE.length],
      }));
  }, [currentMetrics, getMicroCauseDetails]);

  const smellChartData = useMemo(() => {
    if (!currentMetrics?.dominant_community_smells) return [];
    const flattened = flattenAndAggregateMetrics(
      currentMetrics.dominant_community_smells as [string, number][],
    );
    return flattened
      .slice(0, 3)
      .map((item: [string, number], index: number) => ({
        name: getCommunitySmellDetails(item[0])?.name || item[0],
        value: Math.round(item[1]),
        color: PIE_PALETTE[index % PIE_PALETTE.length],
      }));
  }, [currentMetrics, getCommunitySmellDetails]);

  const riskChartData = useMemo(() => {
    if (!currentMetrics?.dominant_risks) return [];
    const flattened = flattenAndAggregateMetrics(
      currentMetrics.dominant_risks as [string, number][],
    );
    return flattened
      .slice(0, 3)
      .map((item: [string, number], index: number) => ({
        name: getRiskDetails(item[0])?.name || item[0],
        value: Math.round(item[1]),
        color: PIE_PALETTE[(index + 3) % PIE_PALETTE.length],
      }));
  }, [currentMetrics, getRiskDetails]);

  const typeChartData = useMemo(() => {
    if (!currentMetrics?.dominant_microcause_types) return [];
    const flattened = flattenAndAggregateMetrics(
      currentMetrics.dominant_microcause_types as [string, number][],
    );
    return flattened
      .slice(0, 3)
      .map((item: [string, number], index: number) => ({
        name: getMicrocauseTypeDetails(item[0])?.name || item[0],
        value: Math.round(item[1]),
        color: PIE_PALETTE[(index + 5) % PIE_PALETTE.length],
      }));
  }, [currentMetrics, getMicrocauseTypeDetails]);

  const aggregateFromComments = React.useCallback(
    (
      key:
        | "metrics"
        | "indicators"
        | "preventive_strategies"
        | "corrective_strategies"
        | "effects",
    ) => {
      const counts: Record<string, number> = {};
      issueComments.forEach((comment) => {
        if (!comment.is_noise && comment.microcauses) {
          comment.microcauses.forEach((mc) => {
            const items = (mc as unknown as Record<string, string[]>)[key];
            if (Array.isArray(items)) {
              items.forEach((item) => {
                counts[item] = (counts[item] || 0) + 1;
              });
            }
          });
        }
      });
      const arr = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      return arr.length > 0 ? arr : null;
    },
    [issueComments],
  );

  const metricsChartData = useMemo(() => {
    const raw =
      currentMetrics?.dominant_metrics ||
      (currentMetrics as Record<string, unknown>)?.metrics ||
      aggregateFromComments("metrics");
    if (!raw) return [];
    const flattened = flattenAndAggregateMetrics(raw as [string, number][]);
    return flattened
      .slice(0, 3)
      .map((item: [string, number], index: number) => ({
        name: getMetricDetails(item[0])?.name || item[0],
        value: Math.round(item[1]),
        color: PIE_PALETTE[(index + 7) % PIE_PALETTE.length],
      }));
  }, [currentMetrics, getMetricDetails, aggregateFromComments]);

  const indicatorChartData = useMemo(() => {
    const raw =
      currentMetrics?.dominant_indicators ||
      (currentMetrics as Record<string, unknown>)?.indicators ||
      aggregateFromComments("indicators");
    if (!raw) return [];
    const flattened = flattenAndAggregateMetrics(raw as [string, number][]);
    return flattened
      .slice(0, 3)
      .map((item: [string, number], index: number) => ({
        name: getIndicatorDetails(item[0])?.name || item[0],
        value: Math.round(item[1]),
        color: PIE_PALETTE[(index + 1) % PIE_PALETTE.length],
      }));
  }, [currentMetrics, getIndicatorDetails, aggregateFromComments]);

  const correctiveChartData = useMemo(() => {
    const raw =
      currentMetrics?.dominant_corrective_strategies ||
      (currentMetrics as Record<string, unknown>)?.corrective_strategies ||
      aggregateFromComments("corrective_strategies");
    if (!raw) return [];
    const flattened = flattenAndAggregateMetrics(raw as [string, number][]);
    return flattened
      .slice(0, 3)
      .map((item: [string, number], index: number) => ({
        name: getStrategyDetails(item[0])?.name || item[0],
        value: Math.round(item[1]),
        color: PIE_PALETTE[(index + 4) % PIE_PALETTE.length],
      }));
  }, [currentMetrics, getStrategyDetails, aggregateFromComments]);

  const effectsChartData = useMemo(() => {
    const raw =
      currentMetrics?.dominant_effects ||
      (currentMetrics as Record<string, unknown>)?.effects ||
      aggregateFromComments("effects");
    if (!raw) return [];
    const flattened = flattenAndAggregateMetrics(raw as [string, number][]);
    return flattened
      .slice(0, 3)
      .map((item: [string, number], index: number) => ({
        name: getEffectDetails(item[0])?.name || item[0],
        value: Math.round(item[1]),
        color: PIE_PALETTE[(index + 6) % PIE_PALETTE.length],
      }));
  }, [currentMetrics, getEffectDetails, aggregateFromComments]);

  const chartData = useMemo(() => {
    if (!currentMetrics?.dominant_macrocauses) return [];
    let colorIndex = 0;
    const flattened = flattenAndAggregateMetrics(
      currentMetrics.dominant_macrocauses as [string, number][],
    );
    return flattened.slice(0, 3).map((item: [string, number]) => {
      const code = item[0];
      const color =
        code === "H" ? "#94a3b8" : PIE_PALETTE[colorIndex % PIE_PALETTE.length];
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
        <h2 className="text-xl font-bold text-slate-800 shrink-0">
          Analysis Results
        </h2>
        <p className="text-sm text-slate-600 shrink-0">
          {comments.length} comments were individually analyzed.
        </p>
        <button
          onClick={() => setShowComments(!showComments)}
          className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg w-fit text-sm font-medium border border-blue-100 hover:bg-blue-100 transition shrink-0"
        >
          {showComments ? "Hide Comments" : "View Comments"}
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
                  Previous
                </button>
                <span className="text-sm font-medium text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className="px-3 py-1 bg-white text-slate-600 text-sm font-medium rounded-lg shadow-sm border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const sdiPercent =
    typeof currentMetrics?.social_debt_index === "number"
      ? Math.round(currentMetrics.social_debt_index * 100)
      : 0;
  const isSingleIssue = issueKeys.length === 1;

  let sdiColor = "text-emerald-500";
  if (isSingleIssue) {
    sdiColor = "text-slate-500";
  } else {
    if (sdiPercent > 33) sdiColor = "text-amber-500";
    if (sdiPercent > 66) sdiColor = "text-red-500";
  }

  return (
    <div className="flex flex-col min-h-full">
      <div
        ref={mainHeaderRef}
        className="bg-white/90 backdrop-blur-md p-3 md:p-4 border-b border-slate-100/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm z-30 sticky top-0"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Analysis Results
          </h2>
          <div className="h-5 w-px bg-slate-300 hidden md:block"></div>
          <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
            <p>
              <span className="font-bold text-slate-700">
                {comments.length}
              </span>{" "}
              comments processed
            </p>
            <div className="h-4 w-px bg-slate-300"></div>
            <p>
              <span className="font-bold text-slate-700">
                {issueKeys.length}
              </span>{" "}
              issues analyzed
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-end w-full md:w-auto gap-4 shrink-0">
          {hasOrphanComments && (
            <div className="relative flex flex-col items-start md:items-end gap-1">
              <button
                onClick={() => setSelectedIssue("individuales")}
                className={`bg-white h-11 w-full md:w-auto px-4 py-2 flex items-center justify-center gap-2 outline-none text-sm font-bold transition-all duration-200 cursor-pointer shadow-sm border rounded-xl ${
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
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`relative bg-white w-full md:w-72 px-5 py-2.5 flex items-center justify-between gap-3 outline-none text-sm font-bold transition-all duration-200 cursor-pointer shadow-sm rounded-xl ${
                  isDropdownOpen
                    ? "border border-blue-500 ring-2 ring-blue-500/20 text-blue-700"
                    : selectedIssue === null
                      ? "border-2 border-amber-400 text-slate-800 bg-amber-50/30"
                      : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {selectedIssue === null && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 shadow-sm"></span>
                  </span>
                )}
                <span className="truncate flex items-center gap-2">
                  {selectedIssue === null
                    ? "Select an issue..."
                    : selectedIssue === "individuales"
                      ? "Global Results"
                      : `Issue: ${selectedIssue} (${metrics[selectedIssue as string]?.comment_count || 0} messages)`}
                </span>
                <ChevronDown className="w-5 h-5 shrink-0 text-indigo-600" />
              </button>

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  ></div>

                  <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl p-2 z-999 flex flex-col gap-2 shadow-2xl border border-slate-100">
                    <div className="relative shrink-0">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search Issue..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/70 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all placeholder:text-slate-400"
                      />
                    </div>

                    <div className="max-h-60 overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
                      {filteredIssues.length === 0 ? (
                        <p className="text-xs text-center text-slate-500 py-3">
                          No issues found.
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
                            id={`issue-item-${key}`}
                            className={`text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                              selectedIssue === key
                                ? "bg-indigo-50 text-indigo-700 font-medium"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            Issue: {key}
                            <span className="block text-xs text-slate-500">
                              {metrics[key].comment_count} comments
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

      <div className="flex-1 flex flex-col w-full relative">
        {selectedIssue === null ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center my-auto min-h-100">
            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-blue-100">
              <BarChart3 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">
              Select an Issue to get started
            </h3>
            <p className="text-slate-500 max-w-md text-base leading-relaxed">
              Choose an issue from the top-right dropdown menu to view its
              metrics, social debt levels, and detailed comments.
            </p>
          </div>
        ) : (
          <>
            {currentMetrics && (
              <div className="flex flex-col w-full">
                <div className="px-4 md:px-6 pt-4">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between relative">
                    <div>
                      <div className="mb-1 flex items-center">
                        <button
                          type="button"
                          onClick={() => setIsSdiModalOpen(true)}
                          className="text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition-colors cursor-pointer text-left"
                          aria-label="Abrir información sobre el Índice de Deuda Social (SDI)"
                        >
                          <span>Social Debt Index (SDI)</span>
                          <Info className="w-4 h-4 text-slate-400 hover:text-blue-600 transition-colors" />
                        </button>
                      </div>
                      <p
                        className={`text-lg font-semibold ${isSingleIssue ? "text-slate-500" : sdiColor}`}
                      >
                        {isSingleIssue
                          ? "Not Calculable"
                          : currentMetrics.social_debt_level}
                      </p>
                    </div>
                    <div
                      className={`text-4xl md:text-5xl font-black ${sdiColor}`}
                    >
                      {isSingleIssue ? "N/A" : sdiPercent}
                      {!isSingleIssue && (
                        <span className="text-lg md:text-xl text-slate-400 font-bold ml-1">
                          /100
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-4 md:px-6 pt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Comments in Issue
                    </span>
                    <span className="text-2xl font-black text-slate-700">
                      {funnelStats.total}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center flex-1">
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                      Noise (Discarded)
                    </span>
                    <span className="text-2xl font-black text-red-500">
                      {funnelStats.noise}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center flex-1">
                    <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider">
                      Cause H (Non-identifiable)
                    </span>
                    <span className="text-2xl font-black text-yellow-500">
                      {funnelStats.causeH}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center flex-1">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                      With Social Debt
                    </span>
                    <span className="text-2xl font-black text-emerald-600">
                      {funnelStats.debt}
                    </span>
                  </div>
                </div>

                {funnelStats.debt === 0 ? (
                  <div className="p-8 md:p-12 mx-4 md:mx-6 mt-4 lg:mt-6 mb-6 flex flex-col items-center justify-center text-center bg-white/60 rounded-2xl border border-slate-200 shadow-sm min-h-62.5">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-slate-200">
                      <Info className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">
                      No Social Debt Detected
                    </h3>
                    <p className="text-slate-500 max-w-md">
                      All comments in this thread were classified as noise or
                      normal conversations (Cause H). No debt metrics or charts
                      were generated for this Issue.
                    </p>
                  </div>
                ) : (
                  <div className="px-4 md:px-6 pt-4 pb-4 md:pb-6 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    <div className="col-span-1 lg:col-span-2 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
                      <h3 className="text-base md:text-lg font-bold text-slate-700 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Trophy className="w-5 h-5 text-amber-500" /> Dominant
                        Issue Characteristics
                      </h3>
                      <div className="flex flex-wrap gap-x-8 gap-y-6">
                        {currentMetrics &&
                          currentMetrics.dominant_macrocauses &&
                          currentMetrics.dominant_macrocauses.length > 0 && (
                            <div className="flex items-start gap-3 flex-1 min-w-62.5">
                              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                                <Target className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">
                                  Primary Macrocause
                                </p>
                                <p className="text-sm text-slate-600 mt-1 leading-snug">
                                  {formatPythonList(
                                    currentMetrics
                                      .dominant_macrocauses[0][0] as string,
                                    (key) => ({
                                      name: getMacroCauseDescription(key),
                                    }),
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                        {currentMetrics &&
                          currentMetrics.dominant_microcauses &&
                          currentMetrics.dominant_microcauses.length > 0 && (
                            <div className="flex items-start gap-3 flex-1 min-w-62.5">
                              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                                <Database className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">
                                  Primary Microcause
                                </p>
                                <p className="text-sm text-slate-600 mt-1 leading-snug">
                                  {formatPythonList(
                                    currentMetrics
                                      .dominant_microcauses[0][0] as string,
                                    getMicroCauseDetails,
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                        {currentMetrics &&
                          currentMetrics.dominant_community_smells &&
                          currentMetrics.dominant_community_smells.length >
                            0 && (
                            <div className="flex items-start gap-3 flex-1 min-w-62.5">
                              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shrink-0">
                                <Users className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">
                                  Community Smell
                                </p>
                                <p className="text-sm text-slate-600 mt-1 leading-snug">
                                  {formatPythonList(
                                    currentMetrics
                                      .dominant_community_smells[0][0] as string,
                                    getCommunitySmellDetails,
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                        {currentMetrics &&
                          currentMetrics.dominant_risks &&
                          currentMetrics.dominant_risks.length > 0 && (
                            <div className="flex items-start gap-3 flex-1 min-w-62.5">
                              <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 shrink-0">
                                <ShieldAlert className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">
                                  Primary Risk
                                </p>
                                <p className="text-sm text-slate-600 mt-1 leading-snug">
                                  {formatPythonList(
                                    currentMetrics
                                      .dominant_risks[0][0] as string,
                                    getRiskDetails,
                                  ).replace(/ [Rr]isk$/i, "")}
                                </p>
                              </div>
                            </div>
                          )}
                        {currentMetrics &&
                          currentMetrics.dominant_effects &&
                          currentMetrics.dominant_effects.length > 0 && (
                            <div className="flex items-start gap-3 flex-1 min-w-62.5">
                              <div className="p-2.5 rounded-xl bg-red-50 text-red-600 shrink-0">
                                <Activity className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">
                                  Most Common Effect
                                </p>
                                <p className="text-sm text-slate-600 mt-1 leading-snug">
                                  {formatPythonList(
                                    currentMetrics
                                      .dominant_effects[0][0] as string,
                                    getEffectDetails,
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                        {currentMetrics &&
                          currentMetrics.dominant_preventive_strategies &&
                          currentMetrics.dominant_preventive_strategies.length >
                            0 && (
                            <div className="flex items-start gap-3 flex-1 min-w-62.5">
                              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                                <ShieldCheck className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">
                                  Preventive Strategy
                                </p>
                                <p className="text-sm text-slate-600 mt-1 leading-snug">
                                  {formatPythonList(
                                    currentMetrics
                                      .dominant_preventive_strategies[0][0] as string,
                                    getStrategyDetails,
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                        {currentMetrics &&
                          currentMetrics.dominant_corrective_strategies &&
                          currentMetrics.dominant_corrective_strategies.length >
                            0 && (
                            <div className="flex items-start gap-3 flex-1 min-w-62.5">
                              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 shrink-0">
                                <Wrench className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">
                                  Corrective Strategy
                                </p>
                                <p className="text-sm text-slate-600 mt-1 leading-snug">
                                  {formatPythonList(
                                    currentMetrics
                                      .dominant_corrective_strategies[0][0] as string,
                                    getStrategyDetails,
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative">
                      <h3 className="text-sm md:text-base font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Layers className="w-4 h-4" /> Distribution of
                        Macrocauses (Top 3)
                      </h3>
                      <div className="w-full">
                        <ResponsiveContainer width="100%" height={320}>
                          <RechartsPieChart
                            margin={{
                              top: 20,
                              right: 30,
                              left: 30,
                              bottom: 20,
                            }}
                          >
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="45%"
                              innerRadius={50}
                              outerRadius={75}
                              paddingAngle={2}
                              dataKey="count"
                              nameKey="label"
                              stroke="none"
                              label={({ value }) => value}
                            >
                              {chartData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              wrapperStyle={{ zIndex: 999 }}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 text-xs">
                                      <p className="font-bold text-slate-800 mb-1">
                                        {payload[0].payload.name}:{" "}
                                        {payload[0].payload.desc}
                                      </p>
                                      <p className="text-blue-600 font-medium">
                                        Frequency: {payload[0].value}
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Legend
                              layout="horizontal"
                              verticalAlign="bottom"
                              align="center"
                              wrapperStyle={{
                                fontSize: "13px",
                                lineHeight: "18px",
                                paddingTop: "10px",
                              }}
                            />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative">
                      <h3 className="text-sm md:text-base font-semibold text-slate-700 mb-2 flex items-center gap-2 group relative">
                        <Layers className="w-4 h-4 text-pink-500" /> Microcause
                        Types (Top 3)
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                        <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-slate-800 text-white text-xs leading-tight rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-999 font-normal normal-case pointer-events-none">
                          Underlying theoretical nature of identified issues.
                          <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800"></div>
                        </div>
                      </h3>
                      <div className="w-full">
                        <ResponsiveContainer width="100%" height={320}>
                          <RechartsPieChart
                            margin={{
                              top: 20,
                              right: 30,
                              left: 30,
                              bottom: 20,
                            }}
                          >
                            <Pie
                              data={typeChartData}
                              cx="50%"
                              cy="45%"
                              innerRadius={50}
                              outerRadius={75}
                              paddingAngle={2}
                              dataKey="value"
                              nameKey="name"
                              stroke="none"
                              label={({ value }) => value}
                            >
                              {typeChartData.map(
                                (entry: { color: string }, index: number) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                  />
                                ),
                              )}
                            </Pie>
                            <Tooltip
                              wrapperStyle={{ zIndex: 999 }}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 text-xs">
                                      <p className="font-bold text-slate-800 mb-1">
                                        {payload[0].payload.name}
                                      </p>
                                      <p className="text-pink-600 font-medium">
                                        Frequency: {payload[0].value}
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Legend
                              layout="horizontal"
                              verticalAlign="bottom"
                              align="center"
                              wrapperStyle={{
                                fontSize: "13px",
                                lineHeight: "18px",
                                paddingTop: "10px",
                              }}
                            />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                      <h3 className="text-sm md:text-base font-semibold text-slate-700 mb-3 flex items-center gap-2 group relative">
                        <ListFilter className="w-4 h-4 text-indigo-500" />{" "}
                        Microcauses (Top 3)
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                        <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-slate-800 text-white text-xs leading-tight rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-999 font-normal normal-case pointer-events-none">
                          List of specific severe social or technical issues
                          identified. The value represents the cumulative AI
                          confidence mass.
                          <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800"></div>
                        </div>
                      </h3>
                      <div className="w-full mt-2 relative h-40">
                        <MetricBarChart
                          data={microChartData}
                          colorClass="text-indigo-600"
                        />
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                      <h3 className="text-sm md:text-base font-semibold text-slate-700 mb-3 flex items-center gap-2 group relative">
                        <Users className="w-4 h-4 text-purple-600" /> Community
                        Smells (Top 3)
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                        <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-slate-800 text-white text-xs leading-tight rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-999 font-normal normal-case pointer-events-none">
                          Patterns of inefficient or toxic behavior in the
                          community.
                          <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800"></div>
                        </div>
                      </h3>
                      <div className="w-full mt-2 relative h-40">
                        <MetricBarChart
                          data={smellChartData}
                          colorClass="text-purple-600"
                        />
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                      <h3 className="text-sm md:text-base font-semibold text-slate-700 mb-3 flex items-center gap-2 group relative">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />{" "}
                        Risks (Top 3)
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                        <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-slate-800 text-white text-xs leading-tight rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-999 font-normal normal-case pointer-events-none">
                          Potential negative consequences if this thread&apos;s
                          social debt remains unresolved.
                          <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800"></div>
                        </div>
                      </h3>
                      <div className="w-full mt-2 relative h-40">
                        <MetricBarChart
                          data={riskChartData}
                          colorClass="text-orange-500"
                        />
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                      <h3 className="text-sm md:text-base font-semibold text-slate-700 mb-3 flex items-center gap-2 group relative">
                        <TrendingUp className="w-4 h-4 text-indigo-500" />{" "}
                        Indicators (Top 3)
                      </h3>
                      <div className="w-full mt-2 relative h-40">
                        <MetricBarChart
                          data={indicatorChartData}
                          colorClass="text-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                      <h3 className="text-sm md:text-base font-semibold text-slate-700 mb-3 flex items-center gap-2 group relative">
                        <Layers className="w-4 h-4 text-blue-600" /> Corrective
                        Strategies (Top 3)
                      </h3>
                      <div className="w-full mt-2 relative h-40">
                        <MetricBarChart
                          data={correctiveChartData}
                          colorClass="text-blue-600"
                        />
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                      <h3 className="text-sm md:text-base font-semibold text-slate-700 mb-3 flex items-center gap-2 group relative">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />{" "}
                        Effects (Top 3)
                      </h3>
                      <div className="w-full mt-2 relative h-40">
                        <MetricBarChart
                          data={effectsChartData}
                          colorClass="text-orange-600"
                        />
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                      <h3 className="text-sm md:text-base font-semibold text-slate-700 mb-3 flex items-center gap-2 group relative">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />{" "}
                        Metrics (Top 3)
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                        <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-slate-800 text-white text-xs leading-tight rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-999 font-normal normal-case pointer-events-none">
                          Relevant software metrics linked to the identified
                          issues.
                          <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800"></div>
                        </div>
                      </h3>
                      <div className="w-full mt-2 relative h-40">
                        <MetricBarChart
                          data={metricsChartData}
                          colorClass="text-emerald-600"
                        />
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                      <h3 className="text-sm md:text-base font-semibold text-slate-700 mb-3 flex items-center gap-2 group relative">
                        <TrendingUp className="w-4 h-4 text-indigo-500" />{" "}
                        Indicators (Top 3)
                      </h3>
                      <div className="w-full mt-2 relative h-40">
                        <MetricBarChart
                          data={indicatorChartData}
                          colorClass="text-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {true && (
              <div className="bg-slate-50/50 shrink-0 flex-1">
                {selectedIssue === "individuales" && (
                  <div className="px-4 md:px-6 pt-6 pb-2">
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">
                      Individual Comments
                    </h3>
                    <p className="text-sm text-slate-500">
                      These comments were not associated with any issue, or were
                      chosen to be processed individually. Use the filters below
                      to explore them.
                    </p>
                  </div>
                )}

                {true && (
                  <div
                    ref={commentsListRef}
                    className="flex flex-col mt-6 border-t border-slate-200 pt-6 scroll-mt-32"
                  >
                    <div
                      className="sticky z-20 bg-slate-50/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm flex flex-wrap gap-2 items-center transition-all duration-75"
                      style={{
                        top: headerHeight ? `${headerHeight}px` : "100px",
                      }}
                    >
                      <span className="text-xs font-bold text-slate-500 uppercase mr-2">
                        Filters:
                      </span>

                      {(() => {
                        const MACROCAUSES = [
                          "A",
                          "B",
                          "C",
                          "D",
                          "E",
                          "F",
                          "G",
                          "H",
                        ];
                        const macrocauseCounts: Record<string, number> = {};
                        let noiseCount = 0;
                        let cleanCount = 0;

                        issueComments.forEach((c) => {
                          if (c.is_noise) {
                            noiseCount++;
                          } else {
                            cleanCount++;
                            if (c.macro_cause_code) {
                              macrocauseCounts[c.macro_cause_code] =
                                (macrocauseCounts[c.macro_cause_code] || 0) + 1;
                            }
                          }
                        });

                        return (
                          <>
                            <button
                              onClick={() => {
                                setSelectedMacrocauseFilter(null);
                                setCurrentPage(1);
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                selectedMacrocauseFilter === null
                                  ? "bg-slate-800 text-white shadow-md"
                                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              All{" "}
                              <span className="opacity-70 ml-1">
                                ({cleanCount})
                              </span>
                            </button>

                            {MACROCAUSES.map((code) => {
                              const count = macrocauseCounts[code] || 0;
                              const isDisabled = count === 0;
                              const isH = code === "H";

                              return (
                                <React.Fragment key={code}>
                                  {isH && (
                                    <div className="w-px h-6 bg-slate-300 mx-1 hidden sm:block"></div>
                                  )}
                                  <button
                                    disabled={isDisabled}
                                    onClick={() => {
                                      setSelectedMacrocauseFilter(code);
                                      setCurrentPage(1);
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                      isDisabled
                                        ? "opacity-50 cursor-not-allowed bg-slate-50 text-slate-400 border border-slate-200"
                                        : selectedMacrocauseFilter === code
                                          ? "bg-blue-600 text-white shadow-md border border-blue-600"
                                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                    }`}
                                  >
                                    Cause {code}{" "}
                                    <span className="opacity-70 ml-1">
                                      ({count})
                                    </span>
                                  </button>
                                </React.Fragment>
                              );
                            })}

                            <div className="flex-1 min-w-5"></div>

                            <button
                              disabled={noiseCount === 0}
                              onClick={() => {
                                setShowNoise(!showNoise);
                                setCurrentPage(1);
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${
                                noiseCount === 0
                                  ? "opacity-50 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200"
                                  : showNoise
                                    ? "bg-amber-100 text-amber-800 border-amber-300 shadow-sm"
                                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100 opacity-80"
                              }`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${showNoise ? "bg-amber-500" : "bg-slate-300"}`}
                              ></div>
                              Include Noise ({noiseCount})
                            </button>
                          </>
                        );
                      })()}
                    </div>

                    <div className="flex flex-col gap-8 p-4 mt-2">
                      {(() => {
                        const filteredComments = issueComments.filter((c) => {
                          if (!showNoise && c.is_noise) return false;
                          if (
                            selectedMacrocauseFilter &&
                            c.macro_cause_code !== selectedMacrocauseFilter
                          )
                            return false;
                          return true;
                        });

                        const totalPages =
                          Math.ceil(filteredComments.length / pageSize) || 1;
                        const paginatedComments = filteredComments.slice(
                          (currentPage - 1) * pageSize,
                          currentPage * pageSize,
                        );

                        const handlePageChange = (newPage: number) => {
                          setCurrentPage(newPage);
                          setTimeout(() => {
                            if (commentsListRef.current) {
                              commentsListRef.current.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                            }
                          }, 100);
                        };

                        return (
                          <>
                            {filteredComments.length === 0 ? (
                              <div className="text-center py-10 text-slate-400 bg-white/50 rounded-xl border border-slate-100 font-medium">
                                No comments match these filters.
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
                                  onClick={() =>
                                    handlePageChange(
                                      Math.max(1, currentPage - 1),
                                    )
                                  }
                                  className="px-4 py-1.5 bg-slate-50 text-slate-700 text-sm font-medium rounded-lg shadow-sm border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                                >
                                  Previous
                                </button>
                                <span className="text-sm font-semibold text-slate-600">
                                  Page {currentPage} of {totalPages}
                                </span>
                                <button
                                  disabled={currentPage === totalPages}
                                  onClick={() =>
                                    handlePageChange(
                                      Math.min(totalPages, currentPage + 1),
                                    )
                                  }
                                  className="px-4 py-1.5 bg-slate-50 text-slate-700 text-sm font-medium rounded-lg shadow-sm border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                                >
                                  Next
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
          </>
        )}
        {isSdiModalOpen &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
              onClick={() => setIsSdiModalOpen(false)}
            >
              <div
                className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full p-5 md:p-6 max-h-[90vh] flex flex-col relative my-auto overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header - Fijo */}
                <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-xs border border-blue-100">
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-slate-900">
                        Índice de Deuda Social (SDI)
                      </h3>
                      <p className="text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-wider">
                        Marco de Cálculo y Clasificación
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSdiModalOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Cerrar modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body - Con scroll interno si la pantalla es reducida */}
                <div className="space-y-4 text-slate-700 leading-relaxed overflow-y-auto pr-1">
                  {/* ¿Qué es? */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 text-base md:text-lg mb-1.5">
                      ¿Qué es el Índice de Deuda Social (SDI)?
                    </h4>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                      Es un indicador que permite estimar el nivel de deuda social presente en un hilo de discusión de GitHub, a partir de las problemáticas sociotécnicas identificadas.
                    </p>
                  </div>

                  {/* ¿Cómo se calcula? */}
                  <div>
                    <h4 className="font-bold text-slate-900 text-base md:text-lg mb-1.5">
                      ¿Cómo se calcula?
                    </h4>
                    <p className="text-slate-700 text-sm md:text-base mb-3 leading-relaxed">
                      El SDI se obtiene mediante el promedio de seis dimensiones: cantidad de comentarios, diversidad de macrocausas, frecuencia de la macrocausa predominante, puntuación de microcausas, frecuencia de olores comunitarios y frecuencia de riesgos. Estas dimensiones se normalizan en una escala de 0 a 1.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs md:text-sm">
                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                          1
                        </span>
                        <span>Cantidad de comentarios</span>
                      </div>
                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs md:text-sm">
                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                          2
                        </span>
                        <span>Diversidad de macrocausas</span>
                      </div>
                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs md:text-sm">
                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                          3
                        </span>
                        <span>Frecuencia predominante</span>
                      </div>
                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs md:text-sm">
                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                          4
                        </span>
                        <span>Puntuación microcausas</span>
                      </div>
                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs md:text-sm">
                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                          5
                        </span>
                        <span>Olores comunitarios</span>
                      </div>
                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs md:text-sm">
                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                          6
                        </span>
                        <span>Frecuencia de riesgos</span>
                      </div>
                    </div>
                  </div>

                  {/* Niveles de deuda social */}
                  <div>
                    <h4 className="font-bold text-slate-900 text-base md:text-lg mb-2">
                      Niveles de deuda social:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex-1 py-3 px-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center text-center gap-1.5 min-h-20 shadow-xs">
                        <span className="text-sm font-bold uppercase tracking-wider text-emerald-800">
                          Baja
                        </span>
                        <span className="font-mono text-xs md:text-sm font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 shadow-xs whitespace-nowrap">
                          SDI ≤ 0,200174
                        </span>
                      </div>
                      <div className="flex-1 py-3 px-3 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center text-center gap-1.5 min-h-20 shadow-xs">
                        <span className="text-sm font-bold uppercase tracking-wider text-amber-800">
                          Media
                        </span>
                        <span className="font-mono text-xs md:text-sm font-bold text-amber-800 bg-white px-2.5 py-1 rounded-lg border border-amber-300 shadow-xs whitespace-nowrap">
                          0,200174 &lt; SDI ≤ 0,292189
                        </span>
                      </div>
                      <div className="flex-1 py-3 px-3 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col items-center justify-center text-center gap-1.5 min-h-20 shadow-xs">
                        <span className="text-sm font-bold uppercase tracking-wider text-rose-800">
                          Alta
                        </span>
                        <span className="font-mono text-xs md:text-sm font-bold text-rose-800 bg-white px-2.5 py-1 rounded-lg border border-rose-300 shadow-xs whitespace-nowrap">
                          SDI &gt; 0,292189
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nota aclaratoria */}
                  <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 flex items-start gap-2.5">
                    <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
                      Estos límites se establecieron mediante terciles estadísticos del conjunto de datos de referencia. Un valor más alto indica mayor acumulación relativa de deuda social en el hilo analizado.
                    </p>
                  </div>
                </div>

                {/* Footer - Fijo */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsSdiModalOpen(false)}
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm md:text-base font-semibold rounded-xl shadow transition cursor-pointer"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    </div>
  );
};
