"use client";

import React, { useState } from "react";
import { BarChart3, PieChart, Search, Download } from "lucide-react";

import { BatchResultData } from "../social-debt-engine/batch-actions";
import { PrecalculatedEdaData } from "./global-view/edaUtils";
import { GlobalEdaDashboard } from "./global-view/GlobalEdaDashboard";
import { IssueLevelDashboard } from "./issue-view/IssueLevelDashboard";
import { AlgorithmAuditTrail } from "./traceability-view/AlgorithmAuditTrail";

type BatchDashboardProps = {
  resultData: BatchResultData;
  edaStats?: PrecalculatedEdaData;
  filename?: string;
  jobId?: string;
  onDownload?: () => void;
};

export const BatchDashboard = ({
  resultData,
  edaStats,
  filename = "Analysis",
  jobId,
  onDownload,
}: BatchDashboardProps) => {
  const storageKey = jobId || filename;
  const [activeTab, setActiveTab] = useState<"global" | "audit" | "dashboard">(
    () => {
      if (typeof window !== "undefined") {
        const saved = sessionStorage.getItem(
          `batchDashboard_activeTab_${storageKey}`,
        );
        if (saved === "global" || saved === "audit" || saved === "dashboard")
          return saved;
      }
      return "global";
    },
  );

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        `batchDashboard_activeTab_${storageKey}`,
        activeTab,
      );
    }
  }, [activeTab, filename, storageKey]);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const container = document.getElementById("dashboard-scroll-container");
    if (container) {
      container.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [filename]);

  return (
    <div className="glass-panel flex flex-col rounded-bl-none w-full h-full overflow-hidden border border-slate-100/40 shadow-xl">
      <div className="flex flex-col md:flex-row border-b border-slate-200/50 bg-white/40 relative z-30 items-stretch md:items-center justify-between">
        <div className="flex flex-1 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab("global");
              setTimeout(
                () =>
                  document
                    .getElementById("dashboard-scroll-container")
                    ?.scrollTo({ top: 0, behavior: "smooth" }),
                50,
              );
            }}
            className={`flex-1 py-4 flex items-center justify-center gap-2 text-center font-bold text-sm uppercase tracking-wider transition-colors min-w-50 ${activeTab === "global" ? "text-emerald-700 border-b-2 border-emerald-500 bg-emerald-50/50" : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-700"}`}
          >
            <PieChart className="w-4 h-4" /> Global Dashboard
          </button>
          <button
            onClick={() => {
              setActiveTab("dashboard");
              setTimeout(
                () =>
                  document
                    .getElementById("dashboard-scroll-container")
                    ?.scrollTo({ top: 0, behavior: "smooth" }),
                50,
              );
            }}
            className={`flex-1 py-4 flex items-center justify-center gap-2 text-center font-bold text-sm uppercase tracking-wider transition-colors min-w-50 ${activeTab === "dashboard" ? "text-blue-700 border-b-2 border-blue-500 bg-blue-50/50" : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-700"}`}
          >
            <BarChart3 className="w-4 h-4" /> Issue-Level Dashboard
          </button>
          <button
            onClick={() => {
              setActiveTab("audit");
              setTimeout(
                () =>
                  document
                    .getElementById("dashboard-scroll-container")
                    ?.scrollTo({ top: 0, behavior: "smooth" }),
                50,
              );
            }}
            className={`flex-1 py-4 flex items-center justify-center gap-2 text-center font-bold text-sm uppercase tracking-wider transition-colors min-w-50 ${activeTab === "audit" ? "text-indigo-700 border-b-2 border-indigo-500 bg-indigo-50/50" : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-700"}`}
          >
            <Search className="w-4 h-4" /> Traceability
          </button>
        </div>

        {onDownload && (
          <div className="px-4 py-3 md:py-0 flex items-center justify-center border-t md:border-t-0 border-slate-200/50 bg-slate-50/50 md:bg-transparent">
            <button
              onClick={onDownload}
              className="px-5 py-2.5 bg-white text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all w-full md:w-auto whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Download Results
            </button>
          </div>
        )}
      </div>

      <div
        id="dashboard-scroll-container"
        className="flex-1 overflow-y-auto overflow-x-hidden relative"
      >
        {activeTab === "global" && (
          <div className="p-4 md:p-6 w-full max-w-350 mx-auto min-h-125">
            <GlobalEdaDashboard
              resultData={resultData}
              precalculatedStats={edaStats}
            />
          </div>
        )}

        {activeTab === "dashboard" && (
          <IssueLevelDashboard
            resultData={resultData}
            filename={filename}
            jobId={jobId}
          />
        )}

        {activeTab === "audit" && (
          <div className="p-4 md:p-6 w-full max-w-5xl mx-auto">
            <AlgorithmAuditTrail resultData={resultData} filename={filename} />
          </div>
        )}
      </div>
    </div>
  );
};
