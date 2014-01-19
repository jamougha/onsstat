(function() {
	var CDIDS_ID = "data"
	var DATASETS_ID = "datasets"
	var asock = new WebSocket("ws://127.0.0.1:8000/echo");

	asock.onopen = function (event) {
		input = document.getElementById("token_input");
		input.oninput = send_tokens
	    console.log("Found server");
	};

	function clearList(id) {
		var head = document.getElementById(id);
	    while (head.firstChild) {
	    	head.removeChild(head.firstChild);
	    }
	    return head;
	}

	function send_tokens(event) {
		input = document.getElementById("token_input");
		if (input.value === "") {
			clear_cdids();
		}
		if (input.value.length > 1) {
		  asock.send("get_tokens:" + input.value);
		}
	}
	var currentNodes = {};
	function liClickHandler(response) {
		return function (node) {
			function doClick() {
				if (response in currentNodes) {
					currentNodes[response].style.background = "white";
				}
				node.style.background = "#CCDDFF";
				asock.send(response + node.id);
				currentNodes[response] = node;
			}
			return doClick;
		}
	}

  function handleData(data, header, interpret) {
		var datasets = JSON.parse(data);
		var list = document.createElement("ul");
		list.style.listStyle = "None";

		for (var i = 0; i < datasets.length; i++) {
			var elem = interpret(datasets[i]);
			var li = document.createElement("li");

			li.textContent =  elem.title;
			li.id = elem.id;
			li.onclick = liClickHandler(header)(li);
			list.appendChild(li);
		}

		var head = clearList(DATASETS_ID);
	  head.style.fontSize = "small";
		head.appendChild(list);
  };

	asock.onmessage = function (event) {
		edata = event.data
		colonidx = edata.indexOf(':');
		header = edata.substring(0, colonidx);
		data = edata.substring(colonidx+1, edata.length);
		console.log(edata)
		switch (header) {
			case "cdids":
				handleData(data, 'get_tokens:', function(elem) {
					return {
						title: elem[1] + " (" + elem[0] + ")",
						id: elem[0]
					};
				});
				break;
			case "datasets":
				handleData(data, 'get_datasets:', function(elem) {
					return {
						title: elem[1],
						id: elem[0]
					};
				});
				break;
			case "column":
				break;
		}
	};
}());