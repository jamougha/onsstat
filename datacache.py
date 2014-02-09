import psycopg2
from collections import defaultdict

_DB_CONNECT_STR = "dbname=onsstat user=holdem password=holdem host=127.0.0.1"



class Datacache(object):
    """Cache the dataset and id info from reduced_columns for each cdid.
    This allows us to do fast searching during the client's live search
    """
    def __init__(self, db):
        self._cdid_data = defaultdict(list)
        self._dataset_titles = {}
        try:
            conn = psycopg2.connect(db)
            cur = conn.cursor() 

            cur.execute('select id, title from datasets')
            datasets = cur.fetchall()
            self._dataset_titles = {id:title for id, title in datasets}

            cur.execute('select cdid, datasets, id from reduced_columns')
            for cdid, datasets, d_id in cur.fetchall():
                self._cdid_data[cdid].append((datasets, d_id))

        finally:
            cur.close()
            conn.close()

    def dataset_title(self, d_id):
        return self._dataset_titles[d_id]

    def cdid_info(self, cdid):
        return self._cdid_data[cdid]

    def titles_and_ids(self, cdid):
        result = []
        for datasets, d_id in self.cdid_info(cdid):
            titles = map(self.dataset_title, datasets)
            result.append((titles, d_id))
        return result

_cache = Datacache(_DB_CONNECT_STR)
def cache():
    return _cache

