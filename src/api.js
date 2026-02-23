const { CFToolsClientBuilder } = require("cftools-sdk");
const { cftools } = require("../config.json");

// ORIGINAL LINE module.exports = new CFToolsClientBuilder()
const client = new CFToolsClientBuilder()
  .withServerApiId(cftools.serverId)
  .withCredentials(cftools.appId, cftools.appSecret)
  .build();

// Extend the client with queue priority methods
const api = {
  // Base client methods
  ...client,

  // Get all queue priority entries
  async getQueuePriority() {
    const response = await client.get(`/v1/server/${cftools.serverId}/queuepriority`);
    return response.data;
  },

  // Add or update a queue priority entry
  async putQueuePriority({ cftools_id, comment, expires_at = null }) {
    const response = await client.post(`/v1/server/${cftools.serverId}/queuepriority`, {
      cftools_id: cftools_id.toString(),
      comment,
      expires_at
    });
    return response.data;
  },

  // Delete a queue priority entry
  async deleteQueuePriority({ cftools_id }) {
    const response = await client.delete(`/v1/server/${cftools.serverId}/queuepriority`, {
      data: {
        cftools_id: cftools_id.toString()
      }
    });
    return response.data;
  }
};

module.exports = api;
