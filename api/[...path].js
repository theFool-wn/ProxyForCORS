export default function handler(req, res) {
  const { path } = req.query;
  
  res.status(404).json({
    error: 'API Endpoint Not Found',
    message: `The API endpoint /api/${Array.isArray(path) ? path.join('/') : path} does not exist.`,
    availableEndpoints: [
      '/api/proxy',
    ],
    documentation: 'https://proxy.wangnan.net',
    status: 404
  });
}
