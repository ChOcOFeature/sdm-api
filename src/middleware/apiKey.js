const { env } = require('../config/env');

function getApiKeyValue(req) {
  const headerValue = req.get('x-api-key');
  if (headerValue) return headerValue;

  const authorization = req.get('authorization');
  if (!authorization) return null;

  if (authorization.startsWith('ApiKey ')) {
    return authorization.replace('ApiKey ', '').trim();
  }

  if (authorization.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '').trim();
  }

  return null;
}

function apiKeyMiddleware(req, res, next) {
  const providedKey = getApiKeyValue(req);
  const expectedKey = env.API_KEY;

  if (!expectedKey) {
    return res.status(500).json({
      message: 'API key is not configured on the server.',
    });
  }

  if (!providedKey || providedKey !== expectedKey) {
    return res.status(401).json({
      message: 'Unauthorized: invalid or missing API key.',
    });
  }

  next();
}

module.exports = apiKeyMiddleware;
