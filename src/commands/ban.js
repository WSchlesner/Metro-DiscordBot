const { Command } = require("@sapphire/framework");
const api = require("../api.js");
const { hasRole } = require("../lib/roles.js");
const config = require("../../config.json");

module.exports = class extends Command {
  constructor(context, options) {
    super(context, { ...options, name: "ban", description: "Issue a temporary ban" });
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
          )
          .addIntegerOption((option) =>
            option.setName("duration").setDescription("Ban duration").setRequired(true)
              .setChoices(
                { name: "1 hour", value: 60 * 60 * 1000 },
                { name: "3 hours", value: 3 * 60 * 60 * 1000 },
                { name: "6 hours", value: 6 * 60 * 60 * 1000 },
                { name: "12 hours", value: 12 * 60 * 60 * 1000 },
                { name: "1 day", value: 24 * 60 * 60 * 1000 },
                { name: "3 days", value: 3 * 24 * 60 * 60 * 1000 }
              )
          ),
      { guildIds: [config.guildId] }
    );
  }

  async chatInputRun(interaction) {
    if (!hasRole(interaction.member, "mod"))
      return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });

    await interaction.deferReply();
    const steam64id = interaction.options.getString("steam64id", true);
    const reason = interaction.options.getString("reason", true);
    const duration = interaction.options.getInteger("duration", true);
    const expires_at = new Date(Date.now() + duration).toISOString();

    try {
      const cftools_id = await api.lookupCFToolsId(steam64id);
      await api.issueBan({ cftools_id, reason, expires_at });
      await interaction.followUp(
        `Banned \`${steam64id}\` until <t:${parseInt(new Date(expires_at).getTime() / 1000)}:f>. Reason: ${reason}`
      );
    } catch (e) {
      return await interaction.followUp(`Error: ${e.message}`);
    }
  }
};