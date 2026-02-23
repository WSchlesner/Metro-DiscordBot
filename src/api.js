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

  // Lookup CFTools ID from Steam64 ID
  async lookupCFToolsId(steam64) {
    const token = await getToken();
    const response = await fetch(
      `${BASE_URL}/v1/users/lookup?identifier=${steam64}`,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "User-Agent": cftools.appId
        }
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `CFTools lookup error: ${response.status}`);
    }
    const data = await response.json();
    const cftoolsId = data.cftools_id;
    if (!cftoolsId) throw new Error("Could not resolve Steam64 ID to CFTools ID. Has this player joined the server before?");
    return cftoolsId;
  },

  // Get player profile by CFTools ID
  async getPlayerProfile(cftools_id) {
    const token = await getToken();
    const response = await fetch(
      `${BASE_URL}/v2/server/${cftools.serverId}/player?cftools_id=${cftools_id}`,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "User-Agent": cftools.appId
        }
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    const playerData = data[cftools_id];
    if (!playerData) return null;
    return {
      name: playerData.omega?.name_history?.[0] || "Unknown",
      steam64: playerData.identities?.steam?.steam64 || null
    };
  },

  // Queue Priority - direct REST API calls
  async getQueuePriority() {
    const token = await getToken();
    const response = await fetch(
      `${BASE_URL}/v1/server/${cftools.serverId}/queuepriority`,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "User-Agent": cftools.appId
        }
      }
    );
    if (!response.ok) throw new Error(`CFTools API error: ${response.status}`);
    const data = await response.json();
    return data.entries || [];
  },

  async putQueuePriority({ cftools_id, comment, expires_at = null }) {
    const token = await getToken();
    const body = {
      cftools_id,
      comment,
      expires_at
    };
    const response = await fetch(
      `${BASE_URL}/v1/server/${cftools.serverId}/queuepriority`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": cftools.appId
        },
        body: JSON.stringify(body)
      }
    );
    const responseText = await response.text();
    if (!response.ok) {
      let err = {};
      try { err = JSON.parse(responseText); } catch (_) {}
      throw new Error(err.error || `CFTools API error: ${response.status}`);
    }
  },

  async deleteQueuePriority({ cftools_id }) {
    const token = await getToken();
    const response = await fetch(
      `${BASE_URL}/v1/server/${cftools.serverId}/queuepriority`,
      {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": cftools.appId
        },
        body: JSON.stringify({ cftools_id })
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `CFTools API error: ${response.status}`);
    }
  }
};

module.exports = api;