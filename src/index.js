const { SapphireClient } = require("@sapphire/framework");
const config = require("../config.json");

const client = new SapphireClient({
  intents: ["GUILDS"],
  allowedMentions: {
    roles: [],
    users: [],
  },
});

client.login(config.token);
