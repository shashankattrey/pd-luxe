// Utility to fetch and process Mutual Fund data
export const fetchFundDetails = async (schemeCode: string) => {
  const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
  const data = await response.json();

  const navHistory = data.data; // Array of { date, nav }
  const meta = data.meta;

  // Logic to calculate 1Y, 3Y returns
  const getReturn = (years: number) => {
    const today = new Date();
    const targetDate = new Date(today.setFullYear(today.getFullYear() - years));

    // Find the closest NAV entry to that date
    const historicalEntry = navHistory.find((entry: any) => {
      const entryDate = new Date(entry.date.split("-").reverse().join("-"));
      return entryDate <= targetDate;
    });

    if (!historicalEntry) return "N/A";

    const currentNav = parseFloat(navHistory[0].nav);
    const pastNav = parseFloat(historicalEntry.nav);

    // CAGR Formula: [(Current / Past) ^ (1/n)] - 1
    const cagr = (Math.pow(currentNav / pastNav, 1 / years) - 1) * 100;
    return cagr.toFixed(2);
  };

  return {
    meta,
    currentNav: navHistory[0].nav,
    lastUpdated: navHistory[0].date,
    returns: {
      oneYear: getReturn(1),
      threeYear: getReturn(3),
    },
    history: navHistory.slice(0, 30), // Last 30 days for the chart
  };
};
