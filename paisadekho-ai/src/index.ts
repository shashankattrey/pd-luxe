// --- MANUAL TYPE DEFINITIONS (Bypassing macOS 12 limitations) ---
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
}

// --- WORKER CODE ---
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

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

        await env.PD_USER_VAULT.put(
          `user:${profile.phoneNumber}`,
          JSON.stringify({
            name: `${profile.firstName} ${profile.lastName}`.trim(),
            verifiedAt: new Date().toISOString(),
          }),
        );

        return new Response(null, {
          status: 302,
          headers: {
            Location: `${env.PROD_FRONTEND_URL}/dashboard`,
            "Set-Cookie": `pd_session=${profile.phoneNumber}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
          },
        });
      } catch (err) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    // --- GOOGLE LOGIN: STEP 1: Redirect user to Google ---
    if (url.pathname === "/auth/google") {
      // Use the Worker's own URL for the callback, not Vercel.
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

        // Exchange code for token
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code: code || "",
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            // CRITICAL: This MUST match the URI used in Step 1 exactly
            redirect_uri: workerCallbackUri,
            grant_type: "authorization_code",
          }),
        });

        if (!tokenRes.ok) {
          const errorData = await tokenRes.text();
          console.error("Token Exchange Error:", errorData);
          throw new Error("Token exchange failed");
        }

        const tokenData: any = await tokenRes.json();

        // Fetch user info
        const userRes = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          },
        );
        const user: any = await userRes.json();

        // Store user in KV
        await env.PD_USER_VAULT.put(
          `user:${user.email}`,
          JSON.stringify({
            name: user.name,
            email: user.email,
            verifiedAt: new Date().toISOString(),
          }),
        );

        // FINALLY: Send them to Vercel (pd-luxe.vercel.app/dashboard)
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${env.PROD_FRONTEND_URL}/dashboard`,
            "Set-Cookie": `pd_session=${user.email}; Path=/; Domain=vercel.app; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
          },
        });
      } catch (err) {
        return new Response(`Unauthorized: ${err}`, { status: 401 });
      }
    }

    // --- inside your fetch() handler ---
    if (url.pathname === "/auth/me") {
      try {
        const cookie = request.headers.get("cookie") || "";
        const match = cookie.match(/pd_session=([^;]+)/);
        if (!match) return new Response("Unauthorized", { status: 401 });

        const userId = match[1]; // either email (Google) or phone (Truecaller)
        const user = await env.PD_USER_VAULT.get(`user:${userId}`, {
          type: "json",
        });

        if (!user) return new Response("Not found", { status: 404 });

        return new Response(JSON.stringify(user), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response("Error fetching user", { status: 500 });
      }
    }
    // --- Default response ---
    return new Response("PaisaDekho AI Node Active", { status: 200 });
  },
};
