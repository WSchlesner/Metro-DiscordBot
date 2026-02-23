const { Command } = require("@sapphire/framework");
const api = require("../api.js");
const { hasRole } = require("../lib/roles.js");
const config = require("../../config.json");

module.exports = class extends Command {
  constructor(context, options) {
    super(context, { ...options, name: "playerlist", description: "Get the full list of online players" });
  }

  async registerApplicationCommands(registry) {
    registry.registerChatInputCommand(
      (builder) => builder.setName(this.name).setDescription(this.description).setDMPermission(false),
      { guildIds: [config.guildId] }
    );
  }

  async chatInputRun(interaction) {
    if (!hasRole(interaction.member, "admin"))
      return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });

    await interaction.deferReply();

    try {
      const data = await api.getPlayerList();
      const sessions = data.sessions || [];

      if (!sessions.length) return await interaction.followUp("No players currently online.");

      const lines = sessions.map((s, i) =>
        `**${i + 1}.** ${s.persona?.name || "Unknown"} | Steam64: \`${s.persona?.steam64 || "N/A"}\` | Playtime: ${Math.floor((s.playtime || 0) / 60)}m`
      );

      // Paginate if needed
      const chunks = [];
      let current = `**Online Players (${sessions.length})**\n\n`;
      for (const line of lines) {
        if ((current + line + "\n").length > 1900) {
          chunks.push(current);
          current = "";
        }
        current += line + "\n";
      }
      if (current) chunks.push(current);

      for (const chunk of chunks) {
        await interaction.followUp(chunk);
      }
    } catch (e) {
      return await interaction.followUp(`Error: ${e.message}`);
    }
  }
};