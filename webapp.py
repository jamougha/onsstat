from flask import Flask, render_template
from flask_sockets import Sockets
import namematch
import json 
import mydb

app = Flask(__name__)
sockets = Sockets(app)

CDIDHDR = u'cdids'
DATASETHDR = u'datasets'
COLUMNHDR = u'column'

@app.route('/fetchcolumn/<int:cdid>')
def fetch_column(cdid):
    



@sockets.route('/echo')
def echo_socket(ws):
    """Search for cdids that match the given tokens."""
    matcher = namematch.get_matcher()
    while True:
        msg_id, cdid = json.loads(ws.receive())

        tokens = namematch.tokenize(message)
        cdids = matcher.match_tokens(tokens)
        cdids.sort(key=lambda x: len(x[1]))
        columns = []
        for cdid, name in cdids:
            redcol_ids = mydb.db_get('select id from reduced_columns where cdid = %s', [cdid])
            for id in redcol_ids:
                titles = mydb.db_get('''select title from datasets d
                                    join reduced_columns rc on d.id = any(rc.datasets)
                                    where rc.id = %s''',
                                    id)
                columns.append(dict(cdid=cdid, name=name, datasets=titles, id=id))
            
        response = json.dumps(columns)

        ws.send(msg_id, response)

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/')
def hello():
    return render_template('datasets.html')