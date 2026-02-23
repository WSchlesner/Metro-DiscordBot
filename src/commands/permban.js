const { Command } = require("@sapphire/framework");
const api = require("../api.js");
const { hasRole } = require("../lib/roles.js");
const config = require("../../config.json");

module.exports = class extends Command {
  constructor(context, options) {
    super(context, { ...options, name: "permban", description: "Issue a permanent ban" });
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
          )
          .addStringOption((option) =>
            option.setName("reason").setDescription("Reason for the ban").setRequired(true)
          ),
      { guildIds: [config.guildId] }
    );
  }

  async chatInputRun(interaction) {
    if (!hasRole(interaction.member, "admin"))
      return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });

    await interaction.deferReply();
    const steam64id = interaction.options.getString("steam64id", true);
    const reason = interaction.options.getString("reason", true);

    try {
      const cftools_id = await api.lookupCFToolsId(steam64id);
      await api.issueBan({ cftools_id, reason, expires_at: null });
      await interaction.followUp(`Permanently banned \`${steam64id}\`. Reason: ${reason}`);
    } catch (e) {
      return await interaction.followUp(`Error: ${e.message}`);
    }
  }
};