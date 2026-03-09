// Utility to fetch and process Mutual Fund data

interface NavEntry {
  date: string;
  nav: string;
}

interface FundMeta {
  scheme_name: string;
  fund_house: string;
}

interface MfApiResponse {
  meta: FundMeta;
  data: NavEntry[];
}

export const fetchFundDetails = async (schemeCode: number) => {
  const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
  const data: MfApiResponse = await response.json();

  const navHistory = data.data;
  const meta = data.meta;

  const getReturn = (years: number): number | null => {
    const today = new Date();

    const targetDate = new Date();
    targetDate.setFullYear(today.getFullYear() - years);

    const historicalEntry = navHistory.find((entry) => {
      const entryDate = new Date(entry.date.split("-").reverse().join("-"));
      return entryDate <= targetDate;
    });

    if (!historicalEntry) return null;

    const currentNav = parseFloat(navHistory[0].nav);
    const pastNav = parseFloat(historicalEntry.nav);

    const cagr = (Math.pow(currentNav / pastNav, 1 / years) - 1) * 100;

    return Number(cagr.toFixed(2));
  };

  return {
    meta,
    currentNav: parseFloat(navHistory[0].nav),
    lastUpdated: navHistory[0].date,
    returns: {
      oneYear: getReturn(1),
      threeYear: getReturn(3),
    },
    history: navHistory.slice(0, 30),
  };
};
