import React, { useMemo } from "react";

import * as XLSX from "xlsx";
import ontology_dictionary from "../ontology/frontend_ontology_dictionary.json";

interface Step4Row {
  issue_number?: string | number;
  comment_id?: string | number;
  author?: string;
  raw_text?: string;
  cleaned_text?: string;
  is_noise?: boolean;
  noise_level?: string;
  macro_cause_code?: string;
  macro_cause_clean?: string;
  rule_applied?: string;
  confidence?: number;
  [key: string]: string | number | boolean | undefined;
}

interface SDIArrayRow {
  issue_number: string;
  [key: string]: string | number | boolean | undefined;
}

interface OntologyCategoryItem {
  name?: string;
  description?: string;
}

type OntDictType = Record<
  string,
  Record<string, OntologyCategoryItem | string>
>;

import { Download, Info } from "lucide-react";
import { BatchResultData, MetricsData } from "../batch-classification/actions";

export const downloadFinalExcel = (
  resultData: BatchResultData,
  filename: string,
) => {
  let baseName = filename;
  if (baseName.includes(".")) {
    baseName = baseName.substring(0, baseName.lastIndexOf("."));
  }
  const { comments = [], issues_metrics = {} } = resultData;

  const dataStep4 = comments.map((c) => {
    const row: Step4Row = {
      issue_number: c.issue_number as string | number | undefined,
      comment_id: c.comment_id as string | number | undefined,
      author: c.author,
      raw_text: c.raw_text,
      cleaned_text: c.cleaned_text,
      is_noise: c.is_noise,
      noise_level: c.noise_level,
      macro_cause_code: c.macro_cause_code,
      macro_cause_clean: c.macro_cause_clean,
      rule_applied: c.rule_applied,
      confidence: c.confidence,
    };

    for (let i = 1; i <= 3; i++) {
      const m = c.microcauses && c.microcauses[i - 1];
      if (m) {
        row[`microcause_${i}_name`] = m.cause_name || "";
        row[`microcause_${i}_similarity`] =
          ((m as Record<string, unknown>).similarity as string | number) || "";

        const mTypes = (m as Record<string, unknown>).cause_type;
        row[`microcause_${i}_types`] = Array.isArray(mTypes)
          ? mTypes.join(" | ")
          : (mTypes as string) || "";

        const mRisks = (m as Record<string, unknown>).risks;
        row[`microcause_${i}_risks`] = Array.isArray(mRisks)
          ? mRisks.join(" | ")
          : "";

        const mSmells = (m as Record<string, unknown>).community_smells;
        row[`microcause_${i}_smells`] = Array.isArray(mSmells)
          ? mSmells.join(" | ")
          : "";

        const mPrev = (m as Record<string, unknown>).preventive_strategies;
        row[`microcause_${i}_preventive_strategies`] = Array.isArray(mPrev)
          ? mPrev.join(" | ")
          : "";

        const mCorr = (m as Record<string, unknown>).corrective_strategies;
        row[`microcause_${i}_corrective_strategies`] = Array.isArray(mCorr)
          ? mCorr.join(" | ")
          : "";

        const mEff = (m as Record<string, unknown>).effects;
        row[`microcause_${i}_effects`] = Array.isArray(mEff)
          ? mEff.join(" | ")
          : "";

        const mInd = (m as Record<string, unknown>).indicators;
        row[`microcause_${i}_indicators`] = Array.isArray(mInd)
          ? mInd.join(" | ")
          : "";

        const mMet = (m as Record<string, unknown>).metrics;
        row[`microcause_${i}_metrics`] = Array.isArray(mMet)
          ? mMet.join(" | ")
          : "";
      }
    }
    return row;
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(dataStep4),
    "Comentarios",
  );

  const formatTupleList = (lst: unknown): string | unknown => {
    if (Array.isArray(lst)) {
      return lst
        .map((item: unknown) => {
          if (Array.isArray(item) && item.length >= 2) {
            const val = item[1] as number;
            return `${item[0]} (${Number.isInteger(val) ? val : typeof val === "number" ? val.toFixed(2) : val})`;
          }
          return String(item);
        })
        .join(" | ");
    }
    return lst;
  };

  const sdiArray = Object.keys(issues_metrics).map((issue_number) => {
    const metrics = issues_metrics[issue_number] as Record<string, unknown>;
    const row: SDIArrayRow = {
      issue_number: issue_number,
      ...metrics,
      dominant_macrocauses: formatTupleList(
        metrics.dominant_macrocauses,
      ) as string,
      dominant_microcauses: formatTupleList(
        metrics.dominant_microcauses,
      ) as string,
      dominant_microcause_types: formatTupleList(
        metrics.dominant_microcause_types,
      ) as string,
      dominant_community_smells: formatTupleList(
        metrics.dominant_community_smells,
      ) as string,
      dominant_risks: formatTupleList(metrics.dominant_risks) as string,
    };
    return row;
  });
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(sdiArray),
    "Metricas SDI",
  );

  const ontDict = ontology_dictionary as OntDictType;
  Object.keys(ontDict).forEach((category) => {
    const categoryItems = ontDict[category];
    const flatOnt = Object.keys(categoryItems).map((id) => {
      const item = categoryItems[id];
      if (typeof item === "string") {
        return { id: id, name: item, description: "" };
      }
      return {
        id: id,
        name: item?.name || "",
        description: item?.description || "",
      };
    });

    const sheetName = `Ontologia - ${category}`.substring(0, 31);
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(flatOnt),
      sheetName,
    );
  });

  XLSX.writeFile(workbook, `${baseName}_resultados_deuda.xlsx`, {
    compression: true,
  });
};

export const AlgorithmAuditTrail = ({
  resultData,
  filename,
}: {
  resultData: BatchResultData;
  filename: string;
}) => {
  // Calculate dynamic stats
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
        .slice(0, 2)
        .map((t) => t[0].replace("Cause", ""))
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
            El SDI requiere al menos 2 Issues para comparar.
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
    };
  }, [resultData]);

  const STEPS = [
    {
      title: "Paso 1: Limpieza de Texto Crudo",
      description:
        "En esta etapa inicial, se ejecuta un proceso de depuración sobre el texto crudo de los comentarios. Se remueven elementos estructurales y técnicos como bloques de código fuente, imágenes, URLs, firmas y artefactos de Markdown. El objetivo es aislar el texto plano susceptible a análisis semántico.",
      exportKey: "step1_b64",
      stats: [
        { label: "Total comentarios procesados", value: stats.totalComments },
      ],
    },
    {
      title: "Paso 2: Filtro de Ruido Operativo (Bots y Patrones)",
      description:
        "El sistema aplica reglas heurísticas sobre el texto depurado para filtrar el \'ruido operativo\'. Se identifican y descartan comentarios generados por automatizaciones (ej. dependabot, flujos de CI/CD) e intervenciones humanas rutinarias (ej. \'LGTM\', \'thanks\') que carecen de contexto relevante sobre deuda social.",
      exportKey: "step2_b64",
      stats: [
        {
          label: "Descartados por ruido (Bots/Operativos)",
          value: stats.discardedNoise,
        },
        {
          label: "Comentarios válidos para análisis de IA",
          value: stats.cleanComments,
        },
      ],
    },
    {
      title: "Paso 3: Razonamiento Complejo (LLM - Macrocausas)",
      description:
        "Los comentarios filtrados son procesados mediante modelos de lenguaje (LLM) para evaluar su semántica. El sistema clasifica cada comentario dentro de las 7 Macrocausas de deuda social. Posteriormente, un motor de priorización valida la inferencia del modelo basándose en la coincidencia de patrones en el texto.",
      exportKey: "step3_b64",
      stats: [
        {
          label: "Conversaciones normales (Descartadas - Causa H)",
          value: stats.normalConversations,
        },
        {
          label: "Comentarios confirmados con Deuda Social (A-G)",
          value: stats.debtComments,
        },
      ],
    },
    {
      title: "Paso 4: Emparejamiento Semántico (NLP - Microcausas)",
      description:
        "Los comentarios identificados con deuda social se procesan mediante un modelo de Natural Language Processing (NLP) basado en embeddings vectoriales. El algoritmo calcula la similitud semántica en un espacio multidimensional para extraer las 3 Microcausas más afines según la ontología, proporcionando un análisis multicausal estructurado.",
      exportKey: "step4_b64",
      stats: [
        {
          label: "Microcausas totales identificadas",
          value: stats.totalMicrocauses,
        },
        { label: "Tipos de Causa principales", value: stats.topTypes },
      ],
    },
    {
      title: "Paso 5: Reporte Final Maestro e Índice SDI",
      description:
        "Los resultados a nivel de comentario se consolidan y agrupan por hilo de conversación (Issue). Se calcula el Índice de Deuda Social (SDI) empleando un algoritmo que pondera la frecuencia y la diversidad causal, proporcionando una métrica cuantitativa de la criticidad sociotécnica en cada discusión.",
      exportKey: "final_excel_b64",
      stats: [
        {
          label: "Issues (Hilos) únicos consolidados",
          value: stats.totalIssues,
        },
        { label: "Puntaje SDI Promedio del Lote", value: stats.avgSdi },
      ],
    },
  ];

  const downloadExcel = (
    dataArray: object[],
    sheetName: string,
    fileName: string,
  ) => {
    const worksheet = XLSX.utils.json_to_sheet(dataArray);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, fileName, { compression: true });
  };

  const handleDownload = (stepIndex: number) => {
    let baseName = filename;
    if (baseName.includes(".")) {
      baseName = baseName.substring(0, baseName.lastIndexOf("."));
    }

    const { comments = [], issues_metrics = {} } = resultData;

    if (stepIndex === 0) {
      const dataStep1 = comments.map((c) => ({
        issue_number: c.issue_number,
        comment_id: c.comment_id,
        author: c.author,
        raw_text: c.raw_text,
        cleaned_text: c.cleaned_text,
      }));
      downloadExcel(dataStep1, "Paso 1", `${baseName}_auditoria_paso1.xlsx`);
    } else if (stepIndex === 1) {
      const dataStep2 = comments.map((c) => ({
        issue_number: c.issue_number,
        comment_id: c.comment_id,
        author: c.author,
        raw_text: c.raw_text,
        cleaned_text: c.cleaned_text,
        is_noise: c.is_noise,
        noise_level: c.noise_level,
      }));
      downloadExcel(dataStep2, "Paso 2", `${baseName}_auditoria_paso2.xlsx`);
    } else if (stepIndex === 2) {
      const dataStep3 = comments
        .filter((c) => c.is_noise === false)
        .map((c) => ({
          issue_number: c.issue_number,
          comment_id: c.comment_id,
          author: c.author,
          raw_text: c.raw_text,
          cleaned_text: c.cleaned_text,
          is_noise: c.is_noise,
          noise_level: c.noise_level,
          macro_cause_code: c.macro_cause_code,
          macro_cause_clean: c.macro_cause_clean,
          rule_applied: c.rule_applied,
          confidence: c.confidence,
        }));
      downloadExcel(dataStep3, "Paso 3", `${baseName}_auditoria_paso3.xlsx`);
    } else if (stepIndex === 3 || stepIndex === 4) {
      const dataStep4 = comments
        .filter((c) => c.is_noise === false && c.macro_cause_code !== "H")
        .map((c) => {
          const row: Step4Row = {
            issue_number: c.issue_number as string | number | undefined,
            comment_id: c.comment_id as string | number | undefined,
            author: c.author,
            raw_text: c.raw_text,
            cleaned_text: c.cleaned_text,
            is_noise: c.is_noise,
            noise_level: c.noise_level,
            macro_cause_code: c.macro_cause_code,
            macro_cause_clean: c.macro_cause_clean,
            rule_applied: c.rule_applied,
            confidence: c.confidence,
          };

          for (let i = 1; i <= 3; i++) {
            const m = c.microcauses && c.microcauses[i - 1];
            if (m) {
              row[`microcause_${i}_name`] = m.cause_name || "";
              row[`microcause_${i}_similarity`] =
                ((m as Record<string, unknown>).similarity as
                  | string
                  | number) || "";

              const mTypes = (m as Record<string, unknown>).cause_type;
              row[`microcause_${i}_types`] = Array.isArray(mTypes)
                ? mTypes.join(" | ")
                : (mTypes as string) || "";

              const mRisks = (m as Record<string, unknown>).risks;
              row[`microcause_${i}_risks`] = Array.isArray(mRisks)
                ? mRisks.join(" | ")
                : "";

              const mSmells = (m as Record<string, unknown>).community_smells;
              row[`microcause_${i}_smells`] = Array.isArray(mSmells)
                ? mSmells.join(" | ")
                : "";

              const mPrev = (m as Record<string, unknown>)
                .preventive_strategies;
              row[`microcause_${i}_preventive_strategies`] = Array.isArray(
                mPrev,
              )
                ? mPrev.join(" | ")
                : "";

              const mCorr = (m as Record<string, unknown>)
                .corrective_strategies;
              row[`microcause_${i}_corrective_strategies`] = Array.isArray(
                mCorr,
              )
                ? mCorr.join(" | ")
                : "";

              const mEff = (m as Record<string, unknown>).effects;
              row[`microcause_${i}_effects`] = Array.isArray(mEff)
                ? mEff.join(" | ")
                : "";

              const mInd = (m as Record<string, unknown>).indicators;
              row[`microcause_${i}_indicators`] = Array.isArray(mInd)
                ? mInd.join(" | ")
                : "";

              const mMet = (m as Record<string, unknown>).metrics;
              row[`microcause_${i}_metrics`] = Array.isArray(mMet)
                ? mMet.join(" | ")
                : "";
            }
          }
          return row;
        });

      if (stepIndex === 3) {
        downloadExcel(dataStep4, "Paso 4", `${baseName}_auditoria_paso4.xlsx`);
      } else {
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.json_to_sheet(dataStep4),
          "Comentarios",
        );

        const formatTupleList = (lst: unknown): string | unknown => {
          if (Array.isArray(lst)) {
            return lst
              .map((item: unknown) => {
                if (Array.isArray(item) && item.length >= 2) {
                  const val = item[1] as number;
                  return `${item[0]} (${Number.isInteger(val) ? val : typeof val === "number" ? val.toFixed(2) : val})`;
                }
                return String(item);
              })
              .join(" | ");
          }
          return lst;
        };

        const sdiArray = Object.keys(issues_metrics).map((issue_number) => {
          const metrics = issues_metrics[issue_number] as Record<
            string,
            unknown
          >;
          const row: SDIArrayRow = {
            issue_number: issue_number,
            ...metrics,
            dominant_macrocauses: formatTupleList(
              metrics.dominant_macrocauses,
            ) as string,
            dominant_microcauses: formatTupleList(
              metrics.dominant_microcauses,
            ) as string,
            dominant_microcause_types: formatTupleList(
              metrics.dominant_microcause_types,
            ) as string,
            dominant_community_smells: formatTupleList(
              metrics.dominant_community_smells,
            ) as string,
            dominant_risks: formatTupleList(metrics.dominant_risks) as string,
          };
          return row;
        });
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.json_to_sheet(sdiArray),
          "Metricas SDI",
        );

        const ontDict = ontology_dictionary as OntDictType;
        Object.keys(ontDict).forEach((category) => {
          const categoryItems = ontDict[category];
          const flatOnt = Object.keys(categoryItems).map((id) => {
            const item = categoryItems[id];
            if (typeof item === "string") {
              return { id: id, name: item, description: "" };
            }
            return {
              id: id,
              name: item?.name || "",
              description: item?.description || "",
            };
          });

          const sheetName = `Ontologia - ${category}`.substring(0, 31);
          XLSX.utils.book_append_sheet(
            workbook,
            XLSX.utils.json_to_sheet(flatOnt),
            sheetName,
          );
        });

        XLSX.writeFile(workbook, `${baseName}_auditoria_paso5.xlsx`, {
          compression: true,
        });
      }
    }
  };

  return (
    <div className="flex flex-col py-2">
      <div className="mb-8 relative z-10">
        <h2 className="text-2xl font-bold text-slate-800">
          Trazabilidad del Algoritmo
        </h2>
        <p className="text-slate-500 mt-1">
          Descripción detallada del procesamiento paso a paso.
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
                Descargar Paso {index + 1}
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
                    className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-50 flex flex-col gap-0.5"
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-tight">
                      {stat.label}
                    </span>
                    <span
                      className="text-lg font-bold text-indigo-700 leading-snug"
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
