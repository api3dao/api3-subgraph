const yaml = require("js-yaml");
const fs = require("fs");

const subgraphName = process.env.SUBGRAPH_NAME;
if (!subgraphName) throw new Error("SUBGRAPH_NAME env var is required");
const networkName = process.env.NETWORK_NAME;
if (!networkName) throw new Error("NETWORK_NAME env var is required");

const subgraph = yaml.load(
  fs.readFileSync(
    __dirname + `/../subgraphs/${subgraphName}/src/subgraph.yaml`,
    "utf8"
  )
);

const dataSources = JSON.parse(
  fs.readFileSync(
    __dirname + `/../subgraphs/${subgraphName}/data-sources.json`,
    "utf8"
  )
);
dataSourceOverwrite = dataSources[networkName];

subgraph.dataSources.forEach((dataSourceInSubgraph) => {
  if (dataSourceOverwrite[dataSourceInSubgraph.name]) {
    // if we have a matching data source in the data-sources.json, overwrite it in the subgraph.yaml
    const overwrite = dataSourceOverwrite[dataSourceInSubgraph.name];
    if (overwrite.network) dataSourceInSubgraph.network = overwrite.network;
    if (overwrite.address)
      dataSourceInSubgraph.source.address = overwrite.address;
    if (overwrite.startBlock)
      dataSourceInSubgraph.source.startBlock = overwrite.startBlock;
  }
});

// write the updated subgraph.yaml
fs.writeFileSync(
  __dirname + `/../subgraphs/${subgraphName}/src/subgraph.yaml`,
  yaml.dump(subgraph)
);
