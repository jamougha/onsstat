from __future__ import print_function
from flask import Flask, render_template
from flask_sockets import Sockets
import namematch
import json 
import mydb
from datacache import cache
from concurrent.futures import ThreadPoolExecutor
from flask.ext.sqlalchemy import SQLAlchemy
import time
import itertools as it

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://holdem:holdem@127.0.0.1/onsstat'
db = SQLAlchemy(app)
sockets = Sockets(app)

@app.route('/fetchcolumn/<column_id>')
def fetch_column(column_id):
    column_id = int(column_id)
    datacolumn, = mydb.db_get('select datacolumn from reduced_columns where id = %s', [column_id])
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
    matcher = namematch.get_matcher()

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
                chunklookup = cache.map_lkup(chunk)
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