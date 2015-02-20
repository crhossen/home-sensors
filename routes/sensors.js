var express = require('express'),
    router = express.Router(),
    SensorCollector = require('../sensors/SensorCollector'),
    SensorStorage = require('../sensors/SensorStorage')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json(SensorCollector.getLatestData());
});

router.get('/:sensor_type', function(req, res, next) {
  var sensorData = SensorCollector.getLatestDataByType(req.params.sensor_type);
  if (sensorData === null) {
    res.status(404);
    res.json({ error: "No sensors found with type '" + req.params.sensor_type + "'." });
  } else {
    res.json(sensorData);
  }
});

router.get('/:sensor_type/:sensor_id/last/hour', function(req, res, next) {
  SensorStorage.getLastHourData(req.params.sensor_type, req.params.sensor_id, 'seconds', function(err, data) {
    if(err) {
      res.status(500);
      res.json({ error: err});
    } else if(data === null) {
      res.status(404);
      res.json({ error: "No sensor data found for this sensor in the last hour" });
    } else {
      res.json(data);
    }
  })
});

module.exports = router;
