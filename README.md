# API3 subgraph

## Local Development

1. Copy `.env.example` to `.env`, copy `local-environment/.env.example` to `local-environment/.env` and fill check the values.
2. Start a local graph node:
   in `./local-environment` run `docker-compose up` (modify `local-environment/.env` file to configure ports and chain names/urls)
3. Find common scripts in `package.json > scripts`. Keep the naming convention for new subgraphs for the scripts to be able to work: `ContractName/src/schema.graphql|subgraph.yaml`. (modify `.env` file to the desired networks, contract names, addresses...)

## Deploy on production:

```bash
./scripts/deploy.sh --chain-name ${chain_name} --contract-name ${contract_name}
```

Currently supported chains:

- `Polygon Mumbai` (id: polygon-testnet)
