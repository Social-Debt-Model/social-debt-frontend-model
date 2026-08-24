"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatLayout } from "@/features/chat-interface/ChatLayout";
import { ChatInput } from "@/features/chat-interface/ChatInput";
import {
  classifyText,
  ClassifyTextResponse,
} from "@/features/text-classification/actions";
import { TextResultCard } from "@/features/text-classification/TextResultCard";
import { BatchProgressCard } from "@/features/batch-classification/BatchProgressCard";
import { BatchDashboard } from "@/features/metrics-dashboard/BatchDashboard";
import { BatchResultSummaryCard } from "@/features/batch-classification/BatchResultSummaryCard";
import { OpenAILimitsBadge } from "@/features/chat-interface/OpenAILimitsBadge";
import { HistorySidebar } from "@/features/chat-interface/HistorySidebar";
import { Loader2 } from "lucide-react";
import {
  getAllHistoryItems,
  saveHistoryItem,
  deleteHistoryItem,
  HistoryItem,
} from "@/lib/historyDB";

type Message = {
  id: number;
  text?: string;
  sender: "user" | "system";
  isFile?: boolean;
  isLoading?: boolean;
  result?: ClassifyTextResponse;
  batchFile?: File;
  batchJobId?: string;
  batchResult?: any;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);

  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [focusedJobId, setFocusedJobId] = useState<string | null>(null);

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

  const loadHistory = async () => {
    const items = await getAllHistoryItems();
    setHistoryItems(items);
  };

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
      text: `Archivo adjuntado: ${file.name}`,
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

  const handleBatchCompleted = async (
    messageId: number,
    jobId: string,
    resultData: any,
  ) => {
    let filename = `Lote ${new Date().toLocaleTimeString()}`;

    setMessages((prev) => {
      const msg = prev.find((m) => m.id === messageId);
      if (msg?.batchFile?.name) {
        filename = msg.batchFile.name;
      }
      return prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, batchJobId: jobId, batchResult: resultData }
          : msg,
      );
    });

    const historyItem: HistoryItem = {
      jobId,
      filename,
      timestamp: Date.now(),
      resultData,
    };
    await saveHistoryItem(historyItem);

    await loadHistory();
    setFocusedJobId(jobId);
  };

  const handleDeleteHistory = async (jobId: string) => {
    await deleteHistoryItem(jobId);
    if (focusedJobId === jobId) {
      setFocusedJobId(null);
    }
    await loadHistory();
  };

  const handleSelectHistory = (jobId: string) => {
    setFocusedJobId(jobId);
  };

  const handleNewChat = () => {
    setFocusedJobId(null);
  };

  const focusedItem = focusedJobId
    ? historyItems.find((i) => i.jobId === focusedJobId)
    : null;

  return (
    <ChatLayout
      isFocusMode={!!focusedItem}
      sidebar={
        <HistorySidebar
          items={historyItems}
          focusedJobId={focusedJobId}
          onSelect={handleSelectHistory}
          onNewChat={handleNewChat}
          onDelete={handleDeleteHistory}
        />
      }
    >
      {!focusedItem && (
        <div className="absolute top-[108px] right-4 z-20">
          <OpenAILimitsBadge />
        </div>
      )}
      {focusedItem ? (
        <div className="w-full h-full pb-4 fade-in">
          <BatchDashboard resultData={focusedItem.resultData} />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <div className="glass-panel p-8 text-center max-w-md mx-auto fade-in">
            <h2 className="text-xl font-semibold text-slate-700 mb-2">
              ¡Bienvenido!
            </h2>
            <p className="text-sm">
              Escribe un comentario para clasificarlo, o usa el ícono del clip
              para subir un archivo CSV/Excel para análisis masivo.
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto w-full space-y-8 fade-in">
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
                <div className="max-w-[80%] w-full">
                  {msg.isLoading ? (
                    <div className="glass-panel p-4 rounded-2xl rounded-bl-none flex items-center gap-3 text-slate-500 w-fit">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm font-medium">
                        Analizando comentario...
                      </span>
                    </div>
                  ) : msg.result ? (
                    <TextResultCard result={msg.result} />
                  ) : msg.batchResult ? (
                    <BatchResultSummaryCard
                      resultData={msg.batchResult}
                      filename={
                        msg.batchFile?.name ||
                        `Lote ${new Date().toLocaleTimeString()}`
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
                  ) : msg.batchFile ? (
                    <BatchProgressCard
                      file={msg.batchFile}
                      onCompleted={(jobId, data) =>
                        handleBatchCompleted(msg.id, jobId, data)
                      }
                    />
                  ) : null}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {!focusedItem && (
        <ChatInput
          onSendMessage={handleSendMessage}
          onSendFile={handleSendFile}
        />
      )}
    </ChatLayout>
  );
}
