export default function handler(req, res) {
  res.status(404).json({
    error: 'API Endpoint Not Found',
    message: `The API endpoint ${req.url} does not exist.`,
    availableEndpoints: [
      '/api/proxy',
    ],
    documentation: 'https://proxy.wangnan.net',
    status: 404
  });
}
