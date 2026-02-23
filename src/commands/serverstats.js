const { Command } = require("@sapphire/framework");
const api = require("../api.js");
const { hasRole } = require("../lib/roles.js");
const config = require("../../config.json");

module.exports = class extends Command {
  constructor(context, options) {
    super(context, { ...options, name: "serverstats", description: "Get server statistics" });
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
      const data = await api.getServerStatistics();

      await interaction.followUp([
        `**Server Statistics**`,
        `Total Sessions: ${data.total_sessions ?? "N/A"}`,
        `Total Playtime: ${data.total_playtime ? `${Math.floor(data.total_playtime / 3600)}h` : "N/A"}`,
        `Total Kills: ${data.total_kills ?? "N/A"}`,
        `Total Deaths: ${data.total_deaths ?? "N/A"}`
      ].join("\n"));
    } catch (e) {
      return await interaction.followUp(`Error: ${e.message}`);
    }
  }
};