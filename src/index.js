const { SapphireClient } = require("@sapphire/framework");
const config = require("../config.json");

const client = new SapphireClient({
  intents: ["GUILDS"],
  allowedMentions: {
    roles: [],
    users: [],
  },
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(config.token);