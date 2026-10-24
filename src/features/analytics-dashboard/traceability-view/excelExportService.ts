import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import ontology_dictionary from "../../ontology-catalog/frontend_ontology_dictionary.json";
import { flattenAndAggregateMetrics } from "../issue-view/issueMetricsUtils";
import {
  BatchResultData,
  MetricsData,
} from "../../social-debt-engine/batch-actions";

interface Step4Row {
  issue_number?: string | number;
  comment_id?: string | number;
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
  data: Record<string, unknown>[],
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

const downloadExcelAsync = async (
  dataArray: object[],
  sheetName: string,
  fileName: string,
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  addDataToSheet(
    worksheet,
    dataArray as Record<string, unknown>[],
    "TablaExportacion",
  );
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), fileName);
};

export const downloadStepExcel = async (
  stepIndex: number,
  resultData: BatchResultData,
  filename: string,
) => {
  let baseName = filename;
  if (baseName.includes(".")) {
    baseName = baseName.substring(0, baseName.lastIndexOf("."));
  }

  const { comments = [], issues_metrics = {} } = resultData;

  if (stepIndex === 0) {
    const dataStep1 = comments.map((c) => ({
      issue_number: c.issue_number,
      comment_id: c.comment_id,
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
              ((m as Record<string, unknown>).similarity as string | number) ||
              "";

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

    if (stepIndex === 3) {
      await downloadExcelAsync(
        dataStep4,
        "Paso 4",
        `${baseName}_auditoria_paso4.xlsx`,
      );
    } else {
      const workbook = new ExcelJS.Workbook();
      const sheetComments = workbook.addWorksheet("Comments");
      addDataToSheet(sheetComments, dataStep4, "CommentsStep5Table");

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
              flattenAndAggregateMetrics(
                (metrics.dominant_macrocauses as [string, number][]) || [],
              ),
            ) as string,
            dominant_microcauses: formatTupleList(
              flattenAndAggregateMetrics(
                (metrics.dominant_microcauses as [string, number][]) || [],
              ),
            ) as string,
            dominant_microcause_types: formatTupleList(
              flattenAndAggregateMetrics(
                (metrics.dominant_microcause_types as [string, number][]) || [],
              ),
            ) as string,
            dominant_community_smells: formatTupleList(
              flattenAndAggregateMetrics(
                (metrics.dominant_community_smells as [string, number][]) || [],
              ),
              getSmellCode,
            ) as string,
            dominant_risks: formatTupleList(
              flattenAndAggregateMetrics(
                (metrics.dominant_risks as [string, number][]) || [],
              ),
            ) as string,
            key_indicators: formatTupleList(
              flattenAndAggregateMetrics(
                (metrics.dominant_indicators ||
                  metrics.key_indicators ||
                  []) as [string, number][],
              ),
            ) as string,
            key_metrics: formatTupleList(
              flattenAndAggregateMetrics(
                (metrics.dominant_metrics ||
                  metrics.key_metrics ||
                  metrics.metrics ||
                  []) as [string, number][],
              ),
            ) as string,
            key_preventive_strategies: formatTupleList(
              flattenAndAggregateMetrics(
                (metrics.dominant_preventive_strategies ||
                  metrics.key_preventive_strategies ||
                  []) as [string, number][],
              ),
            ) as string,
            key_corrective_strategies: formatTupleList(
              flattenAndAggregateMetrics(
                (metrics.dominant_corrective_strategies ||
                  metrics.key_corrective_strategies ||
                  []) as [string, number][],
              ),
            ) as string,
            effects: formatTupleList(
              flattenAndAggregateMetrics(
                (metrics.dominant_effects || metrics.effects || []) as [
                  string,
                  number,
                ][],
              ),
            ) as string,
            social_debt_index: Number(metrics.social_debt_index) || 0,
          };

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

      const sheetSDI = workbook.addWorksheet("SDI Metrics");
      addDataToSheet(sheetSDI, sdiArray, "SDIMetricsStep5Table");

      const modelComparisonData = [
        {
          model: "Random Forest",
          input_type: "Adaptive Structured Features",
          accuracy: 0.9,
          macro_f1: 0.9017,
          weighted_f1: 0.9022,
        },
        {
          model: "TF-IDF + Logistic Regression",
          input_type: "Issue Text",
          accuracy: 0.5625,
          macro_f1: 0.5547,
          weighted_f1: 0.5576,
        },
        {
          model: "TF-IDF + Linear SVM",
          input_type: "Issue Text",
          accuracy: 0.5375,
          macro_f1: 0.5108,
          weighted_f1: 0.5142,
        },
      ];

      const crossValidationData = [
        {
          model: "Random Forest + Adaptive Features",
          accuracy_mean: 0.9094,
          accuracy_std: 0.022,
          macro_f1_mean: 0.9094,
          macro_f1_std: 0.022,
          weighted_f1_mean: 0.9096,
          weighted_f1_std: 0.0217,
        },
        {
          model: "TF-IDF + Logistic Regression",
          accuracy_mean: 0.6528,
          accuracy_std: 0.0627,
          macro_f1_mean: 0.6345,
          macro_f1_std: 0.066,
          weighted_f1_mean: 0.6355,
          weighted_f1_std: 0.066,
        },
        {
          model: "TF-IDF + Linear SVM",
          accuracy_mean: 0.5887,
          accuracy_std: 0.0577,
          macro_f1_mean: 0.5558,
          macro_f1_std: 0.0552,
          weighted_f1_mean: 0.5577,
          weighted_f1_std: 0.056,
        },
      ];

      const sheetModel = workbook.addWorksheet("Model Comparison");
      addDataToSheet(sheetModel, modelComparisonData, "ModelComparisonTable");

      const sheetCrossVal = workbook.addWorksheet("Cross-Validation");
      addDataToSheet(
        sheetCrossVal,
        crossValidationData,
        "CrossValidationTable",
      );

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

        const sheetName = `Ontology - ${category}`.substring(0, 31);
        const sheetOnt = workbook.addWorksheet(sheetName);
        addDataToSheet(sheetOnt, flatOnt, `OntologyStep5Table_${idx}`);
      });
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `${baseName}_step5_audit.xlsx`);
    }
  }
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
  const sheetComments = workbook.addWorksheet("Comments");
  addDataToSheet(sheetComments, dataStep4, "CommentsTable");

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
      } = metrics as MetricsData;
      const row: SDIArrayRow = {
        issue_number: issue_number,
        ...otherMetrics,
        macrocauses: formatTupleList(
          flattenAndAggregateMetrics(
            (dominant_macrocauses as [string, number][]) || undefined,
          ),
        ) as string,
        microcauses: formatTupleList(
          flattenAndAggregateMetrics(
            (dominant_microcauses as [string, number][]) || undefined,
          ),
        ) as string,
        microcause_types: formatTupleList(
          flattenAndAggregateMetrics(
            (dominant_microcause_types as [string, number][]) || undefined,
          ),
        ) as string,
        community_smells: formatTupleList(
          flattenAndAggregateMetrics(
            (dominant_community_smells as [string, number][]) || undefined,
          ),
          getSmellCode,
        ) as string,
        risks: formatTupleList(
          flattenAndAggregateMetrics(
            (dominant_risks as [string, number][]) || undefined,
          ),
        ) as string,
        indicators: formatTupleList(
          flattenAndAggregateMetrics(
            (dominant_indicators as [string, number][]) || undefined,
          ),
        ) as string,
        preventive_strategies: formatTupleList(
          flattenAndAggregateMetrics(
            (dominant_preventive_strategies as [string, number][]) || undefined,
          ),
        ) as string,
        corrective_strategies: formatTupleList(
          flattenAndAggregateMetrics(
            (dominant_corrective_strategies as [string, number][]) || undefined,
          ),
        ) as string,
        effects: formatTupleList(
          flattenAndAggregateMetrics(
            (dominant_effects as [string, number][]) || undefined,
          ),
        ) as string,
        metrics: formatTupleList(
          flattenAndAggregateMetrics(
            (dominant_metrics as [string, number][]) || undefined,
          ),
        ) as string,
      };
      return row;
    })
    .sort(
      (a, b) =>
        (Number(b.social_debt_index) || 0) - (Number(a.social_debt_index) || 0),
    );

  const sheetSDI = workbook.addWorksheet("SDI Metrics");
  addDataToSheet(sheetSDI, sdiArray, "TablaMetricasSDI");
  const modelComparisonData = [
    {
      model: "Random Forest",
      tipo_de_entrada: "Adaptive Structured Features",
      accuracy: 0.9,
      macro_f1: 0.9017,
      weighted_f1: 0.9022,
    },
    {
      model: "TF-IDF + Logistic Regression",
      tipo_de_entrada: "Issue Text",
      accuracy: 0.5625,
      macro_f1: 0.5547,
      weighted_f1: 0.5576,
    },
    {
      model: "TF-IDF + Linear SVM",
      tipo_de_entrada: "Issue Text",
      accuracy: 0.5375,
      macro_f1: 0.5108,
      weighted_f1: 0.5142,
    },
  ];

  const crossValidationData = [
    {
      model: "Random Forest + Adaptive Features",
      accuracy_mean: 0.9094,
      accuracy_std: 0.022,
      macro_f1_mean: 0.9094,
      macro_f1_std: 0.022,
      weighted_f1_mean: 0.9096,
      weighted_f1_std: 0.0217,
    },
    {
      model: "TF-IDF + Logistic Regression",
      accuracy_mean: 0.6528,
      accuracy_std: 0.0627,
      macro_f1_mean: 0.6345,
      macro_f1_std: 0.066,
      weighted_f1_mean: 0.6355,
      weighted_f1_std: 0.066,
    },
    {
      model: "TF-IDF + Linear SVM",
      accuracy_mean: 0.5887,
      accuracy_std: 0.0577,
      macro_f1_mean: 0.5558,
      macro_f1_std: 0.0552,
      weighted_f1_mean: 0.5577,
      weighted_f1_std: 0.056,
    },
  ];

  const sheetModel = workbook.addWorksheet("Model Comparison");
  addDataToSheet(sheetModel, modelComparisonData, "TablaComparacionModelos");

  const sheetCrossVal = workbook.addWorksheet("Cross Validation");
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

    const sheetName = `Ontology - ${category}`.substring(0, 31);
    const sheetOnt = workbook.addWorksheet(sheetName);
    addDataToSheet(sheetOnt, flatOnt, `TablaOntologia${idx}`);
  });
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `${baseName}_debt_results.xlsx`);
};
