const yaml = require("js-yaml");
const fs = require("fs");

const subgraphPath = process.env.CONTRACT_NAME;
if (!subgraphPath) throw new Error("CONTRACT_NAME env var is required");
const networkName = process.env.NETWORK_NAME;
if (!networkName) throw new Error("NETWORK_NAME env var is required");
const dataSourcesJson = process.env.DATA_SOURCES;
if (!dataSourcesJson) throw new Error("DATA_SOURCES env var is required");
const newDataSources = JSON.parse(dataSourcesJson);

const subgraph = yaml.load(
  fs.readFileSync(
    __dirname + `/../subgraphs/${subgraphPath}/src/subgraph.yaml`,
    "utf8"
  )
);

subgraph.dataSources.forEach((dataSourceInSubgraph) => {
  if (newDataSources[dataSourceInSubgraph.name]) {
    // if we have a matching data source in the networks.json, overwrite it in the subgraph.yaml
    const newDataSource = newDataSources[dataSourceInSubgraph.name];
    dataSourceInSubgraph.network = networkName;
    if (newDataSource.address)
      dataSourceInSubgraph.source.address = newDataSource.address;
    if (newDataSource.startBlock)
      dataSourceInSubgraph.source.startBlock = newDataSource.startBlock;
  }
});

// write the updated subgraph.yaml
fs.writeFileSync(
  __dirname + `/../subgraphs/${subgraphPath}/src/subgraph.yaml`,
  yaml.dump(subgraph)
);
