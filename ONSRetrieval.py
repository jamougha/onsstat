from __future__ import print_function, division, absolute_import, unicode_literals
from six.moves import zip, range, filter, map
from bs4 import BeautifulSoup
import urllib2
import json

def geturl(url):
    'get an url'
    p = urllib2.urlopen(url)
    page = p.read()
    return page

_LINK_PREFIX, _NEXT_PREFIX = 'http://www.ons.gov.uk/', 'http://www.ons.gov.uk/ons/datasets-and-tables/index.html'

def page_to_links(page):
    """takes an ONS search result page and extracts the links to 
    datasets and the next result"""
    soup = BeautifulSoup(page)
    link_tds = (td for td in soup.find_all('td') if td.has_key('class'))
    links = {(_LINK_PREFIX + td.a['href']) : td.text 
               for td in link_tds}
    assert 0 < len(links) <= 100

    nextrefs = {a['href'] for a in soup.find_all('a') if a.string == 'Next'}
    nextpage = None
    if len(nextrefs) == 1:
        nextpage = _NEXT_PREFIX + nextrefs.pop()
    elif len(nextrefs) != 0:
        raise Exception("Too many choices to resolve reference to next page")

    return links, nextpage

def fetch_query(url):
    "retrieve all the links from the ONS query at <url>"
    page = geturl(url)
    links, nextpage = {}, None
    try:
        links, nextpage = page_to_links(page)
    except Exception as e:
        print("page_to_links failed unexpectedly:" + str(e))

    if nextpage:    
        nextlinks = fetch_query(nextpage)
        links.update(nextlinks)

    return links


def fetch_all_pages(fname='onsdata/onslinks.txt'):
    """retrieve the links to all datasets on the 
    ONS site and save them to file <fname>"""
    ECON_LINKS = 'http://www.ons.gov.uk/ons/datasets-and-tables/index.html?content-type=Dataset&nscl=Economy&pubdateRangeType=allDates&sortBy=pubdate&sortDirection=DESCENDING&newquery=*&pageSize=100&applyFilters=true&content-type-orig=%22Dataset%22+OR+content-type_original%3A%22Reference+table%22&content-type=Dataset'
    OTHER_LINKS = 'http://www.ons.gov.uk/ons/datasets-and-tables/index.html?content-type=Dataset&nscl=Agriculture+and+Environment&nscl=Business+and+Energy&nscl=Children%2C+Education+and+Skills&nscl=Crime+and+Justice&nscl=Government&nscl=Health+and+Social+Care&nscl=Labour+Market&nscl=People+and+Places&nscl=Population&nscl=Travel+and+Transport&pubdateRangeType=allDates&sortBy=pubdate&sortDirection=DESCENDING&newquery=*&pageSize=100&applyFilters=true&content-type-orig=%22Dataset%22+OR+content-type_original%3A%22Reference+table%22'
    
    econ = fetch_query(ECON_LINKS)     # the query has to be split because the server
    links = fetch_query(OTHER_LINKS)   # limits responses to 500 links
    links.update(econ)

    with open(fname, 'w') as out:
        out.write(json.dumps(links, indent=4))
        
def local_get_links(f='onsdata/onslinks.txt'):
    'retrieve list of links from local json data in <f>'
    with open(f) as onslinks:
        jsonstring = ''.join(line for line in onslinks.readlines())
        return json.loads(jsonstring)

_DATAPAGE_REL = 'http://www.ons.gov.uk'

def onsdata_filelinks(page):
    """takes html of an ONS dataset page; extracts title, 
    date and links to the xls/csv files"""
    soup = BeautifulSoup(page)
    links = soup.find_all('a')

    title = soup.find_all('title')[0].text.strip()

    xls, csv = [_DATAPAGE_REL + link['href'] 
                  for link in links 
                    if link.text in ('XLS format', 'CSV format')]
        
    tds = iter(soup.find_all('td'))
    while tds.next().text != 'Published date': 
        pass
    date = tds.next().text

    return title, date, xls, csv
