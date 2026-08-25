"use server";

type Microcause = {
  ontology_id: string;
  cause_type: string;
  cause_name: string;
  similarity: number;
  risks?: string[];
  community_smells?: string[];
  preventive_strategies?: string[];
  effects?: string[];
  corrective_strategies?: string[];
  indicators?: string[];
  metrics?: string[];
};

export type ClassifyTextResponse = {
  cleaned_text: string;
  is_noise: boolean;
  noise_level: string;
  macro_cause_code: string;
  confidence: number;
  microcauses: Microcause[];
  error?: string;
  issue_number?: number | string;
  comment_id?: number | string;
};

export async function classifyText(
  text: string,
): Promise<ClassifyTextResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const apiKey = process.env.API_SECRET_KEY || "";

  try {
    const res = await fetch(`${apiUrl}/classify/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      throw new Error(`API returned status ${res.status}`);
    }

    const data = (await res.json()) as ClassifyTextResponse;
    return data;
  } catch (err: unknown) {
    console.error("Classification error:", err);
    return {
      cleaned_text: text,
      is_noise: false,
      noise_level: "none",
      macro_cause_code: "H",
      confidence: 0,
      microcauses: [],
      error: "Hubo un error de conexión con la API de Social Debt.",
    };
  }
}
