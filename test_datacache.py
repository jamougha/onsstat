from __future__ import print_function
import datacache
from nose.tools import raises

def dataset_title_test():
    """Dataset ids should map correctly."""
    cache = datacache.cache()
    assert cache.dataset_title(1) == "Preliminary Estimate of GDP - Time Series Dataset Q3 2013 - ONS"
    assert cache.dataset_title(99) == "Aerospace and Electronics Cost Indices, July 2012 Dataset - ONS"

def title_inclusion_test():
    """There should be no gaps in the datasets."""
    cache = datacache.cache()
    for i in range(642):
        if i != 579: #oops
            cache.dataset_title(i)

@raises(KeyError)
def test_dataset_keyerror():
    """There are only so many datasets"""
    cache = datacache.cache()
    cache.dataset_title(1000)

def test_cdid_info():
    cache = datacache.cache()
    expected = set([
        ((351,256,52,199,482,170,282,557,121,334,122,309,59,202,385,341,330,
            175,200,552,542,5,240,391,479,132,147,380,416,386), 200),
        ((234,),201),
        ((493,), 202),
        ((2,494,558,612), 8830),
        ((369,522,153,161,458,80,376,35,290,392,93,382,111,627,564,530,329,629,622,541,600), 8831),
        ((157,),36807)])

    nmoe_info = cache.cdid_info('NMOE')
    found = {(tuple(a), b) for a, b in nmoe_info}

    assert expected == found
        
def test_titles_and_ids():
    cache = datacache.cache()
    ti = cache.titles_and_ids('A2FE')

    titles = set(ti[0][0])
    expected = set([
        "MQ5: Investment by Insurance Companies, Pension Funds and Trusts, Time Series Data, Q2 2012 - ONS",
        "MQ5: Investment by Insurance Companies, Pension Funds and Trusts, Time Series Data, Q3 2012 - ONS",
        "MQ5: Investment by Insurance Companies, Pension Funds and Trusts, Q4 2011 - Time Series Data - ONS"])

    assert len(titles) == 11 and expected < titles and ti[0][1] == 37669



