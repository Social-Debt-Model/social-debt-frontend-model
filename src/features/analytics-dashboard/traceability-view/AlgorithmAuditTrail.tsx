import React, { useMemo } from "react";
import ontology_dictionary from "../../ontology-catalog/frontend_ontology_dictionary.json";
import { Download, Info } from "lucide-react";
import { BatchResultData, MetricsData } from "../../social-debt-engine/batch-actions";
import { downloadFinalExcel, downloadStepExcel } from "./excelExportService";

export { downloadFinalExcel };

export const AlgorithmAuditTrail = ({
  resultData,
  filename,
}: {
  resultData: BatchResultData;
  filename: string;
}) => {
  const stats = useMemo(() => {
    const {
      comments = [],
      issues_metrics = {},
      social_debt_metrics,
    } = resultData;
    const metrics = (social_debt_metrics || issues_metrics || {}) as Record<
      string,
      MetricsData
    >;

    const totalComments = comments.length;
    
    const noiseLevels: Record<string, number> = { "Hard noise": 0, "Soft noise": 0, "Useful": 0 };
    comments.forEach(c => {
      const level = (c.noise_level || "").toLowerCase();
      if (level.includes("hard")) noiseLevels["Hard noise"]++;
      else if (level.includes("soft")) noiseLevels["Soft noise"]++;
      else noiseLevels["Useful"]++;
    });

    const macroDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0 };
    comments.forEach((c) => {
      if (c.macro_cause_code && c.macro_cause_code !== "none") {
        const m = c.macro_cause_code.toUpperCase();
        if (macroDistribution[m] !== undefined) {
          macroDistribution[m]++;
        }
      }
    });
    const distStr = Object.entries(macroDistribution)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([macro, count]) => `${macro}: ${count}`)
      .join(" | ") || "None";

    let maxSdiValue = -1;
    let minSdiValue = Infinity;

    Object.values(metrics).forEach((m) => {
      if (typeof m.social_debt_index === "number") {
        if (m.social_debt_index > maxSdiValue) {
          maxSdiValue = m.social_debt_index;
        }
        if (m.social_debt_index < minSdiValue) {
          minSdiValue = m.social_debt_index;
        }
      }
    });
    
    const maxSdiDisplay = maxSdiValue >= 0 ? maxSdiValue.toFixed(2) : "N/A";
    const minSdiDisplay = minSdiValue !== Infinity ? minSdiValue.toFixed(2) : "N/A";
    const discardedNoise = comments.filter((c) => c.is_noise).length;
    const cleanComments = totalComments - discardedNoise;

    const normalConversations = comments.filter(
      (c) => !c.is_noise && c.macro_cause_code === "H",
    ).length;
    const debtComments = comments.filter(
      (c) => !c.is_noise && c.macro_cause_code && c.macro_cause_code !== "H",
    ).length;

    const totalMicrocauses = comments.reduce(
      (acc, c) => acc + (c.microcauses?.length || 0),
      0,
    );

    const typeCounts: Record<string, number> = {};
    comments.forEach((c) => {
      c.microcauses?.forEach((mc) => {
        if (mc.cause_type) {
          typeCounts[mc.cause_type] = (typeCounts[mc.cause_type] || 0) + 1;
        }
      });
    });
    const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
    const topTypes =
      sortedTypes
        .slice(0, 1)
        .map((t) => {
          const dict = (ontology_dictionary as unknown as Record<string, Record<string, { name: string }>>).microcause_types;
          return dict && dict[t[0]] ? dict[t[0]].name : t[0].replace("Cause", "");
        })
        .join(", ") || "Ninguno";

    const totalIssues = Object.keys(metrics).length;
    let totalSdi = 0;
    let sdiCount = 0;
    Object.values(metrics).forEach((m) => {
      if (typeof m.social_debt_index === "number") {
        totalSdi += m.social_debt_index;
        sdiCount++;
      }
    });
    let avgSdi: React.ReactNode = "0";
    if (totalIssues === 1) {
      avgSdi = (
        <span className="flex items-center gap-1.5 group relative cursor-help">
          N/A
          <Info className="w-4 h-4 text-slate-400" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-slate-800 text-white text-[11px] leading-tight rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50 font-normal normal-case pointer-events-none text-center">
            SDI requires at least 2 Issues to compare.
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
          </div>
        </span>
      );
    } else {
      avgSdi = sdiCount > 0 ? (totalSdi / sdiCount).toFixed(2) : "0";
    }

    return {
      totalComments,
      discardedNoise,
      cleanComments,
      normalConversations,
      debtComments,
      totalMicrocauses,
      topTypes,
      totalIssues,
      avgSdi,
      noiseLevels,
      distStr,
      
      maxSdiDisplay,
      minSdiDisplay
    };
  }, [resultData]);

  const STEPS = [
    {
      title: "Step 1: Raw Text Cleaning",
      description:
        "In this initial stage, the raw comment text is processed to remove elements that do not provide semantic value, such as code blocks, images, URLs, signatures, and Markdown artifacts. The goal is to isolate and extract clean plain text for subsequent analysis phases.",
      exportKey: "step1_b64",
      stats: [
        { label: "Processed comments", value: stats.totalComments },
      ],
    },
    {
      title: "Step 2: Operational Noise Filter (Classifier)",
      description:
        "The clean text is evaluated to filter and discard operational noise. Comments generated by bots, automated CI/CD workflows, or routine human interactions (e.g., 'LGTM', 'thanks') that lack social debt context are filtered out, preserving only useful comments.",
      exportKey: "step2_b64",
      stats: [
        { label: "Hard noise (Absolute noise)", value: stats.noiseLevels["Hard noise"] },
        { label: "Soft noise (Mild noise)", value: stats.noiseLevels["Soft noise"] },
        { label: "Useful (Actionable for analysis)", value: stats.noiseLevels["Useful"] },
      ],
    },
    {
      title: "Step 3: Macrocause Classification (LLM)",
      description:
        "Actionable comments are analyzed by a Large Language Model (LLM) that evaluates conversation semantics. Each comment is classified to determine if it belongs to one of the 7 social debt macrocauses (A-G) or represents normal/non-identifiable conversation (Cause H).",
      exportKey: "step3_b64",
      stats: [
        {
          label: "Evaluated comments",
          value: stats.normalConversations + stats.debtComments,
        },
        {
          label: "Non-identifiable (Macrocause H)",
          value: stats.normalConversations,
        },
        {
          label: "Social Debt (Causes A-G)",
          value: stats.debtComments,
        },
      ],
    },
    {
      title: "Step 4: Microcause Matching (NLP)",
      description:
        "Comments flagged with social debt (A-G) are processed using a Natural Language Processing (NLP) model powered by vector embeddings. Semantic similarity is computed to map and extract specific microcauses from the ontology, providing deep analytical granularity.",
      exportKey: "step4_b64",
      stats: [
        {
          label: "Identified microcauses",
          value: stats.totalMicrocauses,
        },
        {
          label: "Most frequent microcause type",
          value: stats.topTypes,
        },
      ],
    },
    {
      title: "Step 5: Aggregation and SDI Calculation",
      description:
        "Individual comment findings are aggregated and grouped by discussion thread (Issue). The Social Debt Index (SDI) is computed using an algorithm that factors in both criticality and cause diversity, delivering a quantitative metric of technical and social debt per Issue.",
      exportKey: "final_excel_b64",
      stats: [
        {
          label: "Issues (Threads)",
          value: stats.totalIssues,
        },
        {
          label: "Max SDI",
          value: stats.maxSdiDisplay,
        },
        {
          label: "Min SDI",
          value: stats.minSdiDisplay,
        },
      ],
    },
  ];

  const handleDownload = async (stepIndex: number) => {
    await downloadStepExcel(stepIndex, resultData, filename);
  };

  return (
    <div className="flex flex-col py-2">
      <div className="mb-8 relative z-10">
        <h2 className="text-2xl font-bold text-slate-800">
          Algorithm Traceability
        </h2>
        <p className="text-slate-500 mt-1">
          Detailed step-by-step processing description.
        </p>
      </div>

      <div className="relative flex flex-col gap-8">
        <div className="absolute left-6 top-6 bottom-6 w-1 -ml-0.5 bg-indigo-100 rounded-full hidden md:block z-0"></div>

        {STEPS.map((step, index) => (
          <div
            key={index}
            className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-start md:pl-16"
          >
            <div className="hidden md:flex absolute left-6 top-10 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-indigo-100 border-4 border-white shadow-sm items-center justify-center z-20">
              <span className="text-indigo-600 font-bold">{index + 1}</span>
            </div>

            <div className="flex-1 w-full bg-white/80 backdrop-blur-md p-5 md:p-6 rounded-2xl border border-indigo-100 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex md:hidden items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm">
                    {index + 1}
                  </span>
                  <h4 className="font-bold text-indigo-900 text-lg">
                    {step.title}
                  </h4>
                </div>

                <button
                  onClick={() => handleDownload(index)}
                  className="px-5 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors w-full md:w-auto whitespace-nowrap text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download Step {index + 1}
                </button>
              </div>

              <p className="text-sm text-indigo-900/70 mb-1 leading-relaxed max-w-full xl:max-w-4xl">
                {step.description}
              </p>

              <div
                className={`grid gap-3 w-full ${step.stats.length === 1 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : step.stats.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}
              >
                {step.stats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="relative overflow-hidden bg-white p-3 rounded-lg border border-slate-200/60 shadow-sm flex flex-col gap-0.5 hover:border-indigo-100 hover:shadow-md transition-shadow duration-300 group"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-50/50 to-transparent rounded-bl-full opacity-50 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="absolute bottom-0 left-0 w-1 h-full bg-indigo-300 rounded-l-lg"></div>
                    
                    <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider pl-2 relative z-10">
                      {stat.label}
                    </span>
                    <span
                      className="text-lg font-bold text-slate-700 pl-2 relative z-10"
                      title={
                        typeof stat.value === "string" ||
                        typeof stat.value === "number"
                          ? stat.value.toString()
                          : undefined
                      }
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
