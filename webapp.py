from flask import Flask
from flask_sockets import Sockets
import namematch
import json
import mydb

app = Flask(__name__)
sockets = Sockets(app)

@sockets.route('/echo')
def echo_socket(ws):
    matcher = namematch.get_matcher()
    while True:
        message = ws.receive()
        response = "Impossible internal server error"
        try:
            if message.startswith('get_cdids:'):
                tokens = namematch.tokenize(message[11:])
                result = matcher.match_tokens(tokens)
                response = "cdids:" + json.dumps(result)
            elif message.startswith('get_datasets:'):
                cdid = message[13:].strip()
                datasets = mydb.db_get('select title, id from columndata, datasets where cdid = %s and dataset_id = id', [cdid])
                response = "datasets:" + json.dumps(datasets)
            elif message.startswith('get_column:'):
                cdid, id = message[11:].strip().split()
                data = mydb.db_get('select base_period, index_period, "column" from columndata where cdid = %s and dataset_id = %i', (cdid, int(id)))
                assert len(data) == 1
                response = "column:" + data[0]
            else:
                # TODO error logging
                response = "Malformed request"
        except Exception as e:
            print('error in echo_socket, probably malformed request: ' + e)
            response = 'Internal server error, ending connection'
            return
        finally:
            ws.send(response)

@app.route('/')
def hello():
    return 'Hello World!'