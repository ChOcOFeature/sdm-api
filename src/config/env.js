const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  env: {
    PORT: Number(process.env.PORT || 3000),
    NODE_ENV: process.env.NODE_ENV || 'development',
    API_KEY: process.env.API_KEY || '',
    DATABASE_URL: process.env.DATABASE_URL || '',
    CORS_ORIGINS: (process.env.CORS_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean),
  },
};
