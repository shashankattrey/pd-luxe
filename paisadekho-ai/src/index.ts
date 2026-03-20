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
      const redirectUri = `${env.PROD_FRONTEND_URL}/auth/google/callback`;
      const state = crypto.randomUUID(); // CSRF protection

      const params = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        state,
        access_type: "offline", // allows refresh tokens
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
        const state = url.searchParams.get("state");

        // Exchange code for token
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code: code || "",
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `${env.PROD_FRONTEND_URL}/auth/google/callback`,
            grant_type: "authorization_code",
          }),
        });

        if (!tokenRes.ok) throw new Error("Token exchange failed");
        const tokenData = await tokenRes.json();

        // Fetch user info
        const userRes = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          },
        );
        const user = await userRes.json();

        // Store user in KV
        await env.PD_USER_VAULT.put(
          `user:${user.email}`,
          JSON.stringify({
            name: user.name,
            email: user.email,
            verifiedAt: new Date().toISOString(),
          }),
        );

        // Set session cookie and redirect
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${env.PROD_FRONTEND_URL}/dashboard`,
            "Set-Cookie": `pd_session=${user.email}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
          },
        });
      } catch (err) {
        console.error(err);
        return new Response("Unauthorized", { status: 401 });
      }
    }

    // --- Default response ---
    return new Response("PaisaDekho AI Node Active", { status: 200 });
  },
};
