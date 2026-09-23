import ontologyData from "./frontend_ontology_dictionary.json";

export type MacroCauseCode = keyof typeof ontologyData.macro_causes;
export type MicroCauseId = keyof typeof ontologyData.micro_causes;

export const useOntology = () => {
  const getMacroCauseDescription = (code: string) => {
    return (
      ontologyData.macro_causes[code as MacroCauseCode] || "Unknown Macro Cause"
    );
  };

  const getMicroCauseDetails = (id: string) => {
    return getFlexibleDetails(
      (ontologyData as Record<string, unknown>).micro_causes as Record<
        string,
        { name: string; description: string | null }
      >,
      id,
    );
  };

  const getFlexibleDetails = (
    dict: Record<string, { name: string; description: string | null }>,
    id: string,
  ) => {
    if (!dict) return { name: id.replace(/_/g, " "), description: null };
    if (dict[id]) return dict[id];

    const lowerId = id.toLowerCase();
    const cleanId = lowerId.replace(/_/g, " ").replace(/-/g, " ");

    for (const key in dict) {
      const lowerKey = key.toLowerCase();
      const cleanKey = lowerKey.replace(/_/g, " ").replace(/-/g, " ");
      const dictNameClean = dict[key].name
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/-/g, " ");

      if (
        cleanKey === cleanId ||
        cleanKey.includes(cleanId) ||
        cleanId.includes(cleanKey)
      ) {
        return dict[key];
      }
      if (
        dictNameClean === cleanId ||
        dictNameClean.includes(cleanId) ||
        cleanId.includes(dictNameClean)
      ) {
        return dict[key];
      }

      const squashId = cleanId.replace(/[^a-z]/g, "");
      const squashKey = cleanKey.replace(/[^a-z]/g, "");
      const squashName = dictNameClean.replace(/[^a-z]/g, "");

      if (
        squashKey === squashId ||
        (squashId.length > 5 && squashKey.includes(squashId)) ||
        (squashKey.length > 5 && squashId.includes(squashKey))
      ) {
        return dict[key];
      }
      if (
        squashName === squashId ||
        (squashId.length > 5 && squashName.includes(squashId)) ||
        (squashName.length > 5 && squashId.includes(squashName))
      ) {
        return dict[key];
      }
    }
    return { name: id.replace(/_/g, " "), description: null };
  };

  const getStrategyDetails = (id: string) => {
    return getFlexibleDetails(
      (ontologyData as Record<string, unknown>).strategies as Record<
        string,
        { name: string; description: string | null }
      >,
      id,
    );
  };

  const getEffectDetails = (id: string) => {
    return getFlexibleDetails(
      (ontologyData as Record<string, unknown>).effects as Record<
        string,
        { name: string; description: string | null }
      >,
      id,
    );
  };

  const getCommunitySmellDetails = (id: string) => {
    return getFlexibleDetails(
      (ontologyData as Record<string, unknown>).community_smells as Record<
        string,
        { name: string; description: string | null }
      >,
      id,
    );
  };

  const getRiskDetails = (id: string) => {
    return getFlexibleDetails(
      (ontologyData as Record<string, unknown>).risks as Record<
        string,
        { name: string; description: string | null }
      >,
      id,
    );
  };

  const getIndicatorDetails = (id: string) => {
    return getFlexibleDetails(
      (ontologyData as Record<string, unknown>).indicators as Record<
        string,
        { name: string; description: string | null }
      >,
      id,
    );
  };

  const getMetricDetails = (id: string) => {
    return getFlexibleDetails(
      (ontologyData as Record<string, unknown>).metrics as Record<
        string,
        { name: string; description: string | null }
      >,
      id,
    );
  };

  const getMicrocauseTypeDetails = (id: string) => {
    return getFlexibleDetails(
      (ontologyData as Record<string, unknown>).microcause_types as Record<
        string,
        { name: string; description: string | null }
      >,
      id,
    );
  };

  const getGenericDetails = (id: string) => {
    return { name: id.replace(/_/g, " "), description: null };
  };

  return {
    getMacroCauseDescription,
    getMicroCauseDetails,
    getStrategyDetails,
    getEffectDetails,
    getCommunitySmellDetails,
    getRiskDetails,
    getIndicatorDetails,
    getMetricDetails,
    getMicrocauseTypeDetails,
    getGenericDetails,
  };
};
