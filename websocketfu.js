
// TODO refactor in to mvc
(function () {
  var CDIDHDR = 'cdids';
  var DATASETHDR = 'datasets';
  var COLUMNHDR = 'column';

  var router = (function () {
    var routes = {};
    return {
      recieve: function (dest, response) {
        routes[response] = dest;
      },
      incoming: function (event) {
        var message = JSON.parse(event.data);
        var dest = routes[message.response];
        dest(message.data);
      }
    };
  }());
  
  var asock = new WebSocket("ws://127.0.0.1:8000/echo");

  asock.onopen = function (event) {
    var input = document.getElementById("token_input");
    input.oninput = sendTokens;
    console.log("Found server");
    asock.onmessage = function (event) {
      router.incoming(event);
    };
  };

  function emptyElement(id) {
    var head = document.getElementById(id);
    while (head.firstChild) {
      head.removeChild(head.firstChild);
    }
    return head;
  }

  function sendTokens(event) {
    var input = document.getElementById("token_input");
    if (input.value === "") {
      emptyElement(CDIDHDR);
    }
    if (input.value.length > 1) {
      var message = JSON.stringify({
        request: CDIDHDR,
        data: input.value
      });
      console.log(message);
      asock.send(message);
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
          node.style.background = "#CCDDFF";
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
    var list = document.createElement("ul");
    var colours = ["#E9E9E9", "#FFFFDD"];
    var i, elem, li;

    list.style.listStyle = "None";

    for (i = 0; i < data.length; i++) {
      elem = interpret(data[i]);
      li = document.createElement("li");
      li.style.padding = "5px";
      li.textContent =  elem.title;
      li.style.background = colours[i % 2];
      li.id = elem.id;
      li.onclick = handler(li);
      list.appendChild(li);
    }

    return list;
  }

  function receiveCDIDs(data) {
    var head = emptyElement(CDIDHDR);
    var cdidsView = listView(data, liClickHandler(DATASETHDR),

      function (elem) {
        return {
          title: elem[1] + " (" + elem[0] + ")",
          id: elem[0]
        };
      });
    head.appendChild(cdidsView);
  }
  router.recieve(receiveCDIDs, CDIDHDR);

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
    var schwartz = [];

    // sort the datasets by the date in their titles
    // using a schwartz transform
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
  router.recieve(receiveDatasets, DATASETHDR);

  function receiveColumn(data) {
    drawChart(JSON.parse(data[2]));
  }
  router.recieve(receiveColumn, COLUMNHDR);

}());