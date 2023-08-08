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
        --region)
          region="$2"
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

region=${region:-us-east-1}
graphql_port=8020
status_port=8030
ipfs_port=5001

# List EC2 instances matching the name pattern
instances=$(aws ec2 describe-instances --region "$region" --filters "Name=tag:Name,Values=dapis-*-subgraph-*" "Name=instance-state-name,Values=running" --query 'Reservations[].Instances[].{Name:Tags[?Key==`Name`].Value | [0], PublicIP:PublicIpAddress}' --output json)

echo $instances | jq -c '.[]' | while read instance; do
  instance_name=$(jq -r '.Name' <<< "$instance")
  instance_ip=$(jq -r '.PublicIP' <<< "$instance")
  chain=$(sed -n 's/.*dapis-[^-]*-\(.*\)-subgraph-.*/\1/p' <<< "$instance_name")

  if [ "$chain" != "$CHAIN_NAME" ]; then
    continue
  fi  

  export CONTRACT_NAME=$CONTRACT_NAME
  export CHAIN_NAME=$CHAIN_NAME
  export SUBGRAPH_FILE="subgraphs/$CONTRACT_NAME/src/subgraph.yaml"
  export SUBGRAPH_NAME="$CHAIN_NAME/$CONTRACT_NAME"
  export GRAPH_NODE="http://$instance_ip:$graphql_port"
  export IPFS_NODE="http://$instance_ip:$ipfs_port"

  yarn generate-chain-specific-configs
  yarn generate-types
  yarn build

  echo "Checking if subgraph $SUBGRAPH_NAME is already deployed on node $instance_name..."
  response=$(curl -sS --connect-timeout 10 --location "http://$instance_ip:$status_port/graphql" \
    --header 'Content-Type: application/json' \
    --data '{"query": "{ indexingStatusForCurrentVersion(subgraphName: \"'$SUBGRAPH_NAME'\") { synced }}"}' 2>&1)
  if [ "$(echo $response | jq -r '.data.indexingStatusForCurrentVersion')" = "null" ]; then
    echo "Subgraph $SUBGRAPH_NAME is not deployed on $instance_name."
    yarn run register
    VERSION_LABEL="1.0.0" yarn deploy
  elif [[ "$(echo $response | jq -cr '.data.indexingStatusForCurrentVersion' -)" == *"synced"* ]]; then
    echo "Subgraph $SUBGRAPH_NAME is already deployed. Skipping deployment."
  else
    echo "Error: cannot check if subgraph $SUBGRAPH_NAME is deployed."
  fi
done
