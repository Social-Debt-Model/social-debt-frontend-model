"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatLayout } from "@/shared/ChatLayout";
import { ChatInput } from "@/shared/ChatInput";
import {
  classifyText,
  ClassifyTextResponse,
} from "@/features/social-debt-engine/text-actions";
import { TextResultCard } from "@/features/social-debt-engine/components/TextResultCard";
import { BatchProgressCard } from "@/features/social-debt-engine/components/BatchProgressCard";
import { BatchResultData } from "@/features/social-debt-engine/batch-actions";
import { BatchDashboard } from "@/features/analytics-dashboard/BatchDashboard";
import { precalculateEdaStats } from "@/features/analytics-dashboard/global-view/edaUtils";
import { downloadFinalExcel } from "@/features/analytics-dashboard/traceability-view/excelExportService";

import { BatchResultSummaryCard } from "@/features/social-debt-engine/components/BatchResultSummaryCard";
import { OpenAILimitsBadge } from "@/features/social-debt-engine/components/OpenAILimitsBadge";
import { HistorySidebar } from "@/features/history/HistorySidebar";
import { Loader2 } from "lucide-react";
import {
  getAllHistoryItems,
  saveHistoryItem,
  deleteHistoryItem,
  HistoryItem,
  getPendingJobs,
  getHistoryItem,
} from "@/features/history/historyDB";

type Message = {
  id: number;
  text?: string;
  sender: "user" | "system";
  isDashboard?: boolean;
  isFile?: boolean;
  isLoading?: boolean;
  result?: ClassifyTextResponse;
  batchFile?: File;
  batchJobId?: string;
  batchResult?: BatchResultData;
  batchError?: boolean;
  batchCancelled?: boolean;
  batchFileName?: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);

  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [focusedJobId, setFocusedJobId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleDownload = (item: HistoryItem) => {
    downloadFinalExcel(item.resultData, item.filename);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusedJobId) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, [messages, focusedJobId]);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const items = await getAllHistoryItems();
    setHistoryItems(items);

    const pendingJobs = await getPendingJobs();
    if (pendingJobs.length > 0) {
      const pending = pendingJobs[0];

      setMessages((prev) => {
        const exists = prev.some((m) => m.batchJobId === pending.jobId);
        if (exists) return prev;

        const systemMsg: Message = {
          id: Date.now(),
          sender: "system",
          batchJobId: pending.jobId,
          batchFileName: pending.filename,
        };
        return [...prev, systemMsg];
      });
    }
  }

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = { id: Date.now(), text, sender: "user" };
    const loadingId = Date.now() + 1;
    const loadingMsg: Message = {
      id: loadingId,
      sender: "system",
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    const response = await classifyText(text);

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === loadingId
          ? { id: loadingId, sender: "system", result: response }
          : msg,
      ),
    );
  };

  const handleSendFile = (file: File) => {
    const userMsg: Message = {
      id: Date.now(),
      text: `Attached file: ${file.name}`,
      sender: "user",
      isFile: true,
    };
    const batchId = Date.now() + 1;
    const batchMsg: Message = {
      id: batchId,
      sender: "system",
      batchFile: file,
    };

    setMessages((prev) => [...prev, userMsg, batchMsg]);
  };

  const handleBatchError = (msgId: number) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId ? { ...msg, batchError: true } : msg,
      ),
    );
  };

  const handleBatchCancelled = (msgId: number) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId ? { ...msg, batchCancelled: true } : msg,
      ),
    );
  };

  const handleBatchCompleted = async (
    messageId: number,
    jobId: string,
    resultData: BatchResultData,
  ) => {
    const msg = messages.find((m) => m.id === messageId);
    const filename =
      msg?.batchFile?.name ||
      msg?.batchFileName ||
      `Batch ${new Date().toLocaleTimeString()}`;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, batchJobId: jobId, batchResult: resultData }
          : m,
      ),
    );

    const timestamp = new Date().getTime();
    
    console.log("[EDA] Precalculating dashboard stats...");
    const edaStats = precalculateEdaStats(resultData);
    
    const historyItem: HistoryItem = {
      jobId,
      filename,
      timestamp,
      resultData,
      edaStats,
    };
    await saveHistoryItem(historyItem);

    await loadHistory();

    setFocusedJobId((currentFocused) => {
      if (currentFocused === null) {
        return jobId;
      }
      return currentFocused;
    });
  };

  const handleDeleteHistory = async (jobId: string) => {
    try {
      const itemToDelete = await getHistoryItem(jobId);
      if (itemToDelete && itemToDelete.filename && typeof window !== "undefined") {
        const storageKey = itemToDelete.jobId || itemToDelete.filename;
        sessionStorage.removeItem(`batchDashboard_selectedIssue_${storageKey}`);
        sessionStorage.removeItem(`batchDashboard_activeTab_${storageKey}`);
      }
    } catch(err) {
      console.error("Error clearing session storage on delete", err);
    }

    await deleteHistoryItem(jobId);
    if (focusedJobId === jobId) {
      setFocusedJobId(null);
    }
    await loadHistory();
  };

  const handleSelectHistory = (jobId: string) => {
    setFocusedJobId(jobId);
    setIsMobileSidebarOpen(false);
  };

  const handleNewChat = () => {
    setFocusedJobId(null);
    setIsMobileSidebarOpen(false);
  };

  const focusedItem = focusedJobId
    ? historyItems.find((i) => i.jobId === focusedJobId)
    : null;

  const isChatDisabled = messages.some(
    (msg) =>
      (msg.batchFile || msg.batchJobId) &&
      !msg.batchResult &&
      !msg.batchError &&
      !msg.batchCancelled &&
      !historyItems.some((h) => h.jobId === msg.batchJobId),
  );

  return (
    <ChatLayout
      isFocusMode={!!focusedItem}
      isSidebarOpen={isMobileSidebarOpen}
      onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      sidebar={
        <HistorySidebar
          items={historyItems}
          focusedJobId={focusedJobId}
          onSelect={handleSelectHistory}
          onNewChat={handleNewChat}
          onDelete={handleDeleteHistory}
          onClose={() => setIsMobileSidebarOpen(false)}
          onDownload={handleDownload}
        />
      }
      headerAction={!focusedItem && <OpenAILimitsBadge />}
      footer={
        !focusedItem && (
          <ChatInput
            onSendMessage={handleSendMessage}
            onSendFile={handleSendFile}
            isChatDisabled={isChatDisabled}
          />
        )
      }
    >
      <div className="hidden 2xl:block absolute top-[108px] right-4 z-50">
        {!focusedItem && <OpenAILimitsBadge />}
      </div>
      {focusedItem ? (
        <div className="w-full h-full pb-0 md:pb-2 fade-in">
          <BatchDashboard
            resultData={focusedItem.resultData}
            edaStats={focusedItem.edaStats}
            filename={focusedItem.filename}
            jobId={focusedItem.jobId}
            onDownload={() => handleDownload(focusedItem)}
          />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <div className="glass-panel p-8 text-center max-w-md mx-auto fade-in">
            <h2 className="text-xl font-semibold text-slate-700 mb-2">
              ¡Welcome!
            </h2>
            <p className="text-sm hidden md:block">
              Type a comment to classify it, or use the paperclip icon
              to upload a CSV/Excel file for batch analysis.
            </p>
            <p className="text-sm md:hidden text-slate-500">
              Type a comment or code snippet to classify social debt and uncover its root causes or risks.
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto w-full space-y-8 fade-in">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "user" && (
                <div className="p-4 bg-slate-800/80 backdrop-blur-md border border-slate-700/50 text-white rounded-2xl rounded-br-none shadow-md max-w-[80%]">
                  {msg.text}
                </div>
              )}

              {msg.sender === "system" && (
                <div className="max-w-[95%] lg:max-w-[90%] w-full">
                  {msg.isLoading ? (
                    <div className="glass-panel p-4 rounded-2xl rounded-bl-none flex items-center gap-3 text-slate-500 w-fit">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm font-medium">
                        Analyzing comment...
                      </span>
                    </div>
                  ) : msg.result ? (
                    <TextResultCard result={msg.result} />
                  ) : (msg.batchResult || (msg.batchJobId && historyItems.some((h) => h.jobId === msg.batchJobId))) ? (
                    <BatchResultSummaryCard
                      resultData={
                        msg.batchResult ||
                        (historyItems.find((h) => h.jobId === msg.batchJobId)
                          ?.resultData as BatchResultData)
                      }
                      filename={
                        msg.batchFile?.name ||
                        `Batch ${new Date().toLocaleTimeString()}`
                      }
                      isDeleted={
                        !historyItems.some(
                          (item) => item.jobId === msg.batchJobId,
                        )
                      }
                      onViewDashboard={() =>
                        msg.batchJobId && handleSelectHistory(msg.batchJobId)
                      }
                    />
                  ) : msg.batchFile || (msg.batchJobId && !msg.batchResult) ? (
                    <BatchProgressCard
                      file={msg.batchFile}
                      resumeJobId={msg.batchJobId}
                      resumeFilename={msg.batchFileName}
                      isCancelled={msg.batchCancelled}
                      isError={msg.batchError}
                      onJobStarted={(jobId) => {
                        setMessages((prev) =>
                          prev.map((m) =>
                            m.id === msg.id ? { ...m, batchJobId: jobId } : m,
                          ),
                        );
                      }}
                      onCompleted={(jobId, data) =>
                        handleBatchCompleted(msg.id, jobId, data)
                      }
                      onCancelled={() => {
                        handleBatchCancelled(msg.id);
                      }}
                      onError={() => {
                        handleBatchError(msg.id);
                      }}
                    />
                  ) : null}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </ChatLayout>
  );
}
