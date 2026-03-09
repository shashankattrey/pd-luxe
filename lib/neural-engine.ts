export type IndustrySector =
  | "Fintech"
  | "Govt"
  | "IT"
  | "Manufacturing"
  | "FMCG"
  | "Medical";

export interface Neural100Data {
  // Q1: Capital Resilience (0-25)
  emergencyFundMonths: number; // 0-5 pts
  emiToIncomeRatio: number; // 0-5 pts
  insuranceStack: number; // 0-5 pts (Health + Life + Critical)
  assetLiquidity: number; // 0-5 pts (Cash vs Real Estate)
  savingsConsistency: number; // 0-5 pts

  // Q2: Psychological Hardware (0-25)
  lossAversionScore: number; // 0-5 pts (Gamble vs Sure Thing)
  crashReaction: number; // 0-5 pts (Buy/Hold/Sell)
  checkFrequency: number; // 0-5 pts (Daily = 1, Monthly = 5)
  experienceYears: number; // 0-5 pts
  decisionFramework: number; // 0-5 pts (Data-driven vs Social-proof)

  // Q3: Occupational Beta (0-25)
  sector: IndustrySector; // Cross-referenced for volatility
  bonusMarketCorrelation: number; // 0-5 pts
  skillScarcity: number; // 0-5 pts (How fast can you get a new job?)
  businessEquityExposure: number; // 0-5 pts
  sectorPortfolioOverlap: number; // 0-5 pts

  // Q4: Structural Horizon (0-25)
  yearsToMajorGoal: number; // 0-5 pts
  dependencyLoad: number; // 0-5 pts
  taxBracket: number; // 0-5 pts (30% bracket needs higher Alpha)
  inflationBuffer: number; // 0-5 pts
  liabilityFlexibility: number; // 0-5 pts (Fixed vs Variable costs)
}

export function computeNeural100(data: Neural100Data) {
  // Sector Volatility Multipliers for 2026
  const sectorRisk: Record<IndustrySector, number> = {
    Fintech: 1.5,
    IT: 1.3,
    Manufacturing: 1.1,
    FMCG: 0.8,
    Govt: 0.5,
    Medical: 0.7,
  };

  const q1 =
    data.emergencyFundMonths +
    data.emiToIncomeRatio +
    data.insuranceStack +
    data.assetLiquidity +
    data.savingsConsistency;
  const q2 =
    data.lossAversionScore +
    data.crashReaction +
    data.checkFrequency +
    data.experienceYears +
    data.decisionFramework;
  const q3 = 25 - sectorRisk[data.sector] * 5 + data.skillScarcity; // Lower points for high-risk jobs
  const q4 =
    data.yearsToMajorGoal + (5 - data.dependencyLoad) + data.taxBracket;

  const total = Math.min(100, q1 + q2 + q3 + q4);

  return {
    total,
    breakdown: { q1, q2, q3, q4 },
    riskLevel:
      total > 75
        ? "Aggressive Alpha"
        : total > 45
          ? "Strategic Growth"
          : "Capital Guardian",
    warning:
      data.sector === "Fintech" && total > 80
        ? "Sector Over-exposure: Your job and portfolio share the same risk DNA."
        : null,
  };
}
