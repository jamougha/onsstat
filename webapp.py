from flask import Flask
from flask_sockets import Sockets
import namematch
import json

app = Flask(__name__)
sockets = Sockets(app)

@sockets.route('/echo')
def echo_socket(ws):
    matcher = namematch.get_matcher()
    while True:
        message = str(ws.receive())
        if message.startswith('get_tokens:'):
            tokens = message[11:].split(' ')
            result = matcher.match_tokens(tokens)
            message = json.dumps(result)
            ws.send(message)
        ws.send('not understood')

@app.route('/')
def hello():
    return 'Hello World!'