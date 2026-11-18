// Cloudflare Worker "greatread-domain-proxy" (service-worker syntax).
// Serves the public hostnames by proxying to Vercel (frontend) and Cloud Run (API + admin).
// Deploy: see README "Deployment". The Worker's custom domains are the hostnames below.
// Secret binding PROXY_SECRET (global in service-worker syntax) must match the server's PROXY_SECRET.

const CLIENT_HOST = "greatread.himaiz.com";
const API_HOST = "admin.greatread.himaiz.com";

const TARGETS = {
  [CLIENT_HOST]: "https://great-read-maiz.vercel.app",
  [API_HOST]: "https://great-read-image-1017210667439.us-central1.run.app",
};

const ALLOWED_API_ORIGINS = new Set([
  `https://${CLIENT_HOST}`,
  "https://great-read-maiz.vercel.app",
  "https://great-read-dev.vercel.app",
  "http://localhost:5173",
]);

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const hostname = url.hostname.toLowerCase();

  const targetOrigin = TARGETS[hostname];
  if (!targetOrigin) {
    return new Response("Unknown Great Read hostname", { status: 404 });
  }

  const isApi = hostname === API_HOST;
  if (isApi && request.method === "OPTIONS") {
    return withApiCors(new Response(null, { status: 204 }), request);
  }

  const upstreamUrl = new URL(targetOrigin);
  upstreamUrl.pathname = url.pathname;
  upstreamUrl.search = url.search;

  const upstreamRequest = new Request(upstreamUrl.toString(), request);
  upstreamRequest.headers.set("Host", upstreamUrl.hostname);
  upstreamRequest.headers.set("X-Forwarded-Host", hostname);
  upstreamRequest.headers.set("X-Forwarded-Proto", url.protocol.replace(":", ""));
  if (isApi) {
    // Proves the request came through this Worker; the server rejects anything without it.
    upstreamRequest.headers.set("X-Proxy-Secret", PROXY_SECRET);
    upstreamRequest.headers.set("X-Client-IP", request.headers.get("CF-Connecting-IP") || "");
  }

  const upstreamResponse = await fetch(upstreamRequest, { redirect: "manual" });
  const response = new Response(upstreamResponse.body, upstreamResponse);

  if (isApi) {
    return withApiCors(response, request);
  }

  response.headers.delete("X-Robots-Tag");
  return response;
}

function withApiCors(response, request) {
  const origin = request.headers.get("Origin");
  if (origin && ALLOWED_API_ORIGINS.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.append("Vary", "Origin");
  }
  response.headers.set("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    request.headers.get("Access-Control-Request-Headers") || "Authorization,Content-Type"
  );
  return response;
}
