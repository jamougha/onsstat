
// Load the Visualization API and the piechart package.
google.load('visualization', '1.0', {'packages': ['corechart']});

// Set a callback to run when the Google Visualization API is loaded.


// Callback that creates and populates a data table,
// instantiates the pie chart, passes in the data and
// draws it.
var drawChart = (function (first) {
  return function (column) {
    console.log(column.length)
    var i, numeric = [];

    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Year');
    data.addColumn('number', 'Amount');

    if (first) {
        first = false;
        console.log("firt!");
    } else {
        column = column[0];
    }

    for (i = 0; i < column.length && column[i][0].length === 4; i++) {
      numeric[i] = [column[i][0], parseFloat(column[i][1])];
    }
    data.addRows(numeric);

    // Set chart options
    var options = {'title': 'Some Graph',
                   'width': 600,
                   'height': 340};

    // Instantiate and draw our chart, passing in some options.
    var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
    chart.draw(data, options);
  };
}(true));

google.setOnLoadCallback(drawChart);