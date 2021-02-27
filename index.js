const sqlite3 = require('sqlite3').verbose();
const logger = require('./src/lib/logger');
const buildSchemas = require('./src/schemas');
const app = require('./src/app');

const port = 8010;
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  buildSchemas(db);

  const server = app();

  server.listen(port, () => logger.info(`App started and listening on port ${port}`));
});
