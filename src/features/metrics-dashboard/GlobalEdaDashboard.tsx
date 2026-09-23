import React, { useMemo } from "react";
import { BatchResultData } from "../batch-classification/actions";

import { useOntology } from "../ontology/useOntology";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { ResponsiveHeatMap, HeatMapDatum } from "@nivo/heatmap";
import { ContinuousColorScaleConfig } from "@nivo/colors";
import { BasicTooltip } from "@nivo/tooltip";
import {
  Layers,
  Users,
  Route,
  Database,
} from "lucide-react";

import { PrecalculatedEdaData, precalculateEdaStats } from "./edaUtils";
type Props = {
  resultData: BatchResultData;
  precalculatedStats?: PrecalculatedEdaData;
};



const DashboardSection = ({
  title,
  icon: Icon,
  children,
  count = 0,
}: {
  title: React.ReactNode;
  icon: React.ElementType;
  children: React.ReactNode;
  count?: number;
}) => {
  return (
    <section className="mb-6 mt-4">
      <div className="w-full flex items-center mb-8">
        <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
            <Icon className="w-6 h-6" />
          </div>
          {title}
          {count > 0 && (
            <span className="text-sm font-bold px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
              {count}
            </span>
          )}
        </h2>
      </div>
      <div className="w-full relative">
        {children}
      </div>
      {/* Separador sutil para darle ritmo visual a la página */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mt-16 mb-4"></div>
    </section>
  );
};

const GlobalMetricBarChart = ({
  data,
  fill = "#4f46e5",
  formatValue,
}: {
  data: { name: string; value: number }[];
  fill?: string;
  formatValue?: (v: number) => string | number;
}) => {
  const format =
    formatValue ||
    ((v: number) =>
      Number(v)
        .toFixed(2)
        .replace(/\\.00$/, ""));
  if (data.length === 0)
    return <p className="text-sm text-slate-400">No hay datos</p>;
  return (
    <div style={{ height: Math.max(300, data.length * 35) }} className="mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, bottom: 5, left: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            width={280}
            tick={{ fontSize: 13, fill: "#475569", fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <RechartsTooltip
            cursor={{ fill: "#f1f5f9" }}
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            formatter={(value, name) => [format(typeof value === 'number' ? value : Number(value ?? 0)), name ?? "Frecuencia"]}
          />
          <Bar
            dataKey="value"
            fill={fill}
            radius={[0, 4, 4, 0]}
            barSize={20}
            isAnimationActive={true}
          >
            <LabelList
              dataKey="value"
              position="right"
              fill="#334155"
              fontSize={13}
              fontWeight={700}
              formatter={(v) => format(typeof v === 'number' ? v : Number(v ?? 0))}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const NivoHeatmapWrapper = ({
  matrix,
  rows,
  cols,
  getRowName,
  getColName,
  colors,
  legendTop,
  legendLeft,
  legendOffsetTop = -180,
  legendOffsetLeft = -270,
  marginTop = 220,
  marginLeft = 300,
}: {
  matrix: Record<string, Record<string, number>>;
  rows: string[];
  cols: string[];
  getRowName?: (v: string) => string;
  getColName?: (v: string) => string;
  colors?: unknown;
  legendTop?: string;
  legendLeft?: string;
  legendOffsetTop?: number;
  legendOffsetLeft?: number;
  marginTop?: number;
  marginLeft?: number;
}) => {
  if (!rows.length || !cols.length)
    return <p className="text-sm text-slate-400">No hay co-ocurrencias</p>;

  const heatmapData = rows.map((r: string) => {
    return {
      id: r,
      data: cols.map((c: string) => ({
        x: c,
        y: matrix[r]?.[c] || 0,
      })),
    };
  });

  const truncate = (str: string, max: number) =>
    str.length > max ? str.substring(0, max) + "..." : str;

  return (
    <div style={{ height: Math.max(700, rows.length * 45 + 200) }}>
      <ResponsiveHeatMap
        animate={true}
        data={heatmapData}
        margin={{ top: marginTop, right: 60, bottom: 60, left: marginLeft }}
        valueFormat=">-.0f"
        axisTop={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: legendTop || "",
          legendOffset: legendOffsetTop,
          legendPosition: "middle",
          format: (v: string) => truncate(getColName ? getColName(v) : v, 40),
        }}
        axisRight={null}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: legendLeft || "",
          legendPosition: "middle",
          legendOffset: legendOffsetLeft,
          format: (v: string) => truncate(getRowName ? getRowName(v) : v, 40),
        }}
        colors={
          (colors as ContinuousColorScaleConfig) || ({
            type: "sequential",
            scheme: "purples",
          } as ContinuousColorScaleConfig)
        }
        emptyColor="#f8fafc"
        borderWidth={1}
        borderColor={{ from: "color", modifiers: [["darker", 0.4]] }}
        labelTextColor={{ from: "color", modifiers: [["darker", 2]] }}
        hoverTarget="cell"
        tooltip={({ cell }) => (
          <BasicTooltip
            id={
              (getRowName ? getRowName(cell.serieId) : cell.serieId) +
              " - " +
              (getColName ? getColName(cell.data.x) : cell.data.x)
            }
            value={cell.value ?? 0}
            color={cell.color}
            enableChip={true}
          />
        )}
        theme={{
          axis: {
            ticks: {
              text: {
                fontSize: 13,
                maxWidth: 300,
                fill: "#475569",
              },
            },
            legend: {
              text: {
                fontSize: 15,
                fontWeight: "bold",
                fill: "#334155",
              },
            },
          },
        }}
      />
    </div>
  );
};

const formatGroupLabel = (rawId: string, getDetailsFn: (id: string) => { name: string } | null | undefined) => {
  try {
    let clean = rawId.trim();
    if (clean.startsWith("[") && clean.endsWith("]")) {
      clean = clean.replace(/'/g, '"');
      const arr = JSON.parse(clean);
      if (Array.isArray(arr)) {
        return arr
          .map((item: string) => {
            const name = getDetailsFn(item)?.name || item;
            return name.replace(/ [Rr]isk$/i, "");
          })
          .join(" + ");
      }
    }
  } catch {}
  const name = getDetailsFn(rawId)?.name || rawId;
  return name.replace(/ [Rr]isk$/i, "");
};

export const GlobalEdaDashboard = ({
  resultData,
  precalculatedStats,
}: Props) => {
  const {
    getMicroCauseDetails,
    getStrategyDetails,
    getCommunitySmellDetails,
    getRiskDetails,
  } = useOntology();

  // Si ya tenemos los precalculados desde el HistoryDB (casi instantáneo), los usamos
  // De lo contrario, los calculamos como fallback de emergencia (bloqueará el hilo principal)
  const stats = useMemo(() => {
    if (precalculatedStats) {
      console.log("[EDA] Usando estadisticas precalculadas desde HistoryDB!");
      return precalculatedStats;
    }
    console.warn(
      "[EDA] FALLBACK: Calculando estadisticas desde cero! Esto bloqueará la UI.",
    );
    return precalculateEdaStats(resultData);
  }, [precalculatedStats, resultData]);

  const globals = stats.globals;
  const microTopKeys = globals.topMicrocauses.map((m) => m.name);
  const microSmellEda = stats.microSmellEda;
  const risksTopKeys = globals.topRisks.map((r) => r.name);
  const smellRiskEda = stats.smellRiskEda;
  const criticalPaths = stats.criticalPaths;

  return (
    <div className="flex flex-col gap-8 pb-10 fade-in">
      <DashboardSection
        title="Frecuencias Globales del Dataset"
        icon={Layers}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wider text-center">
              Top 7 Microcausas
            </h3>
            <GlobalMetricBarChart
              data={globals.topMicrocauses.map((m) => ({
                name: getMicroCauseDetails(m.name)?.name || m.name,
                value: m.value,
              }))}
              fill="#4f46e5"
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wider text-center">
              Top 7 Riesgos
            </h3>
            <GlobalMetricBarChart
              formatValue={(v) => Math.round(Number(v))}
              data={globals.topRisks.map((r) => ({
                name: (getRiskDetails(r.name)?.name || r.name).replace(
                  / [Rr]isk$/i,
                  "",
                ),
                value: r.value,
              }))}
              fill="#f97316"
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wider text-center">
              Top 7 Estrategias Preventivas
            </h3>
            <GlobalMetricBarChart
              formatValue={(v) => Math.round(Number(v))}
              data={globals.topPrevStrategies.map((m) => ({
                name: getStrategyDetails(m.name)?.name || m.name,
                value: m.value,
              }))}
              fill="#10b981"
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wider text-center">
              Top 7 Estrategias Correctivas
            </h3>
            <GlobalMetricBarChart
              formatValue={(v) => Math.round(Number(v))}
              data={globals.topCorrStrategies.map((m) => ({
                name: getStrategyDetails(m.name)?.name || m.name,
                value: m.value,
              }))}
              fill="#3b82f6"
            />
          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Análisis de Co-ocurrencias: Microcausas vs Community Smells"
        icon={Users}
      >
        <div>
          <NivoHeatmapWrapper
            legendTop="Community Smells"
            legendLeft="Microcausas"
            marginTop={260}
            marginLeft={380}
            legendOffsetTop={-220}
            legendOffsetLeft={-340}
            matrix={microSmellEda.matrix}
            rows={microTopKeys}
            cols={microSmellEda.smellsList}
            getRowName={(r: string) =>
              formatGroupLabel(r, getMicroCauseDetails)
            }
            getColName={(c: string) =>
              formatGroupLabel(c, getCommunitySmellDetails)
            }
            colors={{ type: "sequential", scheme: "purples" }}
          />
        </div>
      </DashboardSection>

      <DashboardSection
        title="Análisis de Co-ocurrencias: Riesgos vs Community Smells"
        icon={Users}
      >
        <div>
          <NivoHeatmapWrapper
            legendTop="Riesgos"
            legendLeft="Community Smells"
            marginTop={260}
            marginLeft={380}
            legendOffsetTop={-220}
            legendOffsetLeft={-340}
            matrix={smellRiskEda.matrix}
            rows={smellRiskEda.smellsList}
            cols={risksTopKeys}
            getRowName={(r: string) =>
              formatGroupLabel(r, getCommunitySmellDetails)
            }
            getColName={(c: string) => formatGroupLabel(c, getRiskDetails)}
            colors={{ type: "sequential", scheme: "oranges" }}
          />
        </div>
      </DashboardSection>

      <DashboardSection
        title="Rutas Críticas de Propagación (Top 7)"
        icon={Route}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-xs">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">
                  Microcausa Originadora
                </th>
                <th className="px-4 py-3">➔ Community Smell</th>
                <th className="px-4 py-3">➔ Riesgo Latente</th>
                <th className="px-4 py-3 text-right rounded-tr-lg">
                  Frecuencia
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {criticalPaths.map((path, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-100 transition-colors even:bg-slate-50 odd:bg-white"
                >
                  <td className="px-4 py-3 font-medium text-indigo-700">
                    {getMicroCauseDetails(path.microcause)?.name ||
                      path.microcause}
                  </td>
                  <td className="px-4 py-3 text-purple-700">
                    {getCommunitySmellDetails(path.smell)?.name || path.smell}
                  </td>
                  <td className="px-4 py-3 text-orange-600">
                    {(getRiskDetails(path.risk)?.name || path.risk).replace(
                      / [Rr]isk$/i,
                      "",
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-700">
                    {path.count}
                  </td>
                </tr>
              ))}
              {criticalPaths.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    No se detectaron rutas críticas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Datos Estáticos del Modelo"
        icon={Database}
      >
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-bold text-slate-700 mb-4 border-b pb-2">
              Comparación de Modelos
            </h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-slate-700 text-slate-100 font-semibold uppercase text-xs tracking-wide">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Modelo</th>
                    <th className="px-4 py-3">Tipo de Entrada</th>
                    <th className="px-4 py-3 text-right">Accuracy</th>
                    <th className="px-4 py-3 text-right">Macro F1</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">
                      Weighted F1
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-indigo-700">
                      Random Forest
                    </td>
                    <td className="px-4 py-3 text-indigo-600 font-medium">
                      Características Estructuradas Adaptativas
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      0.9000
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      0.9017
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      0.9022
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      TF-IDF + Logistic Regression
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      Texto del Issue
                    </td>
                    <td className="px-4 py-3 text-right font-medium">0.5625</td>
                    <td className="px-4 py-3 text-right font-medium">0.5547</td>
                    <td className="px-4 py-3 text-right font-medium">0.5576</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      TF-IDF + Linear SVM
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      Texto del Issue
                    </td>
                    <td className="px-4 py-3 text-right font-medium">0.5375</td>
                    <td className="px-4 py-3 text-right font-medium">0.5108</td>
                    <td className="px-4 py-3 text-right font-medium">0.5142</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-700 mb-4 border-b pb-2">
              Validación Cruzada (Media ± Desviación)
            </h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-slate-700 text-slate-100 font-semibold uppercase text-xs tracking-wide">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Modelo</th>
                    <th className="px-4 py-3 text-right">Accuracy</th>
                    <th className="px-4 py-3 text-right">Macro F1</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">
                      Weighted F1
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-indigo-700">
                      Random Forest + Adaptive Features
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      0.9094 ± 0.0220
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      0.9094 ± 0.0220
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      0.9096 ± 0.0217
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      TF-IDF + Logistic Regression
                    </td>
                    <td className="px-4 py-3 text-right">0.6528 ± 0.0627</td>
                    <td className="px-4 py-3 text-right">0.6345 ± 0.0660</td>
                    <td className="px-4 py-3 text-right">0.6355 ± 0.0660</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      TF-IDF + Linear SVM
                    </td>
                    <td className="px-4 py-3 text-right">0.5887 ± 0.0577</td>
                    <td className="px-4 py-3 text-right">0.5558 ± 0.0552</td>
                    <td className="px-4 py-3 text-right">0.5577 ± 0.0560</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardSection>
    </div>
  );
};
