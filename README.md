# API3 subgraph

## Local Development

1. For the scripts in `package.json` to work, you need to load your environment variables. The most convient way to doing this:
   1. Copy `.env.example` to `.env`, and check / change the desired values
   2. run the scripts like this: `npx dotenv-cli yarn script-name` (the [dotenv-cli](https://www.npmjs.com/package/dotenv-cli) will load the variables from the file named `.env` defaultly)
2. Start a local graph node:
   run `yarn compose-local-graph` (modify `.env` file to configure ports and chain names/urls)
3. Find common scripts for subgraph development in `package.json > scripts` (modify `.env` file to the desired networks, contract names, addresses...)

---

## Keep the naming convention for new subgraphs for the scripts to be able to work: `ContractName/src/subgraph.yaml`.

## Deploy on production:

```bash
./scripts/deploy.sh --chain-name ${chain_name} --contract-name ${contract_name}
```

Currently supported chains:

- `Polygon Mumbai` (id: polygon-testnet)
