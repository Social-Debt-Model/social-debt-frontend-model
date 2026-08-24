export const ontologyColorMap: Record<string, string> = {
  A: "bg-blue-100 text-blue-800 border-blue-200",
  B: "bg-purple-100 text-purple-800 border-purple-200",
  C: "bg-amber-100 text-amber-800 border-amber-200",
  D: "bg-orange-100 text-orange-800 border-orange-200",
  E: "bg-red-100 text-red-800 border-red-200",
  F: "bg-indigo-100 text-indigo-800 border-indigo-200",
  G: "bg-emerald-100 text-emerald-800 border-emerald-200",
  H: "bg-slate-100 text-slate-800 border-slate-200",
};

export const getMacroCauseColor = (code: string) => {
  return ontologyColorMap[code] || "bg-gray-100 text-gray-800 border-gray-200";
};
