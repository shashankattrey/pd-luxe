// lib/mfUtils.ts

export const getTopFiveDirectGrowth = (rawData, category) => {
  return rawData
    .filter((item) => {
      const name = item.schemeName.toLowerCase();
      const isCategory = name.includes(category.toLowerCase());
      const isDirect = name.includes("direct");
      const isGrowth = name.includes("growth");
      const isClean =
        !name.includes("regular") &&
        !name.includes("idcw") &&
        !name.includes("dividend");

      return isCategory && isDirect && isGrowth && isClean;
    })
    .slice(0, 5)
    .map((item) => ({
      name: item.schemeName,
      code: item.schemeCode,
      category: category,
    }));
};
