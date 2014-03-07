onsstat
=======

A website for graphing datasets from the Office of National Statistics.

What Does it Do?
================

The ONS has an extensive set of wonderful [datasets](http://www.ons.gov.uk/ons/datasets-and-tables/index.html?content-type=Dataset&pubdateRangeType=allDates&sortBy=pubdate&sortDirection=DESCENDING&newquery=*&pageSize=50&applyFilters=true&content-type-orig=%22Dataset%22+OR+content-type_original%3A%22Reference+table%22) covering a wide range
of economic and social data. Unfortunately, there was way to easily search or 
view this data. Searching for 'unemployment wales' would return a large number of
datasets but no information about the individual data they contained. Data on, for 
instance, manufacturing might be indexed by 'manufacturing' or perhaps simply 'manuf',
but there is no way to view datasets for both together, or to discover 'manuf' without
having studied the 33 thousand CDID names. To view the data, each dataset must be 
downloaded, the CDID identifiers deciphered, and the results plotted. Data is repeated 
over and over for each CDID, but not all data for a CDID is a repeat, and there is no
alternative to examining many - often dozens - of datasets to attain a complete 
picture.

This website is designed to change that.

The data from all ONS datasets has been parsed and aggregated, much redundancy 
has been eliminated, and CDID names can be searched in a fast and intuitive manner.
Data can be plotted and compared instantly.


Code Structure
==============

* webapp.py

This is the central flask application. It serves static pages, data for plotting in a 
REST manner, and serves the websocket links for live-search.

* namematch.py

Implements a suffix tree for live-search of CDID names. Also initializes the suffix tree
from the database and presents an object-oriented interface for searching the tree, 
including ordering of results.


* datacache.py

Object-oriented cache for data (perhaps you guessed that one) needed by live search for each CDID.

* static/datasets.js

Implements the clientside interface for querying the backend and logic to render and plot the 
resulting data.

* mydb.py

Handles some common database interaction.

*csv data parsing.ipynb

An ipython notebook for parsing the raw datasets and updating the database.

* ons-retrieval.py

Retrieves the datasets from the ONS website.