import { BatchResultData } from "../batch-classification/actions";

/**
 * Calculates global Top N distributions across the entire dataset.
 */
export const calculateGlobalDistributions = (data: BatchResultData) => {
  const { issues_metrics } = data;
  if (!issues_metrics) return { topMicrocauses: [], topRisks: [], topPrevStrategies: [], topCorrStrategies: [] };
  const issues = Object.values(issues_metrics);
  const comments = data.comments || [];

  const microcausesCount: Record<string, number> = {};
  const risksCount: Record<string, number> = {};
  const prevStrategiesCount: Record<string, number> = {};
  const corrStrategiesCount: Record<string, number> = {};

  issues.forEach((issue: any) => {
    if (issue.dominant_microcauses) {
      issue.dominant_microcauses.forEach(([mc, freq]: [string, number]) => {
        microcausesCount[mc] = (microcausesCount[mc] || 0) + freq;
      });
    }
    if (issue.dominant_risks) {
      issue.dominant_risks.forEach(([risk, freq]: [string, number]) => {
        risksCount[risk] = (risksCount[risk] || 0) + freq;
      });
    }
    if (issue.dominant_preventive_strategies) {
      issue.dominant_preventive_strategies.forEach(([strat, freq]: [string, number]) => {
        prevStrategiesCount[strat] = (prevStrategiesCount[strat] || 0) + freq;
      });
    }
    if (issue.dominant_corrective_strategies) {
      issue.dominant_corrective_strategies.forEach(([strat, freq]: [string, number]) => {
        corrStrategiesCount[strat] = (corrStrategiesCount[strat] || 0) + freq;
      });
    }
  });


  // If strategies were not found in issues, calculate from comments
  if (Object.keys(prevStrategiesCount).length === 0 || Object.keys(corrStrategiesCount).length === 0) {
    comments.forEach((comment: any) => {
      if (!comment.is_noise && comment.microcauses) {
        comment.microcauses.forEach((mc: any) => {
          if (Array.isArray(mc.preventive_strategies)) {
            mc.preventive_strategies.forEach((strat: string) => {
              prevStrategiesCount[strat] = (prevStrategiesCount[strat] || 0) + 1;
            });
          }
          if (Array.isArray(mc.corrective_strategies)) {
            mc.corrective_strategies.forEach((strat: string) => {
              corrStrategiesCount[strat] = (corrStrategiesCount[strat] || 0) + 1;
            });
          }
        });
      }
    });
  }

  const sortByValue = (obj: Record<string, number>, topN: number) => {
    return Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([name, value], index) => ({ name, value, index }));
  };

  return {
    topMicrocauses: sortByValue(microcausesCount, 15),
    topRisks: sortByValue(risksCount, 12),
    topPrevStrategies: sortByValue(prevStrategiesCount, 20),
    topCorrStrategies: sortByValue(corrStrategiesCount, 20),
  };
};

/**
 * Calculates cross-tabulation matrix between Microcauses and Community Smells.
 */
export const calculateMicrocauseSmellMatrix = (data: BatchResultData, topMicrocauses: string[]) => {
  const { issues_metrics } = data;
  if (!issues_metrics) return { matrix: {}, smellsList: [] };
  const issues = Object.values(issues_metrics);
  const comments = data.comments || [];
  
  const matrix: Record<string, Record<string, number>> = {};
  
  topMicrocauses.forEach(mc => {
    matrix[mc] = {};
  });

  const allSmellsSet = new Set<string>();

  issues.forEach((issue: any) => {
    const issueMicrocauses = issue.dominant_microcauses?.map((m: any) => m[0]) || [];
    const issueSmells = issue.dominant_community_smells?.map((s: any) => s[0]) || [];

    issueMicrocauses.forEach((mc: string) => {
      if (topMicrocauses.includes(mc)) {
        issueSmells.forEach((smell: string) => {
          matrix[mc][smell] = (matrix[mc][smell] || 0) + 1;
          allSmellsSet.add(smell);
        });
      }
    });
  });

  return {
    matrix,
    smellsList: Array.from(allSmellsSet)
  };
};

/**
 * Calculates cross-tabulation matrix between Community Smells and Risks.
 */
export const calculateSmellRiskMatrix = (data: BatchResultData, topRisks: string[]) => {
  const { issues_metrics } = data;
  if (!issues_metrics) return { matrix: {}, smellsList: [] };
  const issues = Object.values(issues_metrics);
  const comments = data.comments || [];
  
  const matrix: Record<string, Record<string, number>> = {};
  const allSmellsSet = new Set<string>();

  issues.forEach((issue: any) => {
    const issueSmells = issue.dominant_community_smells?.map((s: any) => s[0]) || [];
    const issueRisks = issue.dominant_risks?.map((r: any) => r[0]) || [];

    issueSmells.forEach((smell: string) => {
      if (!matrix[smell]) matrix[smell] = {};
      allSmellsSet.add(smell);
      
      issueRisks.forEach((risk: string) => {
        if (topRisks.includes(risk)) {
          matrix[smell][risk] = (matrix[smell][risk] || 0) + 1;
        }
      });
    });
  });

  allSmellsSet.forEach(smell => {
    topRisks.forEach(risk => {
      if (!matrix[smell][risk]) matrix[smell][risk] = 0;
    });
  });

  return {
    matrix,
    smellsList: Array.from(allSmellsSet)
  };
};

/**
 * Calculates the critical paths (Microcause -> Smell -> Risk)
 */
export const calculateCriticalPaths = (data: BatchResultData) => {
  const { issues_metrics } = data;
  if (!issues_metrics) return [];
  const issues = Object.values(issues_metrics);
  const comments = data.comments || [];
  
  const pathCounts: Record<string, { microcause: string, smell: string, risk: string, count: number }> = {};

  issues.forEach((issue: any) => {
    const mcs = issue.dominant_microcauses?.map((m: any) => m[0]) || [];
    const smells = issue.dominant_community_smells?.map((s: any) => s[0]) || [];
    const risks = issue.dominant_risks?.map((r: any) => r[0]) || [];

    mcs.forEach((mc: string) => {
      smells.forEach((smell: string) => {
        risks.forEach((risk: string) => {
          const key = `${mc}|${smell}|${risk}`;
          if (!pathCounts[key]) {
            pathCounts[key] = { microcause: mc, smell, risk, count: 0 };
          }
          pathCounts[key].count += 1;
        });
      });
    });
  });

  return Object.values(pathCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);
};

export type PrecalculatedEdaData = {
  globals: {
    topMicrocauses: { name: string; value: number; index: number }[];
    topRisks: { name: string; value: number; index: number }[];
    topPrevStrategies: { name: string; value: number; index: number }[];
    topCorrStrategies: { name: string; value: number; index: number }[];
  };
  microSmellEda: {
    matrix: Record<string, Record<string, number>>;
    smellsList: string[];
  };
  smellRiskEda: {
    matrix: Record<string, Record<string, number>>;
    smellsList: string[];
  };
  criticalPaths: {
    microcause: string;
    smell: string;
    risk: string;
    count: number;
  }[];
};

export const precalculateEdaStats = (data: BatchResultData): PrecalculatedEdaData => {
  const globals = calculateGlobalDistributions(data);
  const microTopKeys = globals.topMicrocauses.map((m) => m.name);
  const microSmellEda = calculateMicrocauseSmellMatrix(data, microTopKeys);
  const risksTopKeys = globals.topRisks.map((r) => r.name);
  const smellRiskEda = calculateSmellRiskMatrix(data, risksTopKeys);
  const criticalPaths = calculateCriticalPaths(data);
  
  return {
    globals,
    microSmellEda,
    smellRiskEda,
    criticalPaths
  };
};
