import { useMemo } from "react";

export const useSipCalculator = (
  monthlyAmount: number,
  years: number,
  annualRate: number,
  inflationRate: number = 0,
  applyTax: boolean = false,
) => {
  return useMemo(() => {
    const r = annualRate / 12 / 100;
    const n = years * 12;

    // 1. Nominal Maturity Value
    const maturityValue =
      monthlyAmount * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const totalInvested = monthlyAmount * n;
    const grossGains = maturityValue - totalInvested;

    // 2. Tax Logic (2026 LTCG Rules: 12.5% on gains above 1.25L)
    let taxAmount = 0;
    if (applyTax && years >= 1) {
      const taxableGains = Math.max(0, grossGains - 125000);
      taxAmount = taxableGains * 0.125;
    }

    const postTaxValue = maturityValue - taxAmount;

    // 3. Inflation Adjustment (Applied to the final post-tax amount)
    const realValue = postTaxValue / Math.pow(1 + inflationRate / 100, years);

    return {
      invested: Math.round(totalInvested),
      nominalTotal: Math.round(maturityValue),
      taxPaid: Math.round(taxAmount),
      finalTakeHome: Math.round(realValue),
      totalGains: Math.round(grossGains),
    };
  }, [monthlyAmount, years, annualRate, inflationRate, applyTax]);
};
