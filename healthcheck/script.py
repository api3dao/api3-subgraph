import requests
import os
from flask import Flask, jsonify, make_response, request

app = Flask(__name__)


@app.route('/healthz')
def hello():
    GRAPH_STATUS_API_URL = os.environ['GRAPH_STATUS_API_URL']
    
    chain = request.args.get('chain')
    contract = request.args.get('contract')

    response = {'code': 424 }

    status = requests.post(GRAPH_STATUS_API_URL, json={"query": f"{{ indexingStatusForCurrentVersion(subgraphName: \"{chain}/{contract}\") {{ synced, health, fatalError {{message}}, chains {{network, chainHeadBlock {{number}}, latestBlock{{number}} }} }} }}"})

    print(status.json())

    try:
        if status.status_code == 200:
            body = status.json()['data']['indexingStatusForCurrentVersion']
            if body['synced']:
                response = {'code': 200 }
            response = response | body
    except:
        pass
    return make_response(jsonify(response), response['code'])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)