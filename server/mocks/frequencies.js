module.exports = function(app) {
  var express = require('express');
  var frequenciesRouter = express.Router();
  var fs = require('fs');

  frequenciesRouter.get('/', function(req, res) {
    res.send(JSON.parse(fs.readFileSync(__dirname + '/frequencies.json', 'ascii')));
  });

  frequenciesRouter.post('/', function(req, res) {
    res.status(201).end();
  });

  frequenciesRouter.get('/:id', function(req, res) {
    res.send({
      'frequencies': {
        id: req.params.id
      }
    });
  });

  frequenciesRouter.put('/:id', function(req, res) {
    res.send({
      'frequencies': {
        id: req.params.id
      }
    });
  });

  frequenciesRouter.delete('/:id', function(req, res) {
    res.status(204).end();
  });

  app.use('/api/frequencies', frequenciesRouter);
};
