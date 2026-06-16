const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(request: Request) {
  return proxyToApi(request);
}

export async function POST(request: Request) {
  return proxyToApi(request);
}

async function proxyToApi(request: Request) {
  const url = new URL(request.url);
  const target = `${API_URL}${url.pathname}${url.search}`;

  const res = await fetch(target, {
    method: request.method,
    headers: request.headers,
    body: request.method !== "GET" ? await request.text() : undefined,
  });

  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
}
