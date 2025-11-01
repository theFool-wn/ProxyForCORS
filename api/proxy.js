import { createProxyMiddleware } from 'http-proxy-middleware';

const ALLOW_LIST = [
    /^https?:\/\/iclass\.buaa\.edu\.cn/,
    /^https?:\/\/httpbin\.org/,
];

const ALLOWED_DOMAINS = [
    'https://wangnan.net',
    'https://www.wangnan.net',
];

export default async function handler(req, res) {
    const origin = req.headers.origin || '';
    const isOriginAllowed = ALLOWED_DOMAINS.some(domain => 
        origin.startsWith(domain)
    );
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': isOriginAllowed ? origin : 'none',
        'Access-Control-Allow-Methods': 'GET,POST',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    };

    if (req.method === 'OPTIONS') {
        res.status(200);
        Object.keys(corsHeaders).forEach(key => {
            res.setHeader(key, corsHeaders[key]);
        });
        return res.end();
    }
    
    if (!isOriginAllowed) {
        res.status(403);
        Object.keys(corsHeaders).forEach(key => {
            res.setHeader(key, corsHeaders[key]);
        });
        return res.json({ error: 'Origin not allowed' });
    }

    const targetUrl = req.query.url;
    const targetMethod = req.query.method || 'GET';
    let requestParams = {};
    let targetHeaders = {};
    
    if (!targetUrl || !/^https?:\/\//.test(targetUrl)) {
        res.status(400);
        Object.keys(corsHeaders).forEach(key => {
            res.setHeader(key, corsHeaders[key]);
        });
        return res.json({ error: 'Missing or invalid url parameter' });
    }
    
    const allowed = ALLOW_LIST.some(reg => reg.test(targetUrl));
    if (!allowed) {
        res.status(403);
        Object.keys(corsHeaders).forEach(key => {
            res.setHeader(key, corsHeaders[key]);
        });
        return res.json({ error: 'Target not allowed' });
    }

    try {
        if (req.query.params) {
            requestParams = JSON.parse(req.query.params);
        }
        if (req.query.headers) {
            targetHeaders = JSON.parse(req.query.headers);
        }
    } catch (error) {
        res.status(400);
        Object.keys(corsHeaders).forEach(key => {
            res.setHeader(key, corsHeaders[key]);
        });
        return res.json({ error: 'Invalid params or headers format' });
    }
    
    let finalTargetUrl = targetUrl;
    if (targetMethod === 'GET' && Object.keys(requestParams).length > 0) {
        const urlObj = new URL(targetUrl);
        Object.keys(requestParams).forEach(key => {
            urlObj.searchParams.append(key, requestParams[key]);
        });
        finalTargetUrl = urlObj.toString();
    }
    
    const proxyMiddleware = createProxyMiddleware({
        target: finalTargetUrl,
        changeOrigin: true,
        method: targetMethod,
        pathRewrite: {
            '^/api/proxy': '',
        },
        onProxyReq: (proxyReq, req) => {
            Object.keys(targetHeaders).forEach(key => {
                if (key.toLowerCase() !== 'host') {
                    proxyReq.setHeader(key, targetHeaders[key]);
                }
            });
            if (targetMethod === 'POST' && Object.keys(requestParams).length > 0) {
                const bodyData = JSON.stringify(requestParams);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            proxyRes.headers['X-Proxy-By'] = 'Vercel-Proxy';
            proxyRes.headers['X-Proxy-Server'] = 'proxy.wangnan.net';
            Object.keys(corsHeaders).forEach(key => {
                proxyRes.headers[key] = corsHeaders[key];
            });
        },
        onError: (err, req, res) => {
            console.error('Proxy error:', err.message);
            res.status(500);
            res.headers['X-Proxy-By'] = 'Vercel-Proxy';
            res.headers['X-Proxy-Server'] = 'proxy.wangnan.net';
            Object.keys(corsHeaders).forEach(key => {
                res.setHeader(key, corsHeaders[key]);
            });
            res.json({ error: 'Proxy server error' });
        }
    });
    
    proxyMiddleware(req, res);
}

export const config = {
    api: {
        bodyParser: false,
        externalResolver: true,
    },
};
