import cardsData from "./cards.json";

/* -----------------------------
   1. DATA INTERFACES
------------------------------ */

export interface CreditCard {
  card_name: string;
  issuer: string;
  card_tier: string;

  joining_fee: number;
  annual_fee: number;

  retention_spend_req: number;
  is_ltf: string;

  base_reward_rate: number;
  point_value: number;

  instant_discount_eligible: string;

  amazon_benefit_pct: number;
  flipkart_benefit_pct: number;
  indigo_benefit_pct: number;

  swiggy_rate: number;
  zomato_rate: number;

  movie_effective_rate: number;
  movie_booking_channel: string;

  smartbuy_flight_pct: number;
  hotel_rate: number;

  airline_transfer_json: Record<string, string>;
  hotel_transfer_json: Record<string, string>;
  detailed_rewards_json: Record<string, string>;

  amazon_method: string;
  flipkart_method: string;
  indigo_method: string;

  [key: string]: any;
}

export interface CardAudit {
  netValue: number;
  yield: number;
  feeWaived: boolean;
  grossRewards: number;
}

/* -----------------------------
   2. BENEFIT DETECTION ENGINE
------------------------------ */

function calculateBenefitForQuery(card: CreditCard, query: string): number {
  const q = query.toLowerCase();

  if (q.includes("amazon")) return card.amazon_benefit_pct || 0;

  if (q.includes("flipkart")) return card.flipkart_benefit_pct || 0;

  if (q.includes("hotel") || q.includes("marriott"))
    return card.hotel_rate || 0;

  if (q.includes("flight") || q.includes("indigo") || q.includes("air india")) {
    return Math.max(
      card.indigo_benefit_pct || 0,
      card.smartbuy_flight_pct || 0,
    );
  }

  if (q.includes("zomato") || q.includes("swiggy") || q.includes("dining")) {
    return Math.max(card.zomato_rate || 0, card.swiggy_rate || 0);
  }

  if (q.includes("movie")) return card.movie_effective_rate || 0;

  return card.base_reward_rate || 0;
}

/* -----------------------------
   3. CARD SCORING ENGINE
------------------------------ */

function scoreCard(card: CreditCard, query: string, annualSpend: number) {
  const benefitPct = calculateBenefitForQuery(card, query);

  const feeWaived = annualSpend >= (card.retention_spend_req || 0);

  const isLTF = card.is_ltf === "True";

  let score = 0;

  // Reward strength
  score += benefitPct * 15;

  // Ultra tier boost
  if (card.card_tier === "Ultra") score += 25;

  // Fee logic
  if (isLTF) score += 40;
  else if (feeWaived) score += 20;

  // Transfer partner boost
  if (query.includes("transfer") || query.includes("miles")) {
    if (Object.keys(card.airline_transfer_json || {}).length > 0) score += 30;
  }

  return {
    ...card,
    calculatedBenefit: benefitPct,
    isFeeWaived: feeWaived,
    finalScore: score,
  };
}

/* -----------------------------
   4. CLOUDFLARE WORKER
------------------------------ */

export default {
  async fetch(request: Request, env: any) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const { message, annualSpend = 400000 } = await request.json();

      const query = (message || "").toLowerCase();

      /* -----------------------------
         CARD RANKING ENGINE
      ------------------------------ */

      const rankedCards = (cardsData as unknown as CreditCard[])
        .map((card) => scoreCard(card, query, annualSpend))
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, 8);

      /* -----------------------------
         AI SYSTEM PROMPT
      ------------------------------ */

      const systemPrompt = `
You are PaisaDekho's Credit Card Intelligence Engine (2026 Edition).

User Query: "${message}"
Annual Spend: ₹${annualSpend}

STRICT RULES:

1. Use 'calculatedBenefit' as the effective reward rate.
2. Calculate potential savings as:
   Annual Spend × Benefit Rate ÷ 100
3. Mention the correct spending method when available.
4. Mention if the annual fee will be waived.

Respond ONLY in JSON format.

{
 "recommendations":[
  {
   "name":"Card Name",
   "bank":"Bank",
   "benefit":"X% reward",
   "math":"Spend × Reward Rate",
   "method":"Best usage method",
   "fee_info":"Fee waived or paid"
  }
 ]
}
`;

      /* -----------------------------
         CALL GROQ AI
      ------------------------------ */

      const aiResponse = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            temperature: 0,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `Available cards:\n${JSON.stringify(rankedCards)}`,
              },
            ],
          }),
        },
      );

      const data = await aiResponse.json();

      const finalReply = JSON.parse(
        data?.choices?.[0]?.message?.content ?? "{}",
      );

      return new Response(JSON.stringify({ reply: finalReply }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    } catch (err: any) {
      return new Response(
        JSON.stringify({
          error: err.message || "Internal Error",
        }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  },
};
