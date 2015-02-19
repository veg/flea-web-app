module.exports = function(app) {
  var express = require('express');
  var treesRouter = express.Router();
  var fs = require('fs');

  treesRouter.get('/', function(req, res) {
    res.send(JSON.parse(fs.readFileSync(__dirname + '/trees.json', 'ascii')));
  });

  treesRouter.post('/', function(req, res) {
    res.status(201).end();
  });

  treesRouter.get('/:id', function(req, res) {
    res.send({
      'trees': {
        id: req.params.id
      }
    });
  });

  treesRouter.put('/:id', function(req, res) {
    res.send({
      'trees': {
        id: req.params.id
      }
    });
  });

  treesRouter.delete('/:id', function(req, res) {
    res.status(204).end();
  });

  app.use('/api/trees', treesRouter);
};
