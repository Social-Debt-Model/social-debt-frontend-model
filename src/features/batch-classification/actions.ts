"use server";

import { ClassifyTextResponse } from "../text-classification/actions";

function parseErrorText(text: string, status: number): string {
  if (!text) return `API Error: ${status}`;
  try {
    const parsed = JSON.parse(text);
    return parsed.detail || parsed.message || parsed.error || text;
  } catch {
    return text;
  }
}

export type OpenAILimitsResponse = {
  error?: boolean;
  code?: number;
  details?: string;
  [key: string]: unknown;
};

export type StartBatchResponse = {
  job_id?: string;
  message?: string;
  error?: boolean;
};

export type MetricsData = {
  dominant_macrocauses?: [string, number][];
  dominant_microcauses?: [string, number][];
  dominant_microcause_types?: [string, number][];
  dominant_risks?: [string, number][];
  dominant_community_smells?: [string, number][];
  social_debt_index?: number;
  social_debt_level?: string;
  comment_count?: number;
  macro_diversity?: number;
  micro_diversity?: number;
  risk_diversity?: number;
  smell_diversity?: number;
};

export type BatchResultData = {
  comments: ClassifyTextResponse[];
  social_debt_metrics?: Record<string, MetricsData>;
  issues_metrics?: Record<string, MetricsData>;
  exports?: Record<string, string>;
};

export type BatchStatusResponse = {
  status?: string;
  message?: string;
  error?: boolean;
  code?: number;
  progress?: string;
  processed?: number;
  total?: number;
  estimated_remaining_seconds?: number;
  estimated_remaining_time_formatted?: string;
  estimated_wait_seconds?: number;
  result?: BatchResultData;
  data?: BatchResultData;
};

export async function checkOpenAILimits(): Promise<OpenAILimitsResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const apiKey = process.env.API_SECRET_KEY || "";

  try {
    const res = await fetch(`${apiUrl}/system/openai-limits`, {
      method: "GET",
      headers: { "X-API-Key": apiKey },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      return {
        error: true,
        code: res.status,
        details: parseErrorText(text, res.status),
      };
    }
    return (await res.json()) as OpenAILimitsResponse;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { error: true, code: 500, details: msg };
  }
}

export async function startBatchJob(
  formData: FormData,
): Promise<StartBatchResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const apiKey = process.env.API_SECRET_KEY || "";

  try {
    const res = await fetch(`${apiUrl}/classify/batch`, {
      method: "POST",
      headers: { "X-API-Key": apiKey },
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(parseErrorText(text, res.status));
    }

    return (await res.json()) as StartBatchResponse;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { error: true, message: msg };
  }
}

export async function checkBatchStatus(
  jobId: string,
): Promise<BatchStatusResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const apiKey = process.env.API_SECRET_KEY || "";

  try {
    const res = await fetch(`${apiUrl}/classify/batch/${jobId}`, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        Connection: "close",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        error: true,
        code: res.status,
        message: parseErrorText(text, res.status),
      };
    }

    return (await res.json()) as BatchStatusResponse;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { error: true, message: msg };
  }
}

export async function cancelBatchJob(jobId: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const apiKey = process.env.API_SECRET_KEY || "";

  try {
    const res = await fetch(`${apiUrl}/classify/batch/cancel`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ job_id: jobId }),
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        error: true,
        code: res.status,
        message: parseErrorText(text, res.status),
      };
    }

    return (await res.json()) as BatchStatusResponse;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { error: true, message: msg };
  }
}
