export interface MutualFund {
  id: string;
  fund_name: string;
  category:
    | "Large Cap"
    | "Mid Cap"
    | "Small Cap"
    | "Flexi Cap"
    | "Index Fund"
    | "Debt";
  issuer: string;
  nav: string;
  expense_ratio: string;
  three_year_return: string;
  five_year_return: string;
  rating: number; // 1-5
  risk_level: "Low" | "Moderate" | "High" | "Very High";
  aum: string; // Assets Under Management in Crores
  min_sip: string;
  is_active_sip: boolean;
  sip_amount?: number;
}

export const mutualFunds: MutualFund[] = [
  {
    id: "mf-001",
    fund_name: "Parag Parikh Flexi Cap Fund",
    category: "Flexi Cap",
    issuer: "PPFAS Mutual Fund",
    nav: "74.82",
    expense_ratio: "0.62",
    three_year_return: "22.4",
    five_year_return: "24.1",
    rating: 5,
    risk_level: "Very High",
    aum: "52,480",
    min_sip: "1,000",
    is_active_sip: true,
    sip_amount: 15000,
  },
  {
    id: "mf-002",
    fund_name: "Quant Small Cap Fund",
    category: "Small Cap",
    issuer: "Quant Money Managers",
    nav: "212.45",
    expense_ratio: "0.77",
    three_year_return: "38.2",
    five_year_return: "44.6",
    rating: 5,
    risk_level: "Very High",
    aum: "17,200",
    min_sip: "5,000",
    is_active_sip: true,
    sip_amount: 10000,
  },
  {
    id: "mf-003",
    fund_name: "HDFC Index S&P BSE Sensex",
    category: "Index Fund",
    issuer: "HDFC Mutual Fund",
    nav: "685.12",
    expense_ratio: "0.20",
    three_year_return: "14.8",
    five_year_return: "15.2",
    rating: 4,
    risk_level: "Moderate",
    aum: "12,100",
    min_sip: "500",
    is_active_sip: false,
  },
  {
    id: "mf-004",
    fund_name: "Mirae Asset Large Cap Fund",
    category: "Large Cap",
    issuer: "Mirae Asset Global",
    nav: "98.40",
    expense_ratio: "0.54",
    three_year_return: "16.1",
    five_year_return: "17.4",
    rating: 4,
    risk_level: "Moderate",
    aum: "35,600",
    min_sip: "1,000",
    is_active_sip: true,
    sip_amount: 20000,
  },
  {
    id: "mf-005",
    fund_name: "ICICI Prudential Bluechip Fund",
    category: "Large Cap",
    issuer: "ICICI Prudential",
    nav: "88.15",
    expense_ratio: "0.85",
    three_year_return: "19.5",
    five_year_return: "18.9",
    rating: 5,
    risk_level: "Moderate",
    aum: "42,000",
    min_sip: "100",
    is_active_sip: false,
  },
  {
    id: "mf-006",
    fund_name: "Axis Midcap Fund",
    category: "Mid Cap",
    issuer: "Axis Mutual Fund",
    nav: "82.44",
    expense_ratio: "0.48",
    three_year_return: "17.9",
    five_year_return: "20.2",
    rating: 3,
    risk_level: "Very High",
    aum: "25,300",
    min_sip: "500",
    is_active_sip: true,
    sip_amount: 5000,
  },
];
