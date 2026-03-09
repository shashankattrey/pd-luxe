import cards from "./cards.json";

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS")
      return new Response(null, { headers: corsHeaders });

    try {
      const { message } = await request.json();
      const query = (message || "").toLowerCase();

      // 1. BROAD SEARCH (Pre-filtering to save LLM context/tokens)
      const matches = cards
        .filter(
          (c) =>
            (c.card_name || "").toLowerCase().includes(query) ||
            (c.issuer || "").toLowerCase().includes(query) ||
            (c.search_tags || "").toLowerCase().includes(query) ||
            (c.card_tier || "").toLowerCase().includes(query),
        )
        .slice(0, 15);

      // 2. 2026 INTELLIGENCE PROMPT
      const systemPrompt = `You are the PaisaDekho 2026 Intelligence Engine. 
Analyze the provided credit card dataset and recommend the top matches.

CRITICAL 2026 RULES:
1. SPEND UNLOCKS: For ICICI/HDFC, mention spend-based lounge access (e.g., 25k/quarter).
2. HDFC LOUNGE: Must state "Requires Digital QR via SmartBuy" for Millennia/Regalia.
3. AXIS ATLAS: Explicitly mention the 1:2 transfer ratio for Air India.
4. CITI: Confirm all Citi cards are now Axis.
5. RANKING: Prioritize "Net Value" (Benefits minus Fees). 

STRICT JSON FORMAT (Return ONLY a JSON array, no preamble, no markdown):
[
  {
    "card_name": "Full Name",
    "benefit": "Net Benefit Calculation (e.g. ₹45k value)",
    "real_value_score": "4.8",
    "pros": ["bullet 1", "bullet 2", "bullet 3"],
    "alerts": "2026 specific rule or devaluation note",
    "issuer": "Bank Name"
  }
]

DATASET: ${JSON.stringify(matches)}`;

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `Query: ${message}. Pick the best cards from the dataset.`,
              },
            ],
            // Low temperature ensures strict JSON compliance
            temperature: 0,
            response_format: { type: "json_object" },
          }),
        },
      );

      const data = await response.json();
      let reply = data.choices[0].message.content;

      // Ensure the reply is a clean stringified JSON
      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ reply: "[]", error: err.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};
