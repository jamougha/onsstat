
(function () {
  
  var CDIDHDR = 'cdids';
  var DATASETHDR = 'datasets';
  var COLUMNHDR = 'column';
  function cmpYears(y1, y2) {
    return parseInt(y1) - parseInt(y2);
  }

  function drawChart() {
    var chosen = $('#chosen').children(), 
        titles = ['Year'],
        dateMaps = [], // mappings from date to value for each graph
        allDates = {},
        dateList = [],
        data = undefined,
        table = [titles],
        i, j, datecolumn, date, value, row, chart;
    console.log("foo");
    for (i = 0; i < chosen.length; i++) {
      titles.push(chosen[i].innerHTML);
      dateMaps.push({});

      data = chosen[i]._data[0]; // [0] => by year
      console.log(data);
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

    dateList.sort(cmpYears);

    for (i = 0; i < dateList.length; i++) {
      date = dateList[i];
      row = [date];
      for (j = 0; j < dateMaps.length; j++) {
        row.push(dateMaps[j][date] || null);
      }
      table.push(row);
    }

    data = google.visualization.arrayToDataTable(table);
    console.log(table)
    options = {
      'title': '',
      'width': 800,
      'height': 450
    };

    chart = new google.visualization.LineChart(document.getElementById('chart_div'));
    chart.draw(data, options);
  }
  var liClickHandler =  function (node) {
    return function () {
      node.style.background = "#FFCC88";

      var selectedNode = node.cloneNode();
      selectedNode._node = node;

      $(node).fadeOut(1000);

      var selectList = $('#chosen');
      selectList.append(selectedNode);


      var response = $.get('/fetchcolumn/' + node.id, function () {
        var data = JSON.parse(response.responseText);
        selectedNode._data = data;
        drawChart();
      });
    };
  };
  

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

  function elementView(elem) {
    var li = document.createElement("li"),
        title = elem.name + " (" + elem.cdid + ", " + elem.column_id + ")";
    li.textContent = title;
    li.style.padding = "5px";
    li.style.borderBottom = 'dotted gray 1px';
    li.style.marginBottom = '5px';

    li.id = elem.column_id;
    li._element = elem;

    return li
  }

  var numsent = 0;
  function sendTokens(event) {
    var input = document.getElementById("token_input"),
        message = false;

    if (input.value === "") {
      $('#cdids').empty();
    }

    if (input.value.length > 1) {
      message = input.value;
    }

    asock.send(JSON.stringify([++numsent, message]));
  }

  var receiveCDIDs = (function () {
    var lastIdent = -1, 
        buffer = [];

    return function (data) {
      var head = $('#cdids');

      var message = JSON.parse(data.data);
      var ident = message[0];
      var contents = message[1];

      if (ident < numsent) {
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
    console.log("Found server");
    asock.onmessage = receiveCDIDs;
  };


}());