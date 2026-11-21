// Cloudflare Worker on api.greatread.himaiz.com: the zone's WAF runs before it, then it forwards every request
// unchanged to the Cloud Run service, adding the shared secret the API requires and the visitor's address.
// Bodies stream through (Stripe webhooks keep their exact bytes) and WebSocket upgrades pass through.
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const headers = new Headers(request.headers);
        for (const name of ['host', 'x-origin-auth', 'x-client-ip', 'x-forwarded-host', 'x-forwarded-proto']) headers.delete(name);
        headers.set('x-origin-auth', env.ORIGIN_AUTH);
        headers.set('x-client-ip', request.headers.get('cf-connecting-ip') ?? '');
        headers.set('x-forwarded-host', url.host);
        headers.set('x-forwarded-proto', 'https');

        return fetch(new URL(url.pathname + url.search, env.ORIGIN), {
            method: request.method,
            headers,
            body: request.body,
            redirect: 'manual',
        });
    },
};
