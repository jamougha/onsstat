
// Load the Visualization API and the piechart package.
google.load('visualization', '1.0', {'packages': ['corechart']});

// Set a callback to run when the Google Visualization API is loaded.
google.setOnLoadCallback(drawChart);

// Callback that creates and populates a data table,
// instantiates the pie chart, passes in the data and
// draws it.
function drawChart(column) {
  // Create the data table.
  var i, numeric = [];
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'Year');
  data.addColumn('number', 'Amount');
  for (i = 0; i < column.length && column[i][0].length === 4; i++) {
    numeric[i] = [column[i][0], parseFloat(column[i][1])];
  }
  data.addRows(numeric);

  // Set chart options
  var options = {'title': 'Some Graph',
                 'width': 800,
                 'height': 450};

  // Instantiate and draw our chart, passing in some options.
  var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
  chart.draw(data, options);
}