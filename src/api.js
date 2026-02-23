const { CFToolsClientBuilder } = require("cftools-sdk");
const { cftools } = require("../config.json");

const client = new CFToolsClientBuilder()
  .withServerApiId(cftools.serverId)
  .withCredentials(cftools.appId, cftools.appSecret)
  .build();

const BASE_URL = "https://data.cftools.cloud";

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
  // SDK passthroughs
  putBan: (...args) => client.putBan(...args),
  deleteBans: (...args) => client.deleteBans(...args),
  putWhitelist: (...args) => client.putWhitelist(...args),
  deleteWhitelist: (...args) => client.deleteWhitelist(...args),

  // Lookup CFTools ID from Steam64
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
    if (!data.cftools_id) throw new Error("Could not resolve Steam64 ID to CFTools ID. Has this player joined the server before?");
    return data.cftools_id;
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

  // Get player stats
  async getPlayerStats(cftools_id) {
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
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `CFTools API error: ${response.status}`);
    }
    const data = await response.json();
    return data[cftools_id] || null;
  },

  // Get leaderboard
  async getLeaderboard({ stat, order = -1, limit = 10 }) {
    const token = await getToken();
    const response = await fetch(
      `${BASE_URL}/v1/server/${cftools.serverId}/leaderboard?stat=${stat}&order=${order}&limit=${limit}`,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "User-Agent": cftools.appId
        }
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `CFTools API error: ${response.status}`);
    }
    return await response.json();
  },

  // Get server info
  async getServerInfo() {
    const token = await getToken();
    const response = await fetch(
      `${BASE_URL}/v1/server/${cftools.serverId}/info`,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "User-Agent": cftools.appId
        }
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `CFTools API error: ${response.status}`);
    }
    return await response.json();
  },

  // Get server statistics
  async getServerStatistics() {
    const token = await getToken();
    const response = await fetch(
      `${BASE_URL}/v1/server/${cftools.serverId}/statistics`,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "User-Agent": cftools.appId
        }
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `CFTools API error: ${response.status}`);
    }
    return await response.json();
  },

  // Get full player list (GSM)
  async getPlayerList() {
    const token = await getToken();
    const response = await fetch(
      `${BASE_URL}/v1/server/${cftools.serverId}/GSM/list`,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "User-Agent": cftools.appId
        }
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `CFTools API error: ${response.status}`);
    }
    return await response.json();
  },

  // Kick player
  async kickPlayer({ gamesession_id, reason }) {
    const token = await getToken();
    const response = await fetch(
      `${BASE_URL}/v1/server/${cftools.serverId}/kick`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": cftools.appId
        },
        body: JSON.stringify({ gamesession_id, reason })
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `CFTools API error: ${response.status}`);
    }
  },

  // Send private message
  async messagePrivate({ gamesession_id, content }) {
    const token = await getToken();
    const response = await fetch(
      `${BASE_URL}/v1/server/${cftools.serverId}/message-private`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": cftools.appId
        },
        body: JSON.stringify({ gamesession_id, content })
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `CFTools API error: ${response.status}`);
    }
  },

  // Send public server message
  async messageServer({ content }) {
    const token = await getToken();
    const response = await fetch(
      `${BASE_URL}/v1/server/${cftools.serverId}/message-server`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": cftools.appId
        },
        body: JSON.stringify({ content })
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `CFTools API error: ${response.status}`);
    }
  },

  // Whitelist
  async getWhitelistEntry(cftools_id) {
    const token = await getToken();
    const response = await fetch(
      `${BASE_URL}/v1/server/${cftools.serverId}/whitelist?cftools_id=${cftools_id}`,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "User-Agent": cftools.appId
        }
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `CFTools API error: ${response.status}`);
    }
    const data = await response.json();
    return data.entries || [];
  },

  async createWhitelistEntry({ cftools_id, comment, expires_at = null }) {
    const token = await getToken();
    const response = await fetch(
      `${BASE_URL}/v1/server/${cftools.serverId}/whitelist`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": cftools.appId
        },
        body: JSON.stringify({ cftools_id, comment, expires_at })
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `CFTools API error: ${response.status}`);
    }
  },

  async deleteWhitelistEntry({ cftools_id }) {
    const token = await getToken();
    const response = await fetch(
      `${BASE_URL}/v1/server/${cftools.serverId}/whitelist`,
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
  },

  // Queue Priority
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
    const response = await fetch(
      `${BASE_URL}/v1/server/${cftools.serverId}/queuepriority`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": cftools.appId
        },
        body: JSON.stringify({ cftools_id, comment, expires_at })
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
  },

  // Bans
  async getBans(filter) {
    const token = await getToken();
    const url = filter
      ? `${BASE_URL}/v1/banlist/${cftools.banlist}/bans?filter=${filter}`
      : `${BASE_URL}/v1/banlist/${cftools.banlist}/bans`;
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "User-Agent": cftools.appId
      }
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `CFTools API error: ${response.status}`);
    }
    const data = await response.json();
    return data.entries || [];
  },

  async issueBan({ cftools_id, reason, expires_at = null }) {
    const token = await getToken();
    const response = await fetch(
      `${BASE_URL}/v1/banlist/${cftools.banlist}/bans`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": cftools.appId
        },
        body: JSON.stringify({
          format: "cftools_id",
          identifier: cftools_id,
          reason,
          expires_at
        })
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `CFTools API error: ${response.status}`);
    }
  },

  async revokeBan(ban_id) {
    const token = await getToken();
    const response = await fetch(
      `${BASE_URL}/v1/banlist/${cftools.banlist}/bans`,
      {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": cftools.appId
        },
        body: JSON.stringify({ ban_id })
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `CFTools API error: ${response.status}`);
    }
  }
};

module.exports = api;