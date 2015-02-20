$(document).ready(function() {
  var tempUnit = 'C';
  var latestData = {};
  var muricaClip = $('#murica-clip').get(0);
  var tempUnits = {
    'C': {
      formatter: function (cTemp) {
        return (Math.round(cTemp * 10) / 10) + '\xB0C';
      }
    },
    'F': {
      formatter: function (cTemp) {
        return (Math.round((cTemp * (9/5) + 32) * 10) / 10) + '\xB0F';
      },
      onChangeTo: function () {
        muricaClip.play();
        $('body').addClass('murica');
      },
      onChangeFrom: function () {
        $('body').removeClass('murica');
      }
    },
    'K': {
      formatter: function (cTemp) {
        return (Math.round((cTemp + 273.15) * 10) / 10) + 'K';
      }
    }
  }

  function updateSensors() {
    $.getJSON('/sensors', function(data, status, jqXHR) {
      console.log(data);
      latestData = data;
      updateSensorBlocks(data);


      setTimeout(updateSensors, 8000);
    });
  }


  function updateSensorBlocks(sensorData, noFlash) {
    if(sensorData.temps) {
      $.each(sensorData.temps, function (index, temp) {
        var existingBlock = $('#' + temp.id);
        if(existingBlock.length) {
          if(noFlash === true) {
            updateTempBlock(existingBlock, temp)
          } else {
            flashAndUpdateBlock(existingBlock, updateTempBlock, temp);
          }
        } else {
          createTempBlock(temp);
        }

      });
    }
  }

  function createTempBlock(temp) {
    var newBlock = $('#tempTemplate').first().clone();
    newBlock.find('.name').text(temp.name);
    newBlock.find('.temp').text(temp.temp);

    updateTempBlock(newBlock, temp);

    newBlock.removeClass('hide');
    newBlock.attr('id', temp.id);

    $('#sensors').append(newBlock);
  }

  function updateTempBlock(block, temp) {
    block.find('.name').text(temp.name);
    block.find('.temp').text(tempUnits[tempUnit].formatter(temp.temp));
  }

  function flashAndUpdateBlock(block, updateFn, sensor) {
    block.find('h1').animate({
      color: '#2A2'
    }, 100, null, function() {
      updateFn(block, sensor);
      $(this).animate({
        color: '#000'
      }, 1000)
    });
  }

  $('.temp-unit-btn').click(function () {
    $('.temp-unit-btn').removeClass('active');
    $(this).addClass('active');

    if(tempUnits[tempUnit].onChangeFrom) {
      tempUnits[tempUnit].onChangeFrom();
    }

    tempUnit = $(this).val();
    updateSensorBlocks(latestData, true);

    if(tempUnits[tempUnit].onChangeTo) {
      tempUnits[tempUnit].onChangeTo();
    }
  });

  updateSensors();
});

