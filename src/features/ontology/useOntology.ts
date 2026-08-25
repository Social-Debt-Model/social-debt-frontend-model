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
    return (
      ontologyData.micro_causes[id as MicroCauseId] || {
        name: id,
        description: "Descripción no disponible.",
      }
    );
  };

  const getStrategyDetails = (id: string) => {
    const strategies =
      ((ontologyData as Record<string, unknown>).strategies as Record<
        string,
        { name: string; description: string | null }
      >) || {};
    return strategies[id] || { name: id, description: null };
  };

  const getEffectDetails = (id: string) => {
    const effects =
      ((ontologyData as Record<string, unknown>).effects as Record<
        string,
        { name: string; description: string | null }
      >) || {};
    return effects[id] || { name: id, description: null };
  };

  const getGenericDetails = (id: string) => {
    return { name: id.replace(/_/g, " "), description: null };
  };

  return {
    getMacroCauseDescription,
    getMicroCauseDetails,
    getStrategyDetails,
    getEffectDetails,
    getGenericDetails,
  };
};
