cd "$(dirname "$0")" # .bin directory
cd "$(dirname "$(realpath generate-build-deploy-subgraph)")" # homedir of command (have to match the name in package.json > bin)
yarn generate-build-deploy