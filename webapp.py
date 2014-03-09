from __future__ import print_function, unicode_literals
from flask import Flask, render_template
from flask_sockets import Sockets
import namematch
import json 
from datacache import Datacache
from concurrent.futures import ThreadPoolExecutor
from flask.ext.sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import ARRAY
import time
import itertools as it

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://holdem:holdem@127.0.0.1/onsstat'
db = SQLAlchemy(app)
sockets = Sockets(app)

class Datasets(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.Text)

    def __init__(self, d_id, title):
        self.id = d_id
        self.title = title

    def __repr__(self):
        return '%d %s' % (self.id, self.title)

class Cdids(db.Model):
    cdid = db.Column(db.String(4), primary_key=True)
    price = db.Column(db.String(16))
    seasonal_adjustment = db.Column(db.String(16))
    name = db.Column(db.Text) 

    def __init__(self, cdid, price, season, name):
        self.cdid = cdid
        self.price = price
        self.season = season
        self.name = name

    def __repr__(self):
        return "%s %s %s %s" % (self.cdid, self.name, self.price, self.season)

class Columndata(db.Model):
    cdid = db.Column(db.String(4), db.ForeignKey('cdids.cdid'), primary_key=True)
    dataset_id = db.Column(db.Integer, db.ForeignKey('datasets.id'), primary_key=True)
    base_period = db.Column(db.String(16))
    index_period = db.Column(db.String(16))

    def __init__(self, cdid, dataset_id, base, index):
        self.cdid = cdid
        self.dataset_id = dataset_id
        self.base_period = base
        self.index_period = index

    def __repr__(self):
        return "%s %s %s %s" % (self.cdid, self.dataset_id, 
                                self.base_period, self.index_period)

class Reduced_columns(db.Model):
    cdid = db.Column(db.String(4))
    datasets = db.Column(ARRAY(db.Integer))
    id = db.Column(db.Integer, primary_key=True)
    datacolumn = db.Column(db.Text)

    def __init__(self, cdid, datasets, datacolumn):
        self.cdid = cdid
        self.datasets = datasets
        self.datacolumn = datacolumn

    def __repr__(self):
        return "%s %d %s %s" % (self.cdid, self.id, 
                                str(self.datasets), self.datacolumn)


CACHE = Datacache(Datasets, Reduced_columns)

@app.route('/test')
def test():
    return Datasets.query.filter_by(id=1).first()


@app.route('/fetchcolumn/<column_id>')
def fetch_column(column_id):
    column_id = int(column_id)
    try: 
        datacolumn = Reduced_columns.query.filter_by(id=column_id).first().datacolumn
    except Exception as e:
        return str(e)
    return datacolumn

def chunkify(ls, size = 50):
    for i in range(0, len(ls), size):
        yield it.islice(ls, i, i + size)

@sockets.route('/tokenmatcher')
def echo_socket(ws):
    """Search for cdids that match the given tokens.
    The query may return several thousand results, so rather than
    doing it all at once it's broken up into chunks. After each
    chunk is sent we check for a new message, abandoning the current 
    query if one is found.
    """
    matcher = namematch.TokenMatcher(Cdids)

    with ThreadPoolExecutor(max_workers=2) as ex:
        received = ex.submit(ws.receive)

        while True:
            ident, message = json.loads(received.result())
            received = ex.submit(ws.receive)
            if not message: 
                continue

            tokens = namematch.tokenize(message)
            cdids = matcher.match_tokens(tokens)
            if len(cdids) == 0:
                ws.send(json.dumps([ident, []]))

            for chunk in chunkify(cdids):
                chunklookup = CACHE.map_lkup(chunk)
                response = [ident, chunklookup]
                ws.send(json.dumps(response))

                time.sleep(0)
                if received.done():
                    break

            ws.send(json.dumps([ident, "end"]))

@app.route('/about')
def about():
    return render_template('about.html')


@app.route('/sorry')
def sorry():
    return render_template('sorry.html')

@app.route('/')
def hello():
    return render_template('datasets.html')