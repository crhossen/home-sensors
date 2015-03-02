/**
 * Created by Chris on 3/1/2015.
 */
var sensorGraphs = [];
var parseDate = d3.time.format.iso.parse;

$(document).ready(function () {
  $.getJSON('/sensors', function(data, status, jqXHR) {
    for(var sensorType in data) {
      $.each(data[sensorType], function (i, sensor) {
        var newButton = $('<button id="' + sensorType + '_' + sensor.id +  '" class="btn btn-default active">' + sensor.name + '</button>');
        //newButton.appendTo('#sensors');

        sensorGraphs.push(new SensorGraph(sensorType, sensor.id, sensor.name));
      });
    }

    drawGraphs();
  });
});


function drawGraphs() {
  var height = sensorGraphs.length * 200,
      margin = {top: 30, right: 40, bottom: 30, left: 40},
      width = $('#graph').width() - margin.left - margin.right;

  // Adds the svg canvas
  var svg = d3.select("#graph")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)


  $.each(sensorGraphs, function(id, sensorGraph) {
    sensorGraph.drawGraph(200,width,svg,margin, id * 200);
  });

}


function SensorGraph(type, id, name) {
  this.type = type;
  this.id = id;
  this.name = name;
}

SensorGraph.prototype.drawGraph = function (height, width, svgParent, margin, ytransform) {
  this.loadData(function(err, data) {

    svg = svgParent.append("g")
          .attr("transform",
          "translate(" + margin.left + "," + (margin.top + ytransform) + ")");
    // Set the ranges
    var x = d3.time.scale().range([0, width]);
    var y = d3.scale.linear().range([height, 0]);
    // Define the axes
    var xAxis = d3.svg.axis().scale(x)
        .orient("bottom").ticks(d3.time.hour, 2).tickFormat(d3.time.format('%H'));
    var yAxis = d3.svg.axis().scale(y)
        .orient("left").ticks(5);
    var yAxisR = d3.svg.axis().scale(y)
        .orient("right").ticks(5);
    // Define the line
    var valueline = d3.svg.line()
        .x(function (d) {
          return x(d.dateTime);
        })
        .y(function (d) {
          return y(d.value);
        });

    // Scale the range of the data
    x.domain(d3.extent(data, function (d) {
      return d.dateTime;
    }));
    y.domain([d3.min(data, function (d) {
      return d.value;
    }) - 2, d3.max(data, function (d) {
      return d.value;
    }) + 2]);
    // Add the valueline path.
    svg.append("path")
        .attr("class", "line")
        .attr("d", valueline(data));
    svg.append('text')
        .attr("transform", "translate(3, 13)")
        .text(this.name);
    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
    // Add the Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    // Add the Y Axis right
    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + width + ", 0)")
        .call(yAxisR);

  }.bind(this));
};

SensorGraph.prototype.loadData = function (callback) {
  var now = new Date();
  var yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  d3.json("/sensors/" + this.type + "/" + this.id + "/history/" + yesterday.toISOString() + "/" + now.toISOString() + "/minute", function(err, data) {
    if(err) {
      callback(err);
      return;
    }

    data.forEach(function (d) {
      d.dateTime = parseDate(d.dateTime);

      if(this.type === 'temps') d.value = Math.round((d.value * (9/5) + 32) * 10) / 10;

    }.bind(this));

    callback(null, data);
  }.bind(this));
};



// Set the dimensions of the canvas / graph

// Parse the date / time

