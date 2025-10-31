import { createProxyMiddleware } from 'http-proxy-middleware';

const ALLOW_LIST = [
    /^https?:\/\/iclass\.buaa\.edu\.cn/,
    /^https?:\/\/httpbin\.org\/,
];

const ALLOWED_DOMAINS = [
    'https://wangnan.net',
    'https://www.wangnan.net',
];

export default async function handler(req, res) {
    console.log('start');
    console.log(req.headers);
    console.log(req.headers.origin);
    
    const origin = req.headers.origin || '';
    const isOriginAllowed = ALLOWED_DOMAINS.some(domain => 
        origin.startsWith(domain)
    );
    console.log(isOriginAllowed)
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': isOriginAllowed ? origin : 'none',
        'Access-Control-Allow-Methods': 'GET,POST',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    };
    console.log(corsHeaders);
    console.log(req.method);
    if (req.method === 'OPTIONS') {
        return res.status(200).set(corsHeaders).end();
    }
    
    if (!isOriginAllowed) {
        return res.status(403).json({ error: 'Origin not allowed' });
    }

    console.log(req.query.url);
    const targetUrl = req.query.url;
    const targetMethod = req.query.method || 'GET';
    let requestParams = {};
    let targetHeaders = {};
    
    if (!targetUrl || !/^https?:\/\//.test(targetUrl)) {
        return res.status(400).json({ error: 'Missing or invalid url parameter' });
    }
    
    const allowed = ALLOW_LIST.some(reg => reg.test(targetUrl));
    console.log(allowed);
    if (!allowed) {
        return res.status(403).json({ error: 'Target not allowed' });
    }

    try {
        if (req.query.params) {
            requestParams = JSON.parse(req.query.params);
        }
        if (req.query.headers) {
            targetHeaders = JSON.parse(req.query.headers);
        }
    } catch (error) {
        return res.status(400).json({ error: 'Invalid params or headers format' });
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
        on: {
            proxyReq: (proxyReq, req) => {
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
            proxyRes: (proxyRes, req, res) => {
                Object.keys(corsHeaders).forEach(key => {
                    proxyRes.headers[key] = corsHeaders[key];
                });
            },
            error: (err, req, res) => {
                console.error('Proxy error:', err.message);
                res.status(500).json({ error: 'Proxy server error' });
            }
        }
    });
    
    proxyMiddleware(req, res);
    console.log(res);
}

export const config = {
    api: {
        bodyParser: false,
        externalResolver: true,
    },
};
