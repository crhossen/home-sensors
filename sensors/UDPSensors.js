var dgram = require('dgram'),
    EventEmitter = require('events').EventEmitter;

var sensorEmitter = new EventEmitter();


var socket = dgram.createSocket("udp4");
socket.bind(7677, function() {
  socket.addMembership('225.3.5.2');
  socket.setMulticastTTL(5);
  socket.setMulticastLoopback(false);
});
socket.on('message', receiveData);

function forwardToMulticast(sensorData) {
  sendData(sensorData);
}

function sendData(sensorData) {
  var message = new Buffer(JSON.stringify(sensorData));

  socket.send(message, 0, message.length, 7677, '225.3.5.2');
}

function receiveData(msg, rinfo) {
  try {
    var data = JSON.parse(msg.toString());

    for (var type in data) {
      for (var i in data[type]) {
        data[type][i].source = data[type][i].source + "@" + rinfo.address;
      }
    }

    sensorEmitter.emit('data', data);
  } catch(err) {
    sensorEmitter.emit('error', err);
  }
}

module.exports = {
  forward: forwardToMulticast,
  on: function (eventName, callback) {
    sensorEmitter.on(eventName, callback);
  }
};