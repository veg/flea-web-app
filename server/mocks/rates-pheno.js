module.exports = function(app) {
  var express = require('express');
  var ratesPhenoRouter = express.Router();
  var fs = require('fs');

  ratesPhenoRouter.get('/', function(req, res) {
    res.send(JSON.parse(fs.readFileSync(__dirname + '/rates_pheno.json', 'ascii')));
  });

  ratesPhenoRouter.post('/', function(req, res) {
    res.status(201).end();
  });

  ratesPhenoRouter.get('/:id', function(req, res) {
    res.send({
      'rates-pheno': {
        id: req.params.id
      }
    });
  });

  ratesPhenoRouter.put('/:id', function(req, res) {
    res.send({
      'rates-pheno': {
        id: req.params.id
      }
    });
  });

  ratesPhenoRouter.delete('/:id', function(req, res) {
    res.status(204).end();
  });

  app.use('/api/rates_pheno', ratesPhenoRouter);
};
