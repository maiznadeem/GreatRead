// Cloudflare Worker "greatread-domain-proxy" (service-worker syntax).
// Serves the public hostnames by proxying to Vercel (frontend) and Cloud Run (API + admin).
// Deploy: see README "Deployment". The Worker's custom domains are the hostnames below.

const CLIENT_HOST = "greatread.himaiz.com";
const API_HOST = "admin.greatread.himaiz.com";

const TARGETS = {
  [CLIENT_HOST]: "https://great-read-maiz.vercel.app",
  [API_HOST]: "https://great-read-image-1017210667439.us-central1.run.app",
};

// Old hostnames (before the move to *.greatread.himaiz.com) and where they now live.
const LEGACY_HOSTS = {
  "greatread.projects.himaiz.com": CLIENT_HOST,
  "admin.greatread.projects.himaiz.com": API_HOST,
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
  let hostname = url.hostname.toLowerCase();

  const newHost = LEGACY_HOSTS[hostname];
  if (newHost) {
    // Browsers navigating the old domains are moved permanently. API calls (XHR, Stripe, scripts)
    // on the old admin host keep being proxied, because CORS preflights cannot follow redirects.
    const isNavigation = ["GET", "HEAD"].includes(request.method) &&
      (request.headers.get("Accept") || "").includes("text/html");
    if (newHost === CLIENT_HOST || isNavigation) {
      return Response.redirect(`https://${newHost}${url.pathname}${url.search}`, 301);
    }
    hostname = newHost;
  }

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
