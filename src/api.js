const { CFToolsClientBuilder } = require("cftools-sdk");
const { cftools } = require("../config.json");

// SDK client for whitelist and ban operations
const client = new CFToolsClientBuilder()
  .withServerApiId(cftools.serverId)
  .withCredentials(cftools.appId, cftools.appSecret)
  .build();

const BASE_URL = "https://data.cftools.cloud";

// Get a Bearer token from CFTools API
async function getToken() {
  const response = await fetch(`${BASE_URL}/v1/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": cftools.appId
    },
    body: JSON.stringify({
      application_id: cftools.appId,
      secret: cftools.appSecret
    })
  });
  const data = await response.json();
  if (!data.token) throw new Error("Failed to authenticate with CFTools API");
  return data.token;
}

const api = {
  // Pass through SDK methods for ban/whitelist
  putBan: (...args) => client.putBan(...args),
  deleteBans: (...args) => client.deleteBans(...args),
  putWhitelist: (...args) => client.putWhitelist(...args),
  deleteWhitelist: (...args) => client.deleteWhitelist(...args),

  // Queue Priority - direct REST API calls
  async getQueuePriority() {
  const token = await getToken();
  const response = await fetch(
    `${BASE_URL}/v1/server/${cftools.queuePriorityServerId}/queuepriority`,
    {
      headers: {
        "Authorization": `Bearer ${token}`,
        "User-Agent": cftools.appId
      }
    }
  );
  
  console.log("Status:", response.status);
  console.log("Headers:", Object.fromEntries(response.headers));
  const text = await response.text();
  console.log("Raw response:", text);
  
  if (!response.ok) throw new Error(`CFTools API error: ${response.status}`);
  return text.trim().split("\n").filter(Boolean).map(line => JSON.parse(line));
},

  async putQueuePriority({ cftools_id, comment, expires_at = null }) {
    const token = await getToken();
    const response = await fetch(
      `${BASE_URL}/v1/server/${cftools.queuePriorityServerId}/queuepriority`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": cftools.appId
        },
        body: JSON.stringify({
          cftools_id: cftools_id.toString(),
          comment,
          expires_at
        })
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `CFTools API error: ${response.status}`);
    }
  },

  async deleteQueuePriority({ cftools_id }) {
    const token = await getToken();
    const response = await fetch(
      `${BASE_URL}/v1/server/${cftools.queuePriorityServerId}/queuepriority`,
      {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": cftools.appId
        },
        body: JSON.stringify({
          cftools_id: cftools_id.toString()
        })
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `CFTools API error: ${response.status}`);
    }
  }
};

module.exports = api;
