
(function () {
  DEBUG = ukstatSettings.debug;
  WEBSOCK_SERVER = ukstatSettings.wsServer + "/tokenmatcher";

  google.load('visualization', '1.0', {'packages': ['corechart']});

  var MONTHS = {
    'JAN': 0, 'FEB': 1, 'MAR': 2,
    'APR': 3, 'MAY': 4, 'JUN': 5, 
    'JUL': 6, 'AUG': 7, 'SEP': 8, 
    'OCT': 9, 'NOV': 11, 'DEC': 12
  };

  // ordering of matching date strings in three formats:
  // `1999`, `1999 Q3`,  `1999 FEB`
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
    return MONTHS[m1] - MONTHS[m2];
  }


  function Chart() {
    this.scale = 'linear';
    this.period = 'yearly';

    // indexes the JSON array of data returned when the user 
    // clicks on a cdid
    this.PERIODS = {
      yearly: 0,
      quarterly: 1,
      monthly: 2
    };

    // options for the google chart api
    this.options = {
      'title': '',
      'width': 800,
      'height': 450,
      vAxis: { 
        logScale: false
      }
    };

    // The colours of the lines on the chart. If we 
    // run out use black.
    this.colours = [
      '#3366cc', '#dc3912', '#ff9900',
      '#109618', '#990099', '#0099c6',
      '#dd4477', '#66aa00', '#b82e2e'
    ];
    this.colours.reverse();
    // Keep a reference copy of the order of the
    // colours so that the order they're used in
    // doesn't change 
    this.COLOURS = this.colours.slice(0);

    // The data to be plotted, and also its id and name
    this.chosen = [];
  }

  /* some support functions for the draw method */

  // extract all the dates from the table into an object
  function tableToDateset(table, period) {
    var dateSet = {};
    for (var i = 0; i < table.length; i++) {
      var data = table[i].data[period];
      for (var j = 0; j < data.length; j++) {
        dateSet[data[j][0]] = true;
      }
    }

    return dateSet;
  }

  // turn an array of (date, value) pairs into a map of { date: value }
  function toDateMap(column) {
    var dateMap = {};
    for (var i = 0; i < column.length; i++) {
      var date = column[i][0];
      var value = column[i][1];
      try {
        dateMap[date] = parseFloat(value);
      } catch (e) {
        dateMap[date] = null;
      }
    }

    return dateMap;
  }

  Chart.prototype.draw = function () {
    // Each column of data has three arrays for annual, monthly and quarterly 
    // data; find the index of the one we want
    var periodIdx = this.PERIODS[this.period];

    // extract all the dates for all columns in the data to be plotted,
    // then sort them to get the date-range of the x axis
    var dateSet = tableToDateset(this.chosen, periodIdx);
    var dateList = Object.keys(dateSet);
    dateList.sort(cmpPeriods);

    // turn each column of (date, value) pairs into an object 
    // of form { date: value, .. }. 
    var dateMaps = this.chosen.map(function (column) {
      return toDateMap(column.data[periodIdx]);
    });

    // gChart api expects the first row of our table to be a list of
    // the names of the columns
    var titles = ["Year"];
    for (i = 0; i < this.chosen.length; i++) {
      titles.push(this.chosen[i].name);
    }
    var table = [titles];

    dateList.map(function (date) {
      var row = [date];
      for (var j = 0; j < dateMaps.length; j++) {
        row.push(dateMaps[j][date] || null); // gChart will display gaps on nulls
      }
      table.push(row);
    });

    this.options.colors = this.chosen.map(function (line) {
      return line.colour;
    });

    var data = google.visualization.arrayToDataTable(table);
    this.options.vAxis.logScale = this.scale === 'logarithmic';

    var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
    chart.draw(data, this.options);
  };

  Chart.prototype.add = function (data, id, name) {
    if (DEBUG) {
      console.log(data);
    }

    for (var i = 0; i < this.chosen.length; i++) {
      if (this.chosen[i].id == id) {
        return;
      }
    }

    this.chosen.push({ 
      colour: this.colours.pop() || '#000000',
      name: name,
      id: id,
      data: data
    });

    this.draw();
  }

  Chart.prototype.freeColour = function (colour) {
    var COLOURS = this.COLOURS;
    if (colour != '#000000') {
      this.colours.push(colour);
      this.colours.sort(function (c1, c2) {
        return COLOURS.indexOf(c1) - COLOURS.indexOf(c2);
      });
    }
  };

  Chart.prototype.remove = function (id) {
    for (var i = 0; i < this.chosen.length; i++) {
      if (this.chosen[i].id === id) {
        var colour = this.chosen[i].colour;
        var COLOURS = this.COLOURS;
        this.freeColour(colour);
        this.chosen.splice(i, 1);
      }
    }
    this.draw();

    if (DEBUG) {
      console.log('remove from chart failed due to invalid id ' + id);
    }
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
    if (DEBUG && !(period in this.PERIODS)) {
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
    // Can't do styling with CSS because jQuery fadeout changes styling
    // so it needs to be reset when fading back in
    li.style.padding = "5px";
    li.style.borderBottom = 'dotted gray 1px';
    li.style.marginBottom = '10px';
    li.style.background = 'white';
  }

  function elementView(elem) {
    var li = document.createElement("li"),
        title = elem.name + " [" + elem.cdid + "]";

    li.textContent = title;
    li.id = elem.column_id;
    li.title = elem.datasets.join("\n");
    
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
     created and inserted into a list.
     This callback handles the user clicking that element by removing
     that cdid from the plot.
  */
  function selectedLiClickHandler(node) {
    return function() {
      $(node._node).fadeIn(1000);
      styleElem(node._node);

      $(node).fadeOut(1000).delay(1000).remove();
      chart.remove(node.id);
    };
  }

  /* Handle the user requesting a list element be plotted.
     Must be attached to each element of the list of cdids 
     as a click handler. Uses the REST api to retrieve the data.
  */
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
        chart.add(data, node.id, node.innerHTML);
      });
    };
  }
  
  /* take the tokens from an input box and send them to the server
     via websockets. Needs to be registered as a handler for input
     events on the input box.
  */
    // numsent is used by the server as a kind of response header.
    // If we receive a response with an out-of-date numsent it can
    // be discarded.
  var numsent = 0
  function sendTokens(event) {
    var input = document.getElementById("token_input"),
        message = false;
    if (DEBUG) {
      console.log('sending tokens');
    }

    if (input.value === "") {
      $('#cdids').empty();
    }

    if (input.value.length > 1) {
      message = input.value;
    }

    asock.send(JSON.stringify([++numsent, message]));
  }

  /* Utilities for receiveCDIDs 
     Could refactor this to OO-style
  */  
  function showBuffer(buffer) {
    var head = $('#cdids');
    head.empty();
    head.append(listView(buffer));
  }

  function addToBuffer(data, buffer) {
    data.map(function (elem) {
      var li = elementView(elem);
      li.onclick = liClickHandler(li);
      buffer.push(li);
    });
  }
  
  /* Callback for websocket responses from the server. 

     The response consists of a cdid, an id for the associated 
     data, the name of the cdid and a list of the names of the
     datasets where the data is found. A cdid may occur more than
     once if it has multiple distinct data associated with it.

     The data is rendered into an ordered list by the functions above.

     Unfortunately responses may have thousands of elements and 
     queries may take significant fractions of a second to process, so
     to achieve responsive live-search the strategy is:

     1. Only transfer ~50 elements at a time from the server.
     2. Generate the dom objects incrementally as the elements arrive.
     3. But only render the first 50 elements until all elements have arrived.
     4. If a new query is started before the old one is finished, the old 
        query is abandoned serverside, as is all unrendered clientside data.
  */
  var receiveCDIDs = (function () {
    var lastIdent = -1, 
        buffer = [];

    return function (data) {
      var message = JSON.parse(data.data);
      var ident = message[0];
      var contents = message[1];
      
      // ignore out-of-date messages
      if (ident < numsent) {
        return;
      }
      
      // if we've received all the data, render the buffer
      if (contents === 'end') {
        showBuffer(buffer);
        buffer = [];
        return;
      }
      
      // when we get the first message back from a query, dump accumulated
      // data from the buffer and render the new message to screen.
      if (lastIdent < ident) {
          buffer = [];
        addToBuffer(contents, buffer);
        showBuffer(buffer);
        lastIdent = ident;
        return;
      }

      // otherwise accumelate data from the query in the buffer 
      // to be rendered at a later time.
      addToBuffer(contents, buffer);
    };
  }());


  /* Setup and callbacks for the period and scale UI widgets 
  */
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

  /* Initialization on loading of the page */
  var asock;
  $(document).ready( function () {
    //$(document).tooltip();

    asock = new WebSocket(WEBSOCK_SERVER);
    asock.onclose = function(event) {
        console.log(event);
    }
    asock.onopen = function (event) {

      var input = document.getElementById("token_input");
      $(input).focus();
      if (DEBUG) {
        console.log('opened websocket');
        console.log(input);
      }
      input.oninput = sendTokens;
      asock.onmessage = receiveCDIDs;
    };

    initUiList($('#ui_time_period'), function (z) { chart.setPeriod(z); } );
    initUiList($('#ui_chart_scale'), function (z) { chart.setScale(z); });
  });

}());