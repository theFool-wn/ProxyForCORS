export default function handler(req, res) {
  const fullPath = req.url || 'unknown';
  
  res.status(404).json({
    error: 'API Endpoint Not Found',
    message: `The API endpoint ${fullPath} does not exist.`,
    availableEndpoints: [
      '/api/proxy',
    ],
    documentation: 'https://proxy.wangnan.net',
    status: 404
  });
}
