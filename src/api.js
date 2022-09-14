const { CFToolsClientBuilder } = require("cftools-sdk");
const { cftools } = require("../config.json");

module.exports = new CFToolsClientBuilder()
  .withServerApiId(cftools.serverId)
  .withCredentials(cftools.appId, cftools.appSecret)
  .build();
