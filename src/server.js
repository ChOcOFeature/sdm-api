const app = require('./app');
const { env } = require('./config/env');

const port = env.PORT;

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
