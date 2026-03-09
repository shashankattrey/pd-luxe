import cards from "./cards.json";

interface Card {
  card_name: string;
  issuer: string;
  search_tags?: string;
  card_tier?: string;
  [key: string]: any;
}

export default {
  async fetch(request: Request, env: any) {
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

      const matches = (cards as Card[])
        .filter(
          (c) =>
            (c.card_name || "").toLowerCase().includes(query) ||
            (c.issuer || "").toLowerCase().includes(query) ||
            (c.search_tags || "").toLowerCase().includes(query) ||
            (c.card_tier || "").toLowerCase().includes(query),
        )
        .slice(0, 15);

      const systemPrompt = `You are the PaisaDekho 2026 Intelligence Engine...`;

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
                content: `Query: ${message}. Pick the best cards.`,
              },
            ],
            temperature: 0,
            response_format: { type: "json_object" },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Groq API Error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      let replyData = [];
      try {
        replyData = JSON.parse(data.choices?.[0]?.message?.content ?? "[]");
      } catch {
        replyData = [];
      }

      return new Response(JSON.stringify({ reply: replyData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ reply: [], error: err.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};
