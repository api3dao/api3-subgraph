# API3 subgraph

## Local Development

1. For the scripts in `package.json` to work, you need to load your environment variables. The most convient way to doing this:
   1. Copy `.env.example` to `.env`, and check / change the desired values
   2. run the scripts like this: `npx dotenv-cli yarn script-name` (the [dotenv-cli](https://www.npmjs.com/package/dotenv-cli) will load the variables from the file named `.env` defaultly)
2. Start a local graph node:
   run `yarn compose-local-graph-node` (modify `.env` file to configure ports and chain names/urls)
3. Common scripts for subgraph development in `package.json > scripts`:

   - `compose-local-graph-node`: just a shortcut for `docker-compose up` for the docker-compose.local.yml file

   - you most probably using these in this order:
     1. `generate-types`: generate the typescript types for the specified contract subgraph (controlled by the `CONTRACT_NAME` env variable)
     2. `generate-chain-specific-configs`: generate all the subgraph.\${CHAIN_NAME}.yaml files for the specified contract subgraph (controlled by the `CONTRACT_NAME` env variable) for all the specified chains (controlled by the `CHAINS` env variable, or - if it's not presented - by `chains` property in `subgraph_infrastructure.yaml`)
     3. `build`: build the subgraph for the specified contract subgraph and specified chain (controlled by the `CONTRACT_NAME` and `CHAIN_NAME` env variables)
     4. `register`: register a subgraph in the graph node (controlled by the `SUBGRAPH_NAME` and `GRAPH_NODE` env variables), `unregister` is the same, but for removing the registration
     5. `deploy`: deploy the specified contract subgraph to the graph node (controlled by the `SUBGRAPH_NAME` (need to be registered before), `CONTRACT_NAME`, `CHAIN_NAME`, `IPFS_NODE`, `GRAPH_NODE`, `VERSION_LABEL` env variables)
     6. `generate-build-deploy`: just a shortcut to run all the above scripts all at once

## Adding a new subgraph

### Keep the naming convention for new subgraphs for the scripts to be able to work: `subgraphs/$ContractName/src/subgraph.yaml`.

1. create a new folder with the **exact name of the contract** `subgraphs/$ContractName`
2. create an src folder inside it `subgraphs/$ContractName/src`
3. Create the `subgraph.yaml` and the schema and mapping files inside the `src` folder (see the other subgraphs for examples)
4. **Add the `generate-abis` script to the package.json** (see the other `generate-abis` scripts for examples)
   1. create the `$contract-name:generate-abis` script
   2. extend the `postinstall` script with it (so it will generate all the abis automatically when you install the dependencies)

## Deploy on production:

1. install dependencies `yarn install`
2. export AWS credentials
3. run the deployment script
   ```bash
   ./scripts/deploy-public-chain.sh --chain-name ${chain_name} --contract-name ${contract_name}
   ```

Currently supported chains:

- `Polygon Mumbai` (id: polygon-testnet)
- `Polygon zkevm` (id: polygon-zkevm)
- `Arbitrum` (id: arbitrum)
