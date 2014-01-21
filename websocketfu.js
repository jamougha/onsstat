(function() {
	var CDIDHDR = 'cdids'
	var DATASETHDR = 'datasets'
	var COLUMNHDR = 'column'

	var asock = new WebSocket("ws://127.0.0.1:8000/echo");

	asock.onopen = function (event) {
		input = document.getElementById("token_input");
		input.oninput = sendTokens
	    console.log("Found server");
	};

	function clearList(id) {
		var head = document.getElementById(id);
    while (head.firstChild) {
    	head.removeChild(head.firstChild);
    }
    return head;
	}

	function sendTokens(event) {
		input = document.getElementById("token_input");
		if (input.value === "") {
			clearList(CDIDHDR);
		}
		if (input.value.length > 1) {
			message = JSON.stringify( {
		  	request: CDIDHDR,
		  	data: input.value
		  });
		  console.log(message);
		  asock.send(message);
		}
	}

	function liClickHandler(header) {
		return function (currentNode) {
			return function (node) {
				function doClick() {
					if (currentNode !== null) {
						currentNode.style.background = "white";
					}
					node.style.background = "#CCDDFF";
					console.log(header, node.id)
					asock.send(JSON.stringify({
						request: header,
						data: node.id
					}));
					currentNode = node;
				}
				return doClick;
			};
		}(null);
	}

  function handleData(data, header, handler, interpret) {
  	console.log(data, header);
		var list = document.createElement("ul");
		list.style.listStyle = "None";

		for (var i = 0; i < data.length; i++) {
			var elem = interpret(data[i]);
			var li = document.createElement("li");

			li.textContent =  elem.title;
			li.id = elem.id;
			li.onclick = handler(li);
			list.appendChild(li);
		}

		var head = clearList(header);
	  head.style.fontSize = "small";
		head.appendChild(list);
  };

	asock.onmessage = function (event) {

		message = JSON.parse(event.data);
		switch (message.response) {
			case CDIDHDR:
				//console.log(message.response);
				handleData(message.data, CDIDHDR, liClickHandler(DATASETHDR),
					function (elem) {
						return {
							title: elem[1] + " (" + elem[0] + ")",
							id: elem[0]
						};
					}
				);
			break;
			case DATASETHDR:

				console.log(message.response);
				handleData(message.data, DATASETHDR, liClickHandler(COLUMNHDR),
				  function (elem) {
						return {
							title: elem[0],
							id: JSON.stringify([elem[1], elem[2]])
						};
					}
				);
				break;
			case "column":
				break;
		}
	};
}());