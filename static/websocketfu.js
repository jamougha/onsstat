
(function () {
  DEBUG = true;
  google.load('visualization', '1.0', {'packages': ['corechart']});

  var months = {};
  var m = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
           'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  for (var i = 0; i < m.length; i++) {
    months[m[i]] = i;
  }

  function cmpPeriods(t1, t2) {
    var y1 = parseInt(t1), y2 = parseInt(t2);
    if (y1 !== y2) {
      return y1 - y2;
    }
    
    // quarterly data - format '1997 Q3'
    if (t1.length === 7) {  
      var q1 = parseInt(t1.substring(6, 7)), 
          q2 = parseInt(t1.substring(6, 7));
      return q1 - q2;
    }
    
    if (t1.length !== 8) {
      throw Exception('invalid date format');
    }
    // monthly data - format '1997 JAN'
    var m1 = t1.substring(5, 8), 
        m2 = t1.substring(5, 8);
    return months[m1] - months[m2];
  }


  function Chart() {
    this.scale = 'linear';
    this.period = 'yearly';
    this.periods = {
      yearly: 0,
      quarterly: 1,
      monthly: 2
    };

    this.options = {
      'title': '',
      'width': 800,
      'height': 450,
      vAxis: { 
        logScale: false
      }
    };
  }

  Chart.prototype.draw = function () {
    var chosen = $('#chosen').children(), 
        titles = ['Year'],
        dateMaps = [], // mappings from date to value for each plot
        allDates = {},
        dateList = [],
        data = undefined,
        table = [titles],
        i, j, datecolumn, date, value, row, chart;

    for (i = 0; i < chosen.length; i++) {
      titles.push(chosen[i].innerHTML);
      dateMaps.push({});

      data = chosen[i]._data[this.periods[this.period]]; // [0] => by year
      for (j = 0; j < data.length; j++) {
        date = data[j][0];
        value = data[j][1];
        allDates[date] = true;
        try {
          dateMaps[i][date] = parseFloat(value);
        } catch (e) {
          dateMaps[i][date] = null;
        }
      }
    }

    for (date in allDates) {
      dateList.push(date);
    }
    dateList.sort(cmpPeriods);

    for (i = 0; i < dateList.length; i++) {
      date = dateList[i];
      row = [date];
      for (j = 0; j < dateMaps.length; j++) {
        row.push(dateMaps[j][date] || null);
      }
      table.push(row);
    }

    data = google.visualization.arrayToDataTable(table);
    this.options.vAxis.logScale = this.scale === 'logarithmic';

    chart = new google.visualization.LineChart(document.getElementById('chart_div'));
    chart.draw(data, this.options);
  };

  // init cretes the default view of the chart before the
  // user selects data to plot
  Chart.prototype.init = function(column) {
    var i, numeric = [];

    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Year');
    data.addColumn('number', 'Amount');

    for (i = 0; i < column.length; i++) {
      numeric[i] = [column[i][0], parseFloat(column[i][1])];
    }

    data.addRows(numeric);

    var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
    chart.draw(data, this.options);
  };

  Chart.prototype.setScale = function (scale) {
    if (DEBUG && scale !== 'logarithmic' && scale !== 'linear') {
      console.log('invalid chart scale ' + scale);
    }
    this.scale = scale;
  };

  Chart.prototype.setPeriod = function (period) {
    if (DEBUG && !(period in this.periods)) {
      console.log('error: invalid time period ' + period);
    }
    this.period = period;
  };

  var chart = new Chart();
  google.setOnLoadCallback(function (c) { chart.init(c); });



  /* cdid data is viewed as an unordered list. These functions
     create the list and the elements from the data and handle 
     the styling.
  */

  function styleElem(li) {
    li.style.padding = "5px";
    li.style.borderBottom = 'dotted gray 1px';
    li.style.marginBottom = '5px';
    li.style.background = 'white';
  }

  function elementView(elem) {
    var li = document.createElement("li"),
        title = elem.name + " [" + elem.cdid + "]";

    li.textContent = title;
    li.id = elem.column_id;
    
    styleElem(li);

    return li
  }

  function listView(buffer) {
    var ul = document.createElement('ul');
    ul.style.listStyle = 'None';
    ul.style.paddingLeft = '0px';
    ul.style.marginBottom = '0px';
    ul.style.paddingBottom = '0px';
    ul.style.paddingStart = '0px';
    ul.style.paddingEnd = '0px';
    var i;
    for (i = 0; i < buffer.length; i++) {
      $(ul).append(buffer[i]);
    }

    return ul;
  }

  /* when a cdid is plotted, a dom element to represent it is 
     created and inserted into a list; this handles the user
     removing the cdid from the plot.
  */
  function selectedLiClickHandler(node) {
    return function() {
      $(node._node).fadeIn(1000);
      styleElem(node._node);

      $(node).fadeOut(1000).delay(1000).remove();
      chart.draw();
    };
  }


  function liClickHandler(node) {
    return function () {
      node.style.background = "#FFCC88";

      var selectedNode = node.cloneNode();
      selectedNode._node = node;
      selectedNode.onclick = selectedLiClickHandler(selectedNode);
      $(node).fadeOut(1000);

      var selectList = $('#chosen');
      selectList.append(selectedNode);


      var response = $.get('/fetchcolumn/' + node.id, function () {
        var data = JSON.parse(response.responseText);
        selectedNode._data = data;
        chart.draw();
      });
    };
  }
  

  function sendTokens(event) {
    var input = document.getElementById("token_input"),
        message = false;
    if (!this.numsent) {
      this.numsent = 0;
    }
    if (input.value === "") {
      $('#cdids').empty();
    }

    if (input.value.length > 1) {
      message = input.value;
    }

    asock.send(JSON.stringify([++this.numsent, message]));
  }

  var receiveCDIDs = (function () {
    var lastIdent = -1, 
        buffer = [];

    return function (data) {
      var head = $('#cdids');

      var message = JSON.parse(data.data);
      var ident = message[0];
      var contents = message[1];

      if (ident < sendTokens.numsent) {
        buffer = [];
        return;
      }

      if (contents === 'end') {
        if (buffer) {
          var ul = listView(buffer);
          head.append(ul);
          buffer = [];
        }
        return;
      }

      for (var i = 0; i < contents.length; i++) {
        var li = elementView(contents[i])
        li.onclick = liClickHandler(li);
        buffer.push(li);
      }

      if (lastIdent !== ident) {
        head.empty();
        head.append(listView(buffer));
        lastIdent = ident;
      }
    };
  }());


  var asock = new WebSocket("ws://127.0.0.1:8000/tokenmatcher");

  asock.onopen = function (event) {
    var input = $("#token_input");
    input.on('input', sendTokens);
    asock.onmessage = receiveCDIDs;
  };

  function uiSelector(list, elem, setter) {
    return function () {
      elements = $(list).children();
      for (var i = 0; i < elements.length; i++) {
        elements[i].className = 'ui_elem';
      }
      elem.className = 'ui_elem_selected';
      setter(elem.id);
      chart.draw();
    }
  }

  function initUiList (list, callback) {
    var elements = list.children();
    for (var i = 0; i < elements.length; i++) {
      elements[i].onclick = uiSelector(list, elements[i], callback);
    }

  }
  $(document).ready( function () {
    initUiList($('#ui_time_period'), function (z) { chart.setPeriod(z); } );
    initUiList($('#ui_chart_scale'), function (z) { chart.setScale(z); });
  });

}());