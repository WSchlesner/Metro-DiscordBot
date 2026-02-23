const { Command } = require("@sapphire/framework");
const api = require("../api.js");
const { hasRole } = require("../lib/roles.js");
const config = require("../../config.json");

module.exports = class extends Command {
  constructor(context, options) {
    super(context, { ...options, name: "debug", description: "Debug raw API response for a player" });
  }

  async registerApplicationCommands(registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .setDMPermission(false)
          .addStringOption((option) =>
            option.setName("steam64id").setDescription("Steam64 ID of the player").setRequired(true)
          ),
      { guildIds: [config.guildId] }
    );
  }

  async chatInputRun(interaction) {
    if (!hasRole(interaction.member, "owner"))
      return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });

    await interaction.deferReply({ ephemeral: true });
    const steam64id = interaction.options.getString("steam64id", true);

    try {
      const cftools_id = await api.lookupCFToolsId(steam64id);
      const stats = await api.getPlayerStats(cftools_id);

      const raw = JSON.stringify(stats, null, 2);

      // Discord has a 2000 char limit, split into chunks
      const chunks = [];
      for (let i = 0; i < raw.length; i += 1900) {
        chunks.push(raw.slice(i, i + 1900));
      }

      await interaction.followUp({ content: `\`\`\`json\n${chunks[0]}\n\`\`\``, ephemeral: true });
      for (let i = 1; i < chunks.length; i++) {
        await interaction.followUp({ content: `\`\`\`json\n${chunks[i]}\n\`\`\``, ephemeral: true });
      }
    } catch (e) {
      return await interaction.followUp({ content: `Error: ${e.message}`, ephemeral: true });
    }
  }
};