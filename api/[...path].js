export default function handler(req, res) {
  let userRequestedPath = 'unknown';
  
  if (req.url) {
    const pathWithoutQuery = req.url.split('?')[0];
    if (pathWithoutQuery.startsWith('/api/')) {
      userRequestedPath = pathWithoutQuery;
    } else {
      userRequestedPath = `/api${pathWithoutQuery}`;
    }
  }
  
  res.status(404).json({
    error: 'API Endpoint Not Found',
    message: `The API endpoint ${userRequestedPath} does not exist.`,
    availableEndpoints: [
      '/api/proxy',
    ],
    documentation: 'https://proxy.wangnan.net',
    status: 404
  });
}
