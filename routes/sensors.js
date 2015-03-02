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



router.get('/:sensor_type/:sensor_id/history/:start_datetime/:end_datetime/:resolution', function(req, res,next) {
  var startTime = Date.parse(req.params.start_datetime);
  if(isNaN(startTime)) {
    res.status(400);
    res.json({error: "Start time was not a valid date. Try an ISO DateTime String."});
    return;
  } else {
    startTime = new Date(req.params.start_datetime);
  }

  var endTime = Date.parse(req.params.end_datetime);
  if(isNaN(endTime)) {
    res.status(400);
    res.json({error: "End time was not a valid date. Try an ISO DateTime String."});
    return;
  } else {
    endTime = new Date(req.params.end_datetime);
  }

  var queryFn = null;
  switch (req.params.resolution) {
    case 'raw':
      queryFn = SensorStorage.getRawDataBetween;
      break;
    case 'second':
      queryFn = SensorStorage.getSecondsDataBetween;
      break;
    case 'minute':
      queryFn = SensorStorage.getMinuteDataBetween;
      break;
    case 'hour':
      queryFn = SensorStorage.getHourDataBetween;
      break;
    default:
      queryFn = function () {
        res.status(400);
        res.json({error: "Resolution of " + req.params.resolution + " is not valid. Try raw, second, minute, or hour."});
      };
  }

  queryFn(req.params.sensor_type, req.params.sensor_id, startTime, endTime, function (err, data) {
    if(err) {
      res.status(500);
      res.json({error: err.message});
    } else if(data === null) {
      res.status(404);
      res.json({ error: "No sensor data found for this sensor in the given time range. The sensor may not exist." });
    } else {
      res.json(data);
    }
  });
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
