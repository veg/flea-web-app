module.exports = function(app) {
  var express = require('express');
  var ratesRouter = express.Router();
  var fs = require('fs');

  ratesRouter.get('/', function(req, res) {
    res.send(JSON.parse(fs.readFileSync(__dirname + '/rates.json', 'ascii')));
  });

  ratesRouter.post('/', function(req, res) {
    res.status(201).end();
  });

  ratesRouter.get('/:id', function(req, res) {
    res.send({
      'rates': {
        id: req.params.id
      }
    });
  });

  ratesRouter.put('/:id', function(req, res) {
    res.send({
      'rates': {
        id: req.params.id
      }
    });
  });

  ratesRouter.delete('/:id', function(req, res) {
    res.status(204).end();
  });

  app.use('/api/rates', ratesRouter);
};
