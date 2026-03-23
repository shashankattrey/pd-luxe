// --- MANUAL TYPE DEFINITIONS ---
interface KVNamespace {
  get(
    key: string,
    options?: { type: "text" | "json" | "arrayBuffer" | "stream" },
  ): Promise<any>;
  put(
    key: string | ReadableStream | ArrayBuffer | FormData,
    value: string | ReadableStream | ArrayBuffer | FormData,
    options?: { expiration?: number; expirationTtl?: number; metadata?: any },
  ): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{
    keys: { name: string; metadata?: any }[];
    list_complete: boolean;
    cursor?: string;
  }>;
}

export interface Env {
  AI: any;
  PD_USER_VAULT: KVNamespace;
  TRUE_APP_KEY: string;
  PROD_FRONTEND_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  DB: any; // ✅ Add this so TypeScript doesn't complain
}

// --- WORKER CODE ---
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const requestOrigin = request.headers.get("Origin");
    const allowedOrigins = [
      "https://pd-luxe.vercel.app",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ];

    // Helper to apply CORS headers to all responses
    const corsOrigin = allowedOrigins.includes(requestOrigin || "")
      ? requestOrigin!
      : "https://pd-luxe.vercel.app";

    const corsHeaders = {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
    };
    // --- HANDLE CORS PREFLIGHT ---
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // --- TRUECALLER LOGIN ---
    if (request.method === "POST" && url.pathname === "/auth/callback") {
      try {
        const formData = await request.formData();
        const requestId = formData.get("requestId");

        const profileRes = await fetch(
          `https://api4.truecaller.com/v1/fetchProfile`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.TRUE_APP_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ requestId }),
          },
        );

        if (!profileRes.ok) throw new Error("Auth Failed");
        const profile: any = await profileRes.json();

        // Use phoneNumber as ID for Truecaller
        const userId = profile.phoneNumber;
        await env.PD_USER_VAULT.put(
          `user:${userId}`,
          JSON.stringify({
            name: `${profile.firstName} ${profile.lastName}`.trim(),
            verifiedAt: new Date().toISOString(),
          }),
        );

        return new Response(null, {
          status: 302,
          headers: {
            Location: `${env.PROD_FRONTEND_URL}/dashboard`,
            // FIXED: Omit Domain (let browser default to Worker domain) and use SameSite=None
            "Set-Cookie": `pd_session=${userId}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=2592000`,
            ...corsHeaders,
          },
        });
      } catch (err) {
        return new Response("Unauthorized", {
          status: 401,
          headers: corsHeaders,
        });
      }
    }

    // --- GOOGLE LOGIN: STEP 1: Redirect user to Google ---
    if (url.pathname === "/auth/google") {
      const workerCallbackUri = `${url.origin}/auth/google/callback`;
      const params = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: workerCallbackUri,
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline",
        prompt: "consent",
      });

      return Response.redirect(
        `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
        302,
      );
    }

    // --- GOOGLE LOGIN: STEP 2: Handle callback ---
    if (url.pathname === "/auth/google/callback") {
      try {
        const code = url.searchParams.get("code");
        const workerCallbackUri = `${url.origin}/auth/google/callback`;

        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code: code || "",
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: workerCallbackUri,
            grant_type: "authorization_code",
          }),
        });

        if (!tokenRes.ok) throw new Error("Token exchange failed");
        const tokenData: any = await tokenRes.json();

        const userRes = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          },
        );
        const user: any = await userRes.json();

        await env.PD_USER_VAULT.put(
          `user:${user.email}`,
          JSON.stringify({
            name: user.name,
            email: user.email,
            verifiedAt: new Date().toISOString(),
          }),
        );

        return new Response(null, {
          status: 302,
          headers: {
            Location: `${env.PROD_FRONTEND_URL}/dashboard`,
            // FIXED: Removed Domain=vercel.app and set SameSite=None
            "Set-Cookie": `pd_session=${user.email}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=2592000`,
            ...corsHeaders,
          },
        });
      } catch (err) {
        return new Response(`Unauthorized: ${err}`, {
          status: 401,
          headers: corsHeaders,
        });
      }
    }
    if (url.pathname === "/api/ipos" && request.method === "GET") {
      try {
        // 1. Query your specific table
        const { results } = await env.DB.prepare(
          "SELECT * FROM ipo_tracker WHERE status IN ('🔥 OPEN NOW', '⏳ Upcoming') ORDER BY open_date DESC",
        ).all();

        // 2. Map DB columns to Frontend keys
        const formattedIpos = results.map((ipo: any) => ({
          id: ipo.id.toString(),
          company: ipo.company_name, // Mapping company_name -> company
          status: ipo.status?.toLowerCase() || "upcoming",
          priceRange: ipo.price_range,
          lotSize: ipo.lot_size,
          opens: ipo.open_date,
          closes: ipo.close_date,
          issue: ipo.issue_size_cr ? `₹${ipo.issue_size_cr} Cr` : "TBD",
          listing: ipo.listing_at,
          // Visual defaults since these aren't in your DB table yet
          logo: ipo.company_name.substring(0, 2).toUpperCase(),
          accent: "#38bdf8",
          gradient: "from-sky-900 to-blue-950",
        }));

        return new Response(JSON.stringify(formattedIpos), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    // --- AUTH CHECK ENDPOINT ---
    if (url.pathname === "/auth/me") {
      try {
        const cookie = request.headers.get("cookie") || "";
        const match = cookie.match(/pd_session=([^;]+)/);

        if (!match) {
          return new Response(JSON.stringify({ error: "No session" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const userId = match[1];
        const user = await env.PD_USER_VAULT.get(`user:${userId}`, {
          type: "json",
        });

        if (!user) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify(user), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Server Error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response("PaisaDekho AI Node Active", {
      status: 200,
      headers: corsHeaders,
    });
  },
};
