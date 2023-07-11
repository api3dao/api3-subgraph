#!/bin/bash

# Parse the command line arguments
while [[ $# -gt 0 ]]
do
    key="$1"

    case $key in
        --contract-name)
        CONTRACT_NAME="$2"
        shift # past argument
        shift # past value
        ;;
        --chain-name)
        CHAIN_NAME="$2"
        shift # past argument
        shift # past value
        ;;
        *)
        # unknown option
        echo "Unknown option: $key"
        exit 1
        ;;
    esac
done

# Check that both arguments were provided
if [ -z "$CONTRACT_NAME" ] || [ -z "$CHAIN_NAME" ]
then
    echo "Usage: $0 --contract-name [name] --chain-name [name]"
    exit 1
fi

# Check if yq is installed
if ! command -v yq &> /dev/null
then
    echo "Error: yq command not found. Please install yq before running this script."
    exit 1
fi

if ! command -v jq &> /dev/null
then
    echo "Error: jq command not found. Please install jq before running this script."
    exit 1
fi

echo "Contract name: $CONTRACT_NAME"
echo "Chain name: $CHAIN_NAME"

# load node address, ports from subgraph_infrastructure.yaml
infrastructure=$(yq eval -o=j subgraph_infrastructure.yaml | jq -cr --arg chainName "$CHAIN_NAME" '.chains[$chainName]')
if [ "$infrastructure" = "null" ]; then
    echo "Error: cannot find infrastructure for chain '$CHAIN_NAME'."
    exit 1
fi

for node in $(echo $infrastructure | jq -cr '.nodes[]' -); do
  address=$(echo $node | jq -r '.address' -)
  graphql_port=$(echo $node | jq -r '.ports.graphql' -)
  status_port=$(echo $node | jq -r '.ports.status' -)
  ipfs_port=$(echo $node | jq -r '.ports.ipfs' -)
  
  export CONTRACT_NAME=$CONTRACT_NAME
  export CHAIN_NAME=$CHAIN_NAME
  export SUBGRAPH_FILE="subgraphs/$CONTRACT_NAME/src/subgraph.yaml"
  export SUBGRAPH_NAME="$CHAIN_NAME/$CONTRACT_NAME"
  export GRAPH_NODE="http://$address:$graphql_port"
  export IPFS_NODE="http://$address:$ipfs_port"

  yarn generate-chain-specific-configs
  yarn generate-types
  yarn build

  response=$(curl -sS --location "http://$address:$status_port/graphql" \
    --header 'Content-Type: application/json' \
    --data '{"query": "{ indexingStatusForCurrentVersion(subgraphName: \"'$SUBGRAPH_NAME'\") { synced, health }}"}')
  if [ "$(echo $response | jq -r '.data.indexingStatusForCurrentVersion')" = "null" ]; then
    echo "Subgraph $SUBGRAPH_NAME is not deployed."
    yarn run register
    VERSION_LABEL="1.0.0" yarn deploy
  else
    echo "Subgraph $SUBGRAPH_NAME is already deployed. Skipping deployment."
  fi
done
