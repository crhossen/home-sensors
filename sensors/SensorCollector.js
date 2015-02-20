var ArduinoSensors = require('./ArduinoSensors'),
    UDPSensors = require('./UDPSensors'),
    EventEmitter = require('events').EventEmitter;

var emitter = new EventEmitter();

var latestData = { };

function receiveData(data) {
  for(var type in data) {
    latestData[type] = data[type];
  }
  emitter.emit('data', data);
}

function getLatestData() {
  return latestData;
}

function getLatestDataByType(type) {
  if(latestData[type]) {
    return latestData[type];
  } else {
    return null;
  }
}

ArduinoSensors.on('data', receiveData);
UDPSensors.on('data', receiveData);

module.exports = {
  getLatestData: getLatestData,
  getLatestDataByType: getLatestDataByType,
  emitter: emitter
};