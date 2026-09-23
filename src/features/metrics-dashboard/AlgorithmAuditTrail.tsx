import React, { useMemo } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import ontology_dictionary from "../ontology/frontend_ontology_dictionary.json";
import { flattenAndAggregateMetrics } from "./utils";

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



const getSmellCode = (smellName: string): string => {
  const cleanName = typeof smellName === "string" ? smellName.trim() : "";
  const smells = (ontology_dictionary as OntDictType)["community_smells"] || {};
  for (const [code, data] of Object.entries(smells)) {
    if (typeof data !== "string" && data.name === cleanName) {
      return code;
    }
  }
  return smellName;
};

const addDataToSheet = (
  worksheet: ExcelJS.Worksheet,
  data: any[],
  tableName: string,
) => {
  if (!data || data.length === 0) return;

  const keys = Array.from(new Set(data.flatMap(Object.keys)));

  const columns = keys.map((key) => ({
    name: key,
    filterButton: true,
  }));

  const rows = data.map((item) => keys.map((key) => item[key] ?? ""));

  const safeTableName =
    tableName.replace(/[^a-zA-Z0-9_]/g, "") + Math.floor(Math.random() * 1000);

  worksheet.addTable({
    name: safeTableName,
    ref: "A1",
    headerRow: true,
    totalsRow: false,
    style: {
      showRowStripes: true,
    },
    columns: columns,
    rows: rows,
  });

  const softBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFCBD5E1" } },
    left: { style: "thin", color: { argb: "FFCBD5E1" } },
    bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
    right: { style: "thin", color: { argb: "FFCBD5E1" } },
  };

  const headerRow = worksheet.getRow(1);
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const isEven = colNumber % 2 === 0;
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: isEven ? "FF4F81BD" : "FF385D8A" },
    };
    cell.font = {
      color: { argb: "FFFFFFFF" },
      bold: true,
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: false,
    };
    cell.border = softBorder;
  });

  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    let headerLength = 0;

    column.eachCell!({ includeEmpty: true }, (cell, rowNumber) => {
      const columnLength = cell.value ? cell.value.toString().length : 0;

      if (rowNumber === 1) {
        headerLength = columnLength + 8;
      } else {
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
        cell.alignment = {
          vertical: "middle",
          horizontal: "left",
          wrapText: true,
        };
        cell.border = softBorder;
      }
    });

    const calculatedWidth = Math.max(headerLength, Math.min(maxLength + 2, 60));
    column.width = calculatedWidth;
  });
};

export const downloadFinalExcel = async (
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
          ? mSmells.map((s) => getSmellCode(s as string)).join(" | ")
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

  const workbook = new ExcelJS.Workbook();
  const sheetComments = workbook.addWorksheet("Comentarios");
  addDataToSheet(sheetComments, dataStep4, "TablaComentarios");

  const formatTupleList = (
    lst: unknown,
    nameMapper?: (n: string) => string,
  ): string | unknown => {
    if (Array.isArray(lst)) {
      return lst
        .map((item: unknown) => {
          if (Array.isArray(item) && item.length >= 2) {
            const val = item[1] as number;
            const name =
              typeof item[0] === "string" && nameMapper
                ? nameMapper(item[0])
                : item[0];
            return `${name} (${Number.isInteger(val) ? val : typeof val === "number" ? val.toFixed(2) : val})`;
          }
          return typeof item === "string" && nameMapper
            ? nameMapper(item)
            : String(item);
        })
        .join(" | ");
    }
    return lst;
  };

  const sdiArray = Object.keys(issues_metrics)
    .map((issue_number) => {
      const metrics = issues_metrics[issue_number] as Record<string, unknown>;
      const {
        dominant_macrocauses,
        dominant_microcauses,
        dominant_microcause_types,
        dominant_community_smells,
        dominant_risks,
        dominant_indicators,
        dominant_preventive_strategies,
        dominant_corrective_strategies,
        dominant_effects,
        dominant_metrics,
        ...otherMetrics
      } = metrics as any;
      const row: SDIArrayRow = {
        issue_number: issue_number,
        ...otherMetrics,
        macrocauses: formatTupleList(
          flattenAndAggregateMetrics(dominant_macrocauses as [string, number][] | undefined),
        ) as string,
        microcauses: formatTupleList(
          flattenAndAggregateMetrics(dominant_microcauses as [string, number][] | undefined),
        ) as string,
        microcause_types: formatTupleList(
          flattenAndAggregateMetrics(dominant_microcause_types as [string, number][] | undefined),
        ) as string,
        community_smells: formatTupleList(
          flattenAndAggregateMetrics(dominant_community_smells as [string, number][] | undefined),
          getSmellCode,
        ) as string,
        risks: formatTupleList(
          flattenAndAggregateMetrics(dominant_risks as [string, number][] | undefined),
        ) as string,
        indicators: formatTupleList(
          flattenAndAggregateMetrics(dominant_indicators as [string, number][] | undefined),
        ) as string,
        preventive_strategies: formatTupleList(
          flattenAndAggregateMetrics(dominant_preventive_strategies as [string, number][] | undefined),
        ) as string,
        corrective_strategies: formatTupleList(
          flattenAndAggregateMetrics(dominant_corrective_strategies as [string, number][] | undefined),
        ) as string,
        effects: formatTupleList(
          flattenAndAggregateMetrics(dominant_effects as [string, number][] | undefined),
        ) as string,
        metrics: formatTupleList(
          flattenAndAggregateMetrics(dominant_metrics as [string, number][] | undefined),
        ) as string,
      };
      return row;
    })
    .sort(
      (a, b) =>
        (Number(b.social_debt_index) || 0) - (Number(a.social_debt_index) || 0),
    );

  const sheetSDI = workbook.addWorksheet("Metricas SDI");
  addDataToSheet(sheetSDI, sdiArray, "TablaMetricasSDI");
  // --- Static Model Data ---
  const modelComparisonData = [
    { model: "Random Forest", tipo_de_entrada: "Características Estructuradas Adaptativas", accuracy: 0.9000, macro_f1: 0.9017, weighted_f1: 0.9022 },
    { model: "TF-IDF + Logistic Regression", tipo_de_entrada: "Texto del Issue", accuracy: 0.5625, macro_f1: 0.5547, weighted_f1: 0.5576 },
    { model: "TF-IDF + Linear SVM", tipo_de_entrada: "Texto del Issue", accuracy: 0.5375, macro_f1: 0.5108, weighted_f1: 0.5142 }
  ];
  
  const crossValidationData = [
    { model: "Random Forest + Adaptive Features", accuracy_mean: 0.9094, accuracy_std: 0.0220, macro_f1_mean: 0.9094, macro_f1_std: 0.0220, weighted_f1_mean: 0.9096, weighted_f1_std: 0.0217 },
    { model: "TF-IDF + Logistic Regression", accuracy_mean: 0.6528, accuracy_std: 0.0627, macro_f1_mean: 0.6345, macro_f1_std: 0.0660, weighted_f1_mean: 0.6355, weighted_f1_std: 0.0660 },
    { model: "TF-IDF + Linear SVM", accuracy_mean: 0.5887, accuracy_std: 0.0577, macro_f1_mean: 0.5558, macro_f1_std: 0.0552, weighted_f1_mean: 0.5577, weighted_f1_std: 0.0560 }
  ];

  const sheetModel = workbook.addWorksheet("Comparación Modelos");
  addDataToSheet(sheetModel, modelComparisonData, "TablaComparacionModelos");

  const sheetCrossVal = workbook.addWorksheet("Validación Cruzada");
  addDataToSheet(sheetCrossVal, crossValidationData, "TablaValidacionCruzada");


  const ontDict = ontology_dictionary as OntDictType;
  Object.keys(ontDict).forEach((category, idx) => {
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
    const sheetOnt = workbook.addWorksheet(sheetName);
    addDataToSheet(sheetOnt, flatOnt, `TablaOntologia${idx}`);
  });
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `${baseName}_resultados_deuda.xlsx`);
};

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
    
    // Paso 2: Noise levels
    const noiseLevels: Record<string, number> = { "Hard noise": 0, "Soft noise": 0, "Useful": 0 };
    comments.forEach(c => {
      const level = (c.noise_level || "").toLowerCase();
      if (level.includes("hard")) noiseLevels["Hard noise"]++;
      else if (level.includes("soft")) noiseLevels["Soft noise"]++;
      else noiseLevels["Useful"]++;
    });

    // Paso 4: Unicas macro y micro
    // Paso 4: Distribucion macrocausas
    let macroDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0 };
    comments.forEach((c) => {
      if (c.macro_cause_code && c.macro_cause_code !== "none") {
        const m = c.macro_cause_code.toUpperCase();
        if (macroDistribution[m] !== undefined) {
          macroDistribution[m]++;
        }
      }
    });
    const distStr = Object.entries(macroDistribution)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([macro, count]) => `${macro}: ${count}`)
      .join(" | ") || "Ninguna";

    // Paso 5: Max y Min SDI
    let maxSdiValue = -1;
    let minSdiValue = Infinity;

    Object.entries(metrics).forEach(([issue, m]) => {
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
          const dict = (ontology_dictionary as any).microcause_types;
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
      noiseLevels,
      distStr,
      
      maxSdiDisplay,
      minSdiDisplay
    };
  }, [resultData]);

  const STEPS = [
    {
      title: "Paso 1: Limpieza de Texto Crudo",
      description:
        "En esta etapa inicial se procesa el texto crudo de los comentarios para remover elementos que no aportan valor semántico, tales como bloques de código, imágenes, URLs, firmas y artefactos de Markdown. El objetivo es aislar y extraer únicamente el texto plano que pasará a la fase de análisis.",
      exportKey: "step1_b64",
      stats: [
        { label: "Comentarios procesados", value: stats.totalComments },
      ],
    },
    {
      title: "Paso 2: Filtro de Ruido Operativo (Clasificador)",
      description:
        "Se analiza el texto limpio para filtrar y descartar el ruido operativo. Se identifican los comentarios generados por bots, integraciones automatizadas (ej. flujos de CI/CD) o intervenciones humanas rutinarias (ej. 'LGTM', 'thanks') que carecen de contexto sobre deuda social, conservando únicamente los comentarios útiles.",
      exportKey: "step2_b64",
      stats: [
        { label: "Hard noise (Ruido Absoluto)", value: stats.noiseLevels["Hard noise"] },
        { label: "Soft noise (Ruido Suave)", value: stats.noiseLevels["Soft noise"] },
        { label: "Useful (Útiles para análisis)", value: stats.noiseLevels["Useful"] },
      ],
    },
    {
      title: "Paso 3: Clasificación de Macrocausas (LLM)",
      description:
        "Los comentarios útiles son procesados por un modelo de lenguaje (LLM) que evalúa la semántica de la conversación. Cada comentario se analiza y clasifica para determinar si pertenece a alguna de las 7 macrocausas de deuda social (A-G) o si se trata de una conversación normal y/o no identificable (Causa H).",
      exportKey: "step3_b64",
      stats: [
        {
          label: "Comentarios efectivos a evaluar",
          value: stats.normalConversations + stats.debtComments,
        },
        {
          label: "No identificable (Macrocausa H)",
          value: stats.normalConversations,
        },
        {
          label: "Deuda Social (Causas A-G)",
          value: stats.debtComments,
        },
      ],
    },
    {
      title: "Paso 4: Asignación de Microcausas (NLP)",
      description:
        "Los comentarios identificados con deuda social (A-G) se procesan mediante un modelo de Natural Language Processing (NLP) basado en embeddings vectoriales. Se calcula la similitud semántica para emparejar y extraer las microcausas específicas de la ontología, logrando una mayor granularidad analítica.",
      exportKey: "step4_b64",
      stats: [
        {
          label: "Microcausas identificadas",
          value: stats.totalMicrocauses,
        },
        {
          label: "Tipo de microcausa más frecuente",
          value: stats.topTypes,
        },
      ],
    },
    {
      title: "Paso 5: Agrupamiento y Cálculo del Índice SDI",
      description:
        "Los resultados obtenidos se consolidan y agrupan por hilo de conversación (Issue). Se calcula el Índice de Deuda Social (SDI) utilizando un algoritmo que pondera tanto la criticidad como la variedad de las causas detectadas, entregando una métrica cuantitativa de la deuda técnica y social del Issue.",
      exportKey: "final_excel_b64",
      stats: [
        {
          label: "Issues (Hilos)",
          value: stats.totalIssues,
        },
        {
          label: "SDI Máximo",
          value: stats.maxSdiDisplay,
        },
        {
          label: "SDI Mínimo",
          value: stats.minSdiDisplay,
        },
      ],
    },
  ];

  const downloadExcelAsync = async (
    dataArray: object[],
    sheetName: string,
    fileName: string,
  ) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    addDataToSheet(worksheet, dataArray, "TablaExportacion");
  const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), fileName);
  };

  const handleDownload = async (stepIndex: number) => {
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
      await downloadExcelAsync(
        dataStep1,
        "Paso 1",
        `${baseName}_auditoria_paso1.xlsx`,
      );
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
      await downloadExcelAsync(
        dataStep2,
        "Paso 2",
        `${baseName}_auditoria_paso2.xlsx`,
      );
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
      await downloadExcelAsync(
        dataStep3,
        "Paso 3",
        `${baseName}_auditoria_paso3.xlsx`,
      );
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
                ? mSmells.map((s) => getSmellCode(s as string)).join(" | ")
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
        await downloadExcelAsync(
          dataStep4,
          "Paso 4",
          `${baseName}_auditoria_paso4.xlsx`,
        );
      } else {
        const workbook = new ExcelJS.Workbook();
        const sheetComments = workbook.addWorksheet("Comentarios");
        addDataToSheet(sheetComments, dataStep4, "TablaComentariosPaso5");

        const formatTupleList = (
          lst: unknown,
          nameMapper?: (n: string) => string,
        ): string | unknown => {
          if (Array.isArray(lst)) {
            return lst
              .map((item: unknown) => {
                if (Array.isArray(item) && item.length >= 2) {
                  const val = item[1] as number;
                  const name =
                    typeof item[0] === "string" && nameMapper
                      ? nameMapper(item[0])
                      : item[0];
                  return `${name} (${Number.isInteger(val) ? val : typeof val === "number" ? val.toFixed(2) : val})`;
                }
                return typeof item === "string" && nameMapper
                  ? nameMapper(item)
                  : String(item);
              })
              .join(" | ");
          }
          return lst;
        };

        const sdiArray = Object.keys(issues_metrics)
          .map((issue_number) => {
            const metrics = issues_metrics[issue_number] as Record<
              string,
              unknown
            >;
            const row: SDIArrayRow = {
              issue_number: issue_number,
              ...metrics,
              dominant_macrocauses: formatTupleList(
                flattenAndAggregateMetrics(metrics.dominant_macrocauses as [string, number][] || []),
              ) as string,
              dominant_microcauses: formatTupleList(
                flattenAndAggregateMetrics(metrics.dominant_microcauses as [string, number][] || []),
              ) as string,
              dominant_microcause_types: formatTupleList(
                flattenAndAggregateMetrics(metrics.dominant_microcause_types as [string, number][] || []),
              ) as string,
              dominant_community_smells: formatTupleList(
                flattenAndAggregateMetrics(metrics.dominant_community_smells as [string, number][] || []),
                getSmellCode,
              ) as string,
              dominant_risks: formatTupleList(
                flattenAndAggregateMetrics(metrics.dominant_risks as [string, number][] || [])
              ) as string,
              key_indicators: formatTupleList(
                flattenAndAggregateMetrics((metrics.dominant_indicators || metrics.key_indicators || []) as [string, number][]),
              ) as string,
              key_metrics: formatTupleList(
                flattenAndAggregateMetrics((metrics.dominant_metrics || metrics.key_metrics || metrics.metrics || []) as [string, number][]),
              ) as string,
              key_preventive_strategies: formatTupleList(
                flattenAndAggregateMetrics((metrics.dominant_preventive_strategies || metrics.key_preventive_strategies || []) as [string, number][]),
              ) as string,
              key_corrective_strategies: formatTupleList(
                flattenAndAggregateMetrics((metrics.dominant_corrective_strategies || metrics.key_corrective_strategies || []) as [string, number][]),
              ) as string,
              effects: formatTupleList(
                flattenAndAggregateMetrics((metrics.dominant_effects || metrics.effects || []) as [string, number][]),
              ) as string,
              social_debt_index: Number(metrics.social_debt_index) || 0,
            };
            
            // Eliminar las llaves originales para que no aparezcan columnas vacías
            delete row.dominant_indicators;
            delete row.dominant_metrics;
            delete row.dominant_preventive_strategies;
            delete row.dominant_corrective_strategies;
            delete row.dominant_effects;

            return row;
          })
          .sort(
            (a, b) =>
              (Number(b.social_debt_index) || 0) -
              (Number(a.social_debt_index) || 0),
          );

        const sheetSDI = workbook.addWorksheet("Metricas SDI");
        addDataToSheet(sheetSDI, sdiArray, "TablaMetricasSDIPaso5");
  // --- Static Model Data ---
  const modelComparisonData = [
    { model: "Random Forest", tipo_de_entrada: "Características Estructuradas Adaptativas", accuracy: 0.9000, macro_f1: 0.9017, weighted_f1: 0.9022 },
    { model: "TF-IDF + Logistic Regression", tipo_de_entrada: "Texto del Issue", accuracy: 0.5625, macro_f1: 0.5547, weighted_f1: 0.5576 },
    { model: "TF-IDF + Linear SVM", tipo_de_entrada: "Texto del Issue", accuracy: 0.5375, macro_f1: 0.5108, weighted_f1: 0.5142 }
  ];
  
  const crossValidationData = [
    { model: "Random Forest + Adaptive Features", accuracy_mean: 0.9094, accuracy_std: 0.0220, macro_f1_mean: 0.9094, macro_f1_std: 0.0220, weighted_f1_mean: 0.9096, weighted_f1_std: 0.0217 },
    { model: "TF-IDF + Logistic Regression", accuracy_mean: 0.6528, accuracy_std: 0.0627, macro_f1_mean: 0.6345, macro_f1_std: 0.0660, weighted_f1_mean: 0.6355, weighted_f1_std: 0.0660 },
    { model: "TF-IDF + Linear SVM", accuracy_mean: 0.5887, accuracy_std: 0.0577, macro_f1_mean: 0.5558, macro_f1_std: 0.0552, weighted_f1_mean: 0.5577, weighted_f1_std: 0.0560 }
  ];

  const sheetModel = workbook.addWorksheet("Comparación Modelos");
  addDataToSheet(sheetModel, modelComparisonData, "TablaComparacionModelos");

  const sheetCrossVal = workbook.addWorksheet("Validación Cruzada");
  addDataToSheet(sheetCrossVal, crossValidationData, "TablaValidacionCruzada");


        const ontDict = ontology_dictionary as OntDictType;
        Object.keys(ontDict).forEach((category, idx) => {
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
          const sheetOnt = workbook.addWorksheet(sheetName);
          addDataToSheet(sheetOnt, flatOnt, `TablaOntologiaPaso5_${idx}`);
        });
  const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `${baseName}_auditoria_paso5.xlsx`);
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
