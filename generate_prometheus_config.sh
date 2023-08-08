#!/bin/bash

while [[ $# -gt 0 ]]; do
  key="$1"

  case $key in
    --environment)
      environment="$2"
      shift # past argument
      shift # past value
      ;;
    --region)
      region="$2"
      shift # past argument
      shift # past value
      ;;
    *)
      # Ignore unknown options
      shift
      ;;
  esac
done

region=${region:-us-east-1}

# Check if AWS CLI is installed
if ! command -v aws &>/dev/null; then
  echo "AWS CLI is not installed. Please install AWS CLI and try again."
  exit 1
fi

# List EC2 instances matching the name pattern
instances=$(aws ec2 describe-instances --region "$region" --filters "Name=tag:Name,Values=dapis-*-subgraph-*" "Name=instance-state-name,Values=running" --query 'Reservations[].Instances[].{Name:Tags[?Key==`Name`].Value | [0], PublicIP:PublicIpAddress}' --output json)

echo $instances | jq -c '.[]' | while read instance; do
  name=$(jq -r '.Name' <<< "$instance")
  ip=$(jq -r '.PublicIP' <<< "$instance")
  chain=$(sed -n 's/.*dapis-[^-]*-\(.*\)-subgraph-.*/\1/p' <<< "$name")
  node=$(sed -n 's/dapis-[^-]*-\(.*\)-subgraph-\(.*\)/\1-\2/p' <<< "$name")
  echo "- targets: [\"${ip}:8040\", \"${ip}:9100\"]"
  echo "  labels:"
  echo "    host: subgraph-${node}"
  echo "    environment: ${environment}"
  echo "    chain: ${chain}"
done
