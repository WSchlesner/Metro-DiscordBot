const { SapphireClient } = require("@sapphire/framework");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const config = require("../config.json");

const client = new SapphireClient({
  intents: ["GUILDS"],
  allowedMentions: {
    roles: [],
    users: [],
  },
});

// Map of command name -> minimum role required
const COMMAND_ROLES = {
  leaderboard:           ["whitelisted", "eventManager", "support", "mod", "admin", "seniorAdmin", "owner"],
  playerstats:           ["whitelisted", "eventManager", "support", "mod", "admin", "seniorAdmin", "owner"],
  messageserver:         ["eventManager", "support", "mod", "admin", "seniorAdmin", "owner"],
  getwhitelist:          ["support", "mod", "admin", "seniorAdmin", "owner"],
  whitelist:             ["support", "mod", "admin", "seniorAdmin", "owner"],
  unwhitelist:           ["support", "mod", "admin", "seniorAdmin", "owner"],
  getbans:               ["support", "mod", "admin", "seniorAdmin", "owner"],
  serverinfo:            ["mod", "admin", "seniorAdmin", "owner"],
  serverstats:           ["mod", "admin", "seniorAdmin", "owner"],
  kick:                  ["mod", "admin", "seniorAdmin", "owner"],
  listqueuepriority:     ["mod", "admin", "seniorAdmin", "owner"],
  ban:                   ["mod", "admin", "seniorAdmin", "owner"],
  unban:                 ["mod", "admin", "seniorAdmin", "owner"],
  playerlist:            ["admin", "seniorAdmin", "owner"],
  messageplayer:         ["admin", "seniorAdmin", "owner"],
  putqueuepriority:      ["admin", "seniorAdmin", "owner"],
  deletequeuepriority:   ["admin", "seniorAdmin", "owner"],
  lookup:                ["admin", "seniorAdmin", "owner"],
  permban:               ["admin", "seniorAdmin", "owner"],
};

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const rest = new REST({ version: "9" }).setToken(config.token);

    // Fetch all guild commands to get their IDs
    const commands = await rest.get(
      Routes.applicationGuildCommands(config.clientId, config.guildId)
    );

    // Build permissions for each command
    const permissions = commands
      .filter((cmd) => COMMAND_ROLES[cmd.name])
      .map((cmd) => ({
        id: cmd.id,
        permissions: COMMAND_ROLES[cmd.name].map((roleName) => ({
          id: config.roles[roleName],
          type: 1, // Role type
          permission: true
        }))
      }));

    // Apply permissions
    await rest.put(
      Routes.guildApplicationCommandsPermissions(config.clientId, config.guildId),
      { body: permissions }
    );

    console.log("Command permissions set successfully.");
  } catch (error) {
    console.error("Failed to set command permissions:", error);
  }
});

client.login(config.token);