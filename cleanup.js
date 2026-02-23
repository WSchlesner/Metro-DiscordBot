const { Client, Intents } = require("discord.js");
const config = require("./config.json");

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.once("ready", async () => {
  try {
    console.log("Clearing global commands...");
    await client.application.commands.set([]);
    console.log("Successfully cleared global commands!");
  } catch (error) {
    console.error(error);
  } finally {
    client.destroy();
  }
});

client.login(config.token);
