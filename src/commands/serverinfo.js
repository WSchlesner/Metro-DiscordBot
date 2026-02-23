const { Command } = require("@sapphire/framework");
const api = require("../api.js");
const { hasRole } = require("../lib/roles.js");
const config = require("../../config.json");

module.exports = class extends Command {
  constructor(context, options) {
    super(context, { ...options, name: "serverinfo", description: "Get general server information" });
  }

  async registerApplicationCommands(registry) {
    registry.registerChatInputCommand(
      (builder) => builder.setName(this.name).setDescription(this.description).setDMPermission(false),
      { guildIds: [config.guildId] }
    );
  }

  async chatInputRun(interaction) {
    if (!hasRole(interaction.member, "mod"))
      return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });

    await interaction.deferReply();

    try {
      const data = await api.getServerInfo();
      const info = data.server || data;

      await interaction.followUp([
        `**Server Info**`,
        `Name: ${info.name || "N/A"}`,
        `Status: ${info.status || "N/A"}`,
        `Players: ${info.online ?? "N/A"}/${info.slots ?? "N/A"}`,
        `Map: ${info.map || "N/A"}`,
        `Version: ${info.version || "N/A"}`
      ].join("\n"));
    } catch (e) {
      return await interaction.followUp(`Error: ${e.message}`);
    }
  }
};