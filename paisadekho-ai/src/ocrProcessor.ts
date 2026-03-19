export async function runOCR(env: any, image: Uint8Array) {
  const result = await env.AI.run("@cf/microsoft/trocr-base-printed", {
    image: [...image],
  });

  return result.text || "";
}
