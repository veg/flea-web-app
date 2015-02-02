module.exports = function(app) {
  var express = require('express');
  var sequencesRouter = express.Router();
  var fs = require('fs');

  sequencesRouter.get('/', function(req, res) {
    res.send(JSON.parse(fs.readFileSync(__dirname + '/sequences.json', 'ascii')));
  });

  sequencesRouter.post('/', function(req, res) {
    res.status(201).end();
  });

  sequencesRouter.get('/:id', function(req, res) {
    res.send({
      'sequences': {
        id: req.params.id
      }
    });
  });

  sequencesRouter.put('/:id', function(req, res) {
    res.send({
      'sequences': {
        id: req.params.id
      }
    });
  });

  sequencesRouter.delete('/:id', function(req, res) {
    res.status(204).end();
  });

  app.use('/api/sequences', sequencesRouter);
};
