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
    echo "Usage: $0 --contractName [name] --chainName [name]"
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

for chain in $(yq eval -o=j subgraph_infrastructure.yaml | jq -cr '.chains[]'); do
  for node in $(echo $chain | jq -cr '.nodes[]' -); do
    address=$(echo $node | jq -r '.address' -)
    graphql_port=$(echo $node | jq -r '.ports.graphql' -)
    status_port=$(echo $node | jq -r '.ports.status' -)
    ipfs_port=$(echo $node | jq -r '.ports.ipfs' -)
    
    for contract in $(yq eval -o=j subgraph_infrastructure.yaml | jq -cr '.contracts[]'); do
      export SUBGRAPH_FILE="subgraph.${CHAIN_NAME}.yaml"
      export SUBGRAPH_NAME="$CHAIN_NAME/$contract"
      export SUBGRAPH_NODE="http://$address:$graphql_port"
      export IPFS_NODE="http://$address:$ipfs_port"

      yarn workspace $contract codegen
      yarn workspace $contract build

      response=$(curl -sS --location "http://$address:$status_port/graphql" \
        --header 'Content-Type: application/json' \
        --data '{"query": "{ indexingStatusForCurrentVersion(subgraphName: \"'$CHAIN_NAME'/'$contract'\") { synced, health }}"}')
      if [ "$(echo $response | jq -r '.data.indexingStatusForCurrentVersion')" = "null" ]; then
        echo "Subgraph $CHAIN_NAME/$contract is not deployed"
        yarn run graph create $SUBGRAPH_NAME --node $SUBGRAPH_NODE
        VERSION_LABEL="1.0.0" yarn workspace $contract deploy
      else
        echo "Subgraph $CHAIN_NAME/$contract is deployed"
      fi
      #yarn workspace $contract deploy
    done
  done
done

# Add your script logic here
#SUBGRAPH_FILE="subgraph.$CHAIN_NAME.yaml" yarn workspace $CONTRACT_NAME codegen