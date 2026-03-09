// lib/mf-utils.ts

interface Fund {
  name: string;
  code: number;
  category?: string;
}

export const getTopFiveDirectGrowth = (rawData: Fund[], category: string) => {
  return rawData
    .filter((item: Fund) => {
      const name = item.name.toLowerCase();

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
    .map((item: Fund) => ({
      name: item.name,
      code: item.code,
      category,
    }));
};
