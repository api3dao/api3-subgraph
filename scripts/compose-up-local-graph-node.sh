cd "$(dirname "$0")" # .bin directory
cd "$(dirname "$(realpath compose-up-local-graph-node)")" # homedir of command (have to match the name in package.json > bin)
docker-compose -f ../docker-compose.local.yml "$@" up