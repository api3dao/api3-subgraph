const yaml = require("js-yaml");
const fs = require("fs");

const CONTRACT_NAME = process.env.CONTRACT_NAME;
if (!CONTRACT_NAME) throw new Error("CONTRACT_NAME env var is required");
let CHAINS_JSON = process.env.CHAINS;

let chains;
if (CHAINS_JSON) {
  // Either use the explicit CHAINS env variable
  console.info("Reading chains from CHAINS env variable...");
  chains = JSON.parse(CHAINS_JSON);
} else {
  // Or read the chains from the subgraph_infrastructure.yaml file and config values from the airnode-protocol-v1 repo
  console.info(
    "CHAINS env variable is not provided. Reading chains from subgraph_infrastructure.yaml and airnode-protocol-v1 repo..."
  );
  const infrastructure = yaml.load(
    fs.readFileSync(__dirname + `/../subgraph_infrastructure.yaml`, "utf8")
  );
  const chainNames = Object.keys(infrastructure.chains);

  // load contract addresses and deployment block numbers from airnode-protocol-v1 repo
  const references = JSON.parse(
    fs.readFileSync(
      __dirname +
        `/../node_modules/@api3/airnode-protocol-v1/deployments/references.json`,
      "utf8"
    )
  );
  const blocNumbers = JSON.parse(
    fs.readFileSync(
      __dirname +
        `/../node_modules/@api3/airnode-protocol-v1/deployments/deployment-block-numbers.json`,
      "utf8"
    )
  );
  if (!references[CONTRACT_NAME] || !blocNumbers[CONTRACT_NAME]) {
    throw new Error(
      `contract deployment not found for contract '${CONTRACT_NAME}'.`
    );
  }
  const chainIds = Object.fromEntries(
    Object.entries(references.chainNames).map((chainEntry) =>
      chainEntry.reverse()
    )
  );

  // create the chains object
  chains = [];
  chainNames.forEach((chainName) => {
    const chainId = chainIds[chainName];
    if (
      !references[CONTRACT_NAME][chainId] ||
      !blocNumbers[CONTRACT_NAME][chainId]
    ) {
      throw new Error(
        `contract deployment not found for contract '${CONTRACT_NAME}' in chain '${chainName}'.`
      );
    }
    chains.push({
      network: chainName,
      sources: {
        [CONTRACT_NAME]: {
          address: references[CONTRACT_NAME][chainId],
          startBlock: blocNumbers[CONTRACT_NAME][chainId],
        },
      },
    });
  });
}

const baseSubgraphConfig = yaml.load(
  fs.readFileSync(
    __dirname + `/../subgraphs/${CONTRACT_NAME}/src/subgraph.yaml`,
    "utf8"
  )
);

// generate the chain specific yaml files
chains.forEach((chain) => {
  console.info(chain.network + ": generating chain specific yaml file...");

  const contractSubgraphConfig = structuredClone(baseSubgraphConfig);

  // update the data source
  if (
    !contractSubgraphConfig.dataSources ||
    contractSubgraphConfig.dataSources.length !== 1
  ) {
    throw new Error(
      `subgraph.yaml must have exactly one data source (one subgraph per contract), found ${contractSubgraphConfig.dataSources.length}`
    );
  }
  const contractDataSource = contractSubgraphConfig.dataSources[0];
  contractDataSource.network = chain.network;
  contractDataSource.source.address = chain.sources[CONTRACT_NAME].address;
  contractDataSource.source.startBlock =
    chain.sources[CONTRACT_NAME].startBlock;

  // write the chain-specific subgraph.${chain}.yaml
  fs.writeFileSync(
    __dirname +
      `/../subgraphs/${CONTRACT_NAME}/src/subgraph.${chain.network}.yaml`,
    yaml.dump(contractSubgraphConfig)
  );
});
