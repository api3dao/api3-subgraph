cd "$(dirname "$0")" # .bin directory
cd "$(dirname "$(realpath deploy-subgraph)")" # homedir of deploy-subgraph command (have to match the name in package.json > bin)
yarn compose-local-graph