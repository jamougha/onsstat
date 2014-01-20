from flask import Flask
from flask_sockets import Sockets
import namematch
import json
import mydb

app = Flask(__name__)
sockets = Sockets(app)

CDIDHDR = u'cdids'
DATASETHDR = u'datasets'
COLUMNHDR = u'column'

@sockets.route('/echo')
def echo_socket(ws):
    matcher = namematch.get_matcher()
    while True:
        def jsonize(response, data):
            return json.dumps({u"response": response, u"data":data})

        message = json.loads(ws.receive())
        response = "Impossible internal server error"

        try:
            if message[u"request"] == CDIDHDR:
                tokens = namematch.tokenize(message[u"data"])
                result = matcher.match_tokens(tokens)
                response = jsonize(CDIDHDR, result)
            elif message[u"request"] == DATASETHDR:
                cdid = message[u"data"]
                datasets = mydb.db_get('select title, cdid, id from columndata, datasets where cdid = %s and dataset_id = id', [cdid])
                response = jsonize(DATASETHDR, datasets)
            elif message[u"request"] == COLUMNHDR:
                cdid, _id = json.loads(message[u"data"])
                data = mydb.db_get('select base_period, index_period, "column" from columndata where cdid = %s and dataset_id = %s', (cdid, _id))
                print data
                assert len(data) == 1
                response = jsonize(COLUMNHDR, data[0])
            else:
                # TODO error logging
                response = "Malformed request " + message
        except Exception as e:
            print('error in echo_socket, probably malformed request: ' + str(message) + ', ' + str(e))
            response = 'Internal server error, ending connection'
            return
        finally:
            ws.send(response)

@app.route('/')
def hello():
    return 'Hello World!'