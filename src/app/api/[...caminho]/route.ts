import { API_URL, slugDoHost } from "@/lib/servidor";

export const dynamic = "force-dynamic";

// Ponte do navegador para a API: /api/<caminho> deste site vira /api/vitrine/<slug da loja>/<caminho>.
// Assim o navegador nunca fala com outra origem e a loja vem sempre do endereço acessado.
const PERMITIDOS = [/^recomendacoes$/, /^eventos$/, /^produtos\/[0-9a-f-]{36}\/parecidos$/];

async function repassar(req: Request, ctx: { params: Promise<{ caminho: string[] }> }) {
  const caminho = (await ctx.params).caminho.join("/");
  if (!PERMITIDOS.some((r) => r.test(caminho))) return Response.json({ erro: "Não encontrado." }, { status: 404 });

  const slug = slugDoHost(req.headers.get("host"));
  if (!slug) return Response.json({ erro: "Loja não encontrada." }, { status: 404 });

  const headers = new Headers();
  const tipo = req.headers.get("content-type");
  if (tipo) headers.set("content-type", tipo);
  const ip = req.headers.get("x-forwarded-for");
  if (ip) headers.set("x-forwarded-for", ip);

  try {
    const resp = await fetch(`${API_URL}/api/vitrine/${slug}/${caminho}`, {
      method: req.method,
      headers,
      body: req.method === "POST" ? await req.text() : undefined,
      cache: "no-store",
    });
    return new Response(resp.status === 204 ? null : resp.body, {
      status: resp.status,
      headers: { "content-type": resp.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return Response.json({ erro: "Servidor indisponível." }, { status: 503 });
  }
}

export { repassar as GET, repassar as POST };
