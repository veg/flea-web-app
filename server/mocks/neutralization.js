module.exports = function(app) {
  var express = require('express');
  var neutralizationRouter = express.Router();
  var fs = require('fs');

  neutralizationRouter.get('/', function(req, res) {
    res.send(JSON.parse(fs.readFileSync(__dirname + '/mab.json', 'ascii')));
  });

  neutralizationRouter.post('/', function(req, res) {
    res.status(201).end();
  });

  neutralizationRouter.get('/:id', function(req, res) {
    res.send({
      'neutralization': {
        id: req.params.id
      }
    });
  });

  neutralizationRouter.put('/:id', function(req, res) {
    res.send({
      'neutralization': {
        id: req.params.id
      }
    });
  });

  neutralizationRouter.delete('/:id', function(req, res) {
    res.status(204).end();
  });

  app.use('/api/neutralization', neutralizationRouter);
};
