cd "$(dirname "$0")" # .bin directory
cd "$(dirname "$(realpath compose-local-graph-node)")" # homedir of command (have to match the name in package.json > bin)
yarn compose-local-graph-node