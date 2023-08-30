import requests
import os
from flask import Flask, jsonify, make_response, request

app = Flask(__name__)

def get_chain_data(chains, chain_name):
    result = None
    for chain in chains:
        if chain['network'] == chain_name:
            result = chain
            break
    return result

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
            chain_block_data = get_chain_data(body['chains'], chain)
            chain_head_block = int(chain_block_data['chainHeadBlock']['number'])
            latest_block = int(chain_block_data['latestBlock']['number'])
            if body['synced'] and body['health'] == 'healthy' and chain_head_block < latest_block + 20: # 20 blocks behind is acceptable
                response = {'code': 200 }
            response = response | body
    except:
        pass
    return make_response(jsonify(response), response['code'])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)