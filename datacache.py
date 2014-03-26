import psycopg2
from collections import defaultdict
_DB_CONNECT_STR = "dbname=onsstat user=holdem password=holdem host=127.0.0.1"



class Datacache(object):
    """Cache the dataset and id info from reduced_columns for each cdid.
    This allows us to do fast live search.
    """
    def __init__(self, datasets, rcolumns):
        self._cdid_data = defaultdict(list)
        self._dataset_titles = {}
        self.datasets = datasets
        self.rcolumns = rcolumns
        datasets = self.datasets.query.all()
        self._dataset_titles = {d.id:d.title for d in datasets}

        for c in self.rcolumns.query.all():
            self._cdid_data[c.cdid].append((c.datasets, c.id))

    def dataset_title(self, d_id):
        return self._dataset_titles[d_id]

    def cdid_info(self, cdid):
        return self._cdid_data[cdid]

    def titles_and_ids(self, cdid):
        result = []
        for datasets, d_id in self.cdid_info(cdid):
            titles = [self._dataset_titles[id] for id in datasets]
            result.append((titles, d_id))
        return result

    def map_lkup(self, chunk):
        columns = []
        for cdid, name in chunk:
            for  datasets, col_id in self.titles_and_ids(cdid):
                columns.append(dict(cdid=cdid, name=name, 
                                    datasets=datasets, column_id=col_id))

        return columns


