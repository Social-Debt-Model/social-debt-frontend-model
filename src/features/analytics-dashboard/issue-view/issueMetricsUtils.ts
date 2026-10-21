export const parseListString = (str: string): string[] => {
  if (!str) return [];
  const cleaned = str.replace(/[\[\]'"]/g, "").trim();
  if (cleaned.includes(",")) {
    return cleaned
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return cleaned ? [cleaned] : [];
};

export const flattenAndAggregateMetrics = (
  groupedMetrics?: [string, number][]
): [string, number][] => {
  if (!groupedMetrics || !Array.isArray(groupedMetrics)) return [];

  const individualCounts: Record<string, number> = {};

  groupedMetrics.forEach(([groupString, count]) => {
    const items = parseListString(groupString);
    items.forEach((item) => {
      if (item) {
        individualCounts[item] = (individualCounts[item] || 0) + count;
      }
    });
  });

  return Object.entries(individualCounts).sort((a, b) => b[1] - a[1]);
};
