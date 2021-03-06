/**
 * Created by Chris on 2/17/2015.
 */

var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/home-sensors');
var SensorCollector = require('./SensorCollector');
var deepcopy = require('deepcopy');

var INTERVAL = 5000;

var valueFields = {
  "temps": "temp"
};

function logSensors() {
  var data = deepcopy(SensorCollector.getLatestData());

  for(var type in data) {
    for(var i in data[type]) {
      logSensor(data[type][i], type);
    }
  }
}

function logSensor(sensor, type) {
  var sensorCollection = db.get(type + '_' + sensor.id);
  var now = new Date();
  // if this sensor is stale get out of here
  if(now - sensor.date > INTERVAL) {
    console.log(type + '_' + sensor.id + " STALE!");
    return;
  }

  var nowHour = new Date(now);
  nowHour.setMinutes(0)
  nowHour.setSeconds(0);
  nowHour.setMilliseconds(0);

  //var currentMinute = now.
  var secondPath = 'values.' + now.getMinutes() + '.' + now.getSeconds();
  var minutePath = 'values.' + now.getMinutes();
  var minuteTotals = 'minutes.' + now.getMinutes();

  var updates = {'$set': {}, '$inc': {}};
  var sensorValue = sensor[valueFields[type] || 'value']


  updates['$set'][secondPath] = sensorValue;
  updates['$inc'][minuteTotals + '.num_samples'] = 1;
  updates['$inc'][minuteTotals + '.total_samples'] = sensorValue;
  updates['$inc']['num_samples'] = 1;
  updates['$inc']['total_samples'] = sensorValue;


  sensorCollection.update({hour: nowHour}, updates, {upsert: true}, function(err) {
    if(err) {
      console.error(err);
      throw err;
    }
  });
}

console.log("Starting " + INTERVAL/1000 + " second interval for storage");
setInterval(logSensors, INTERVAL);


function getSecondsDataBetween(type, id, startTime, endTime, callback) {
  getRawDataBetween(type, id, startTime, endTime, function(err, rawData) {
    if (err) {
      callback(err);
      return;
    }

    var data = [];
    //Iterate Each Hour
    rawData.forEach(function (doc) {
      //Iterate Each Minute
      for(var minute in doc.values) {
        if (doc.values.hasOwnProperty(minute)) {

          var minuteDT = new Date(doc.hour);
          minuteDT.setMinutes(Number(minute));

          //Iterate Each Second
          for(var second in doc.values[minute]) {
            if(doc.values[minute].hasOwnProperty(second)) {
              var secondDT = new Date(minuteDT);
              secondDT.setSeconds(Number(second));

              data.push({dateTime: secondDT, value: doc.values[minute][second]});
            }
          }
        }
      };
    });

    callback(null, data);

  });
}

function getMinuteDataBetween(type, id, startTime, endTime, callback) {
  if (endTime == null) {
    endTime = new Date();
  }

  var startHour = new Date(startTime);
  startHour.setMinutes(0, 0, 0);

  var endHour = new Date(endTime);
  endHour.setMinutes(0, 0, 0);

  var sensorCollection = db.get(type + '_' + id);



  sensorCollection.find({hour: { $gte: startHour, $lte: endHour } }, {sort: {hour: 1}, fields: { hour: 1, minutes: 1 } }, function(err, docs) {
    if(err) {
      callback(err);
      return;
    }

    if(docs.length === 0) {
      callback(null, null);
      return;
    }

    var data = [];
    docs.forEach(function (doc) {
      for(var minute in doc.minutes) {
        if(doc.minutes.hasOwnProperty(minute)) {
          var minuteDT = new Date(doc.hour);
          minuteDT.setMinutes(Number(minute));

          data.push({dateTime: minuteDT, value: (doc.minutes[minute].total_samples / doc.minutes[minute].num_samples )});
        }
      }
    });
    callback(null, data);
  });
}

function getHourDataBetween(type, id, startTime, endTime, callback) {
  if (endTime == null) {
    endTime = new Date();
  }

  var startHour = new Date(startTime);
  startHour.setMinutes(0, 0, 0);

  var endHour = new Date(endTime);
  endHour.setMinutes(0, 0, 0);

  var sensorCollection = db.get(type + '_' + id);



  sensorCollection.find({hour: { $gte: startHour, $lte: endHour } }, {sort: {hour: 1}, fields: { hour: 1, num_samples: 1, total_samples: 1 } }, function(err, docs) {
    if(err) {
      callback(err);
      return;
    }

    if(docs.length === 0) {
      callback(null, null);
      return;
    }

    var data = [];
    docs.forEach(function (doc) {
      data.push({dateTime: doc.hour, value: (doc.total_samples / doc.num_samples)});
    });
    callback(null, data);
  });
}


function getRawDataBetween(type, id, startTime, endTime, callback) {
  if (endTime == null) {
    endTime = new Date();
  }

  var startHour = new Date(startTime);
  startHour.setMinutes(0, 0, 0);

  var endHour = new Date(endTime);
  endHour.setMinutes(0, 0, 0);

  var sensorCollection = db.get(type + '_' + id);



  sensorCollection.find({hour: { $gte: startHour, $lte: endHour } }, {sort: {hour: 1} }, function(err, docs) {
    if(err) {
      callback(err);
      return;
    }

    if(docs.length === 0) {
      callback(null, null);
      return;
    }

    callback(null, docs);
  });
}



function getLastHourData(type, id, resolution, callback) {
  resolution = resolution || 'second';

  var now = new Date();

  var thisHour = new Date(now);
  thisHour.setMinutes(0,0,0);

  var prevHour = new Date(thisHour);
  prevHour.setHours(prevHour.getHours() - 1);

  var sensorCollection = db.get(type + '_' + id);

  sensorCollection.find({hour: { $in: [prevHour, thisHour] } }, {}, function(err, docs) {
    if(err) {
      callback(err);
    }

    if(docs.length === 0) {
      callback(null, null);
    }

    var data = [];
    //Iterate Each Hour
    docs.forEach(function (doc) {
      //Iterate Each Minute
      for(var minute in doc.values) {
        if (doc.values.hasOwnProperty(minute)) {

          var minuteDT = new Date(doc.hour);
          minuteDT.setMinutes(Number(minute));

          //Iterate Each Second
          for(var second in doc.values[minute]) {
            if(doc.values[minute].hasOwnProperty(second)) {
              var secondDT = new Date(minuteDT);
              secondDT.setSeconds(Number(second));

              data.push({dateTime: secondDT, value: doc.values[minute][second]});
            }
          }
        }
      };
    });

    callback(null, data);
  });

}


module.exports = {
  getLastHourData: getLastHourData,
  getRawDataBetween: getRawDataBetween,
  getSecondsDataBetween: getSecondsDataBetween,
  getMinuteDataBetween: getMinuteDataBetween,
  getHourDataBetween: getHourDataBetween
};
