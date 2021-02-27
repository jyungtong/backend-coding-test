const express = require('express');
const bodyParser = require('body-parser');
const create = require('./controllers/create');
const list = require('./controllers/list');
const get = require('./controllers/get');

const app = express();
const jsonParser = bodyParser.json();

module.exports = (db) => {
  app.get('/health', (req, res) => res.send('Healthy'));

  app.post('/rides', jsonParser, create(db));

  app.get('/rides', list(db));

  app.get('/rides/:id', get(db));

  return app;
};
