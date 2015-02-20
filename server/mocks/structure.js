module.exports = function(app) {
  var express = require('express');
  var structureRouter = express.Router();
  var fs = require('fs');

  structureRouter.get('/', function(req, res) {
    res.send(fs.readFileSync(__dirname + '/flatTrimer.pdb', 'ascii'));
  });

  structureRouter.post('/', function(req, res) {
    res.status(201).end();
  });

  structureRouter.get('/:id', function(req, res) {
    res.send({
      'structure': {
        id: req.params.id
      }
    });
  });

  structureRouter.put('/:id', function(req, res) {
    res.send({
      'structure': {
        id: req.params.id
      }
    });
  });

  structureRouter.delete('/:id', function(req, res) {
    res.status(204).end();
  });

  app.use('/api/structure', structureRouter);
};
