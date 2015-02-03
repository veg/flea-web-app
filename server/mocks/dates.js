module.exports = function(app) {
  var express = require('express');
  var datesRouter = express.Router();
  var fs = require('fs');
  
  datesRouter.get('/', function(req, res) {
    res.send(JSON.parse(fs.readFileSync(__dirname + '/dates.json', 'ascii')));
  });

  datesRouter.post('/', function(req, res) {
    res.status(201).end();
  });

  datesRouter.get('/:id', function(req, res) {
    res.send({
      'dates': {
        id: req.params.id
      }
    });
  });

  datesRouter.put('/:id', function(req, res) {
    res.send({
      'dates': {
        id: req.params.id
      }
    });
  });

  datesRouter.delete('/:id', function(req, res) {
    res.status(204).end();
  });

  app.use('/api/dates', datesRouter);
};
