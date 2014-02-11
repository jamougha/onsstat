
// TODO refactor in to mvc
(function () {
  
  var CDIDHDR = 'cdids';
  var DATASETHDR = 'datasets';
  var COLUMNHDR = 'column';

  var asock = new WebSocket("ws://127.0.0.1:8000/tokenmatcher");

  asock.onopen = function (event) {
    var input = document.getElementById("token_input");
    input.oninput = sendTokens;
    console.log("Found server");
    asock.onmessage = receiveCDIDs
  };

  function emptyElement(id) {
    var head = document.getElementById(id);
    while (head.firstChild) {
      head.removeChild(head.firstChild);
    }
    return head;
  }

  var numsent = 0;
  function sendTokens(event) {

    var input = document.getElementById("token_input");
    if (input.value === "") {
      emptyElement(CDIDHDR);
    }
    if (input.value.length > 1) {
      var message = input.value;
      asock.send(JSON.stringify([numsent++, message]));
    } else {
      asock.send([numsent++, ""])
    }
  }

  function liClickHandler(header) {
    return (function (currentNode, lastbg) {
      return function (node) {
        function doClick() {
          if (currentNode !== null) {
            currentNode.style.background = lastbg;
          }
          lastbg = node.style.background;
          node.style.background = "#FFCC88";
          asock.send(JSON.stringify({
            request: header,
            data: node.id
          }));
          currentNode = node;
        }
        return doClick;
      };
    }(null, null));
  }
  function listView(data, handler, interpret) {
    var colours = ["#FFFFFF", "#DDEEFF"];
    var i, elem, li;

    var lis = [];
    for (i = 0; i < data.length; i++) {
      elem = interpret(data[i]);
      li = document.createElement("li");
      li.style.padding = "5px";
      li.textContent =  elem.title;
      li.style.background = colours[i % 2];
      li.id = elem.id;
      li.onclick = handler(li);
      lis.push(li);
    }

    return lis;
  }
  var lastIdent = -1;
  function receiveCDIDs(data) {
    // console.log((new Date() - timing_data.timesent[timing_data.numrecv++])/1000);
    // console.log(new Date() - lastrecv);

    // console.log(data);
    var message = JSON.parse(data.data);

    var ident = message[0];
    var contents = message[1];
    var head = document.getElementById(CDIDHDR);
    if (lastIdent != ident) {
      while (head.firstChild) {
        head.removeChild(head.firstChild);
      }
      lastIdent = ident;
    }

    var cdidsView = listView(contents, liClickHandler(DATASETHDR),
      function (elem) {
        return {
          title: elem.name + " (" + elem.cdid + ", " + elem.column_id + ")",
          id: elem.column_id
        };
      });

    var i = 0;
    for (; i < cdidsView.length; i++) {
      head.appendChild(cdidsView[i]);
    }
  }

  function receiveDatasets(data) {
    var months = {
      "January": 12,
      "February": 11,
      "March": 10,
      "April": 9,
      "May": 8,
      "June": 7,
      "July": 6,
      "August": 5,
      "September": 4,
      "October": 3,
      "November": 2,
      "December": 1
    };
    var i, match, period;
    var re = /(\w+)? (20\d\d)/;

    // sort the datasets by the date in their titles
    // using a schwartz transform
    var schwartz = [];
    for (i = 0; i < data.length; i++) {
      match = re.exec(data[i][0]);
      if (match && match[1]) {
        period = match[1];
        if (period[0] !== 'Q') {
          period = months[period].toString();
        }
        match = match[2] + match[1];
      }
      schwartz[i] = [match, data[i]];
    }
    schwartz.sort();
    schwartz.reverse();
    for (i = 0; i < data.length; i++) {
      data[i] = schwartz[i][1];
    }
    var head = emptyElement(DATASETHDR);
    var datasetView = listView(data, liClickHandler(COLUMNHDR),
      function (elem) {
        return {
          title: elem[0],
          id: JSON.stringify([elem[1], elem[2]])
        };
      });
    head.appendChild(datasetView);
  }
  

  function receiveColumn(data) {
    drawChart(JSON.parse(data[2]));
  }
  

}());