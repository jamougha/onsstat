
// TODO refactor in to mvc
(function () {
  
  var CDIDHDR = 'cdids';
  var DATASETHDR = 'datasets';
  var COLUMNHDR = 'column';

  function liClickHandler(header) {
    return (function (currentNode, lastbg) {
      return function (node) {
        function doClick() {
          if (currentNode !== null) {
            currentNode.style.background = lastbg;
          }
          lastbg = node.style.background;
          node.style.background = "#FFCC88";
          var data = $.get('/fetchcolumn/' + node.id, function () { drawChart(JSON.parse(data.responseText)[0]) })
          var selectedNode = node.cloneNode();
          selectedNode._node = node;
          selectedNode._data = data;
          selectedNode.visiblity = 'hidden';
          console.log(selectedNode._element);
          $(node).fadeOut(1000);
          var selectList = $('#chosen');
          selectList.append(selectedNode);
          currentNode = node;
        }
        return doClick;
      };
    }(null, null));
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

  function elementView(data, handler, buffer) {
    var i, elem, li;

    for (i = 0; i < data.length; i++) {
      elem = data[i];
      li = document.createElement("li");
      var title = elem.name + " (" + elem.cdid + ", " + elem.column_id + ")";
      li.style.padding = "5px";
      li.textContent = title;
      li.style.borderBottom = 'dotted gray 1px'
      li.id = elem.column_id;
      li._element = elem
      li.onclick = handler(li);
      buffer.push(li);
    }
  }

  var numsent = 0;
  function sendTokens(event) {
    var input = document.getElementById("token_input"),
        message = false;

    if (input.value === "") {
      $('#cdids').empty();
    }

    if (input.value.length > 1) {
      var message = input.value;
    }

    asock.send(JSON.stringify([++numsent, message]));
  }

  var receiveCDIDs = (function (lastIdent, buffer) {
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

      elementView(contents, liClickHandler(DATASETHDR), buffer);

      if (lastIdent !== ident) {
        head.empty();
        head.append(listView(buffer));
        lastIdent = ident;
      }
    };
  }(-1, []));


  var asock = new WebSocket("ws://127.0.0.1:8000/tokenmatcher");

  asock.onopen = function (event) {
    var input = $("#token_input");
    input.on('input', sendTokens);
    console.log("Found server");
    asock.onmessage = receiveCDIDs;
  };


}());