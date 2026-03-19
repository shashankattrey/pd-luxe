// --- MANUAL TYPE DEFINITIONS (Bypassing macOS 12 limitations) ---
interface KVNamespace {
  get(
    key: string,
    options?: { type: "text" | "json" | "arrayBuffer" | "stream" },
  ): Promise<any>;
  put(
    key: string,
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
}

// --- YOUR WORKER CODE ---
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

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

    return new Response("PaisaDekho AI Node Active", { status: 200 });
  },
};
