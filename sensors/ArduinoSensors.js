var sp = require('serialport'),
    UDPSensors = require('./UDPSensors');
    EventEmitter = require('events').EventEmitter;

var sensorEmitter = new EventEmitter();

var latestData = {
  status: "Setting up."
};

var tempNames = {
  "2236144000A7": "Indoor",
  "287A5B3A40061": "Outdoor"
};

sp.list(function(err, ports) {
  if(err) {
    console.error(err);
    latestData.error(err.message);
    return;
  }

  var foundArduino = false;
  ports.forEach(function(port) {
    if(!foundArduino && port.manufacturer === 'FTDI') {
      foundArduino = true;
      console.log('ArduinoSensor: Arduino found.');
      setUpPort(port.comName);
    }
  });

  if(!foundArduino) {
    latestData.error = "Arduino not found.";
    latestData.status = 'Error';
    console.error('ArduinoSensor: Arduino not found.');
  }
});

function setUpPort(portName) {
  var arduinoPort = new sp.SerialPort(portName, {
    baudrate: 9600,
    parser: sp.parsers.readline("\n")
  });

  arduinoPort.on('open', function() {
    console.log('ArduinoSensor: Opened port!');

    arduinoPort.on('data', function(data) {
      var re = /\0/g;
      var str = data.toString().replace(re, "");
      dataObj = JSON.parse(str);
      
      if (dataObj.temps) {
        dataObj.temps.forEach(function(tempSensor) {
          tempSensor.name = tempNames[tempSensor.id] || tempSensor.id;
          tempSensor.date = new Date();
          tempSensor.source = 'arduino';
        });
      }

      for(var sensorTypes in dataObj) {
        latestData[sensorTypes] = dataObj[sensorTypes];
      }

      sensorEmitter.emit('data', {temps: latestData.temps});

      UDPSensors.forward({temps: latestData.temps});
    });

  });
}

function getLatestData() {
  return latestData;
}

module.exports = {
  getLatestData: getLatestData,
  on: function (eventName, callback) {
    sensorEmitter.on(eventName, callback);
  }
};
