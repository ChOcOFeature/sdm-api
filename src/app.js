const express = require('express');
const cors = require('cors');
const { env } = require('./config/env');
const apiKeyMiddleware = require('./middleware/apiKey');
const errorHandler = require('./middleware/errorHandler');

const concertsRouter = require('./routes/concerts');
const venuesRouter = require('./routes/venues');
const groupsRouter = require('./routes/groups');

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGINS.length ? env.CORS_ORIGINS : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization'],
  })
);

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'healthy' });
});

app.use('/api', apiKeyMiddleware);
app.use('/api/concerts', concertsRouter);
app.use('/api/venues', venuesRouter);
app.use('/api/groups', groupsRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use(errorHandler);

module.exports = app;
