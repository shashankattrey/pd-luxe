export interface Neural100Model {
  // Quadrant 1: Objective Capacity (25 pts)
  financialCapacity: {
    liquidityRatio: number; // 0-5: Months of emergency fund
    debtToIncome: number; // 0-5: Lower is better
    insuranceCover: number; // 0-5: Health/Life/Critical
    savingsRate: number; // 0-5: Monthly surplus %
    netWorthStability: number; // 0-5: Fixed vs Volatile assets
  };

  // Quadrant 2: Psychological Tolerance (25 pts)
  behavioralDNA: {
    lossAversion: number; // 0-5: Prospect Theory Score
    volatilityResilience: number; // 0-5: Reaction to -20% drops
    regretAversion: number; // 0-5: Portfolio checking frequency
    decisionLogic: number; // 0-5: Rules-based vs Emotional
    experienceCycles: number; // 0-5: Number of market crashes lived through
  };

  // Quadrant 3: Occupational & Correlation Beta (25 pts)
  occupationalBeta: {
    industryCyclicality: number; // 0-5: Tech/Fintech (High) vs Govt (Low)
    incomeCorrelation: number; // 0-5: Does bonus depend on market?
    skillTransferability: number; // 0-5: Time to find a new job
    sectorOverlap: number; // 0-5: Do they invest in their own industry?
    incomeStability: number; // 0-5: Fixed Salary vs Variable/Commissions
  };

  // Quadrant 4: Liability & Horizon (25 pts)
  liabilityMatching: {
    shortTermNeeds: number; // 0-5: Cash needed in < 24 months
    longTermGoals: number; // 0-5: Retirement/Legacy runway
    dependencyLoad: number; // 0-5: Number of dependents/parents
    taxBracketImpact: number; // 0-5: High bracket needs more aggressive pre-tax alpha
    inflationSensitivity: number; // 0-5: Lifestyle vs Basket inflation
  };
}
