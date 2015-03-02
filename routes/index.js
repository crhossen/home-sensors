var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Home Sensors' });
});

router.get('/graph/last/hour', function(req, res, next) {
  res.render('last_hour', { title: 'Home Sensors - Last Hour', page: 'index' });
});

router.get('/graph', function(req, res, next) {
  res.render('graph', { title: 'Home Sensor - Graph', page: 'graphs'});
});

module.exports = router;
