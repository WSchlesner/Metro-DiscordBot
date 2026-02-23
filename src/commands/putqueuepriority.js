const { Command } = require("@sapphire/framework");
const api = require("../api.js");
const { hasRole } = require("../lib/roles.js");
const config = require("../../config.json");

module.exports = class extends Command {
  constructor(context, options) {
    super(context, { ...options, name: "putqueuepriority", description: "Add queue priority for a player" });
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
            option.setName("comment").setDescription("Comment for this entry").setRequired(true)
          )
          .addIntegerOption((option) =>
            option.setName("duration").setDescription("Duration (default: Permanent)").setRequired(false)
              .setChoices(
                { name: "Permanent", value: 0 },
                { name: "1 day", value: 24 * 60 * 60 * 1000 },
                { name: "3 days", value: 3 * 24 * 60 * 60 * 1000 },
                { name: "5 days", value: 5 * 24 * 60 * 60 * 1000 },
                { name: "1 week", value: 7 * 24 * 60 * 60 * 1000 },
                { name: "2 weeks", value: 14 * 24 * 60 * 60 * 1000 },
                { name: "1 month", value: 30 * 24 * 60 * 60 * 1000 }
              )
          ),
      { guildIds: [config.guildId] }
    );
  }

  async chatInputRun(interaction) {
    if (!hasRole(interaction.member, "admin"))
      return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });

    await interaction.deferReply();
    const steam64id = interaction.options.getString("steam64id", true);
    const comment = interaction.options.getString("comment", true);
    const duration = interaction.options.getInteger("duration", false);
    const expires_at = (duration && duration > 0) ? new Date(Date.now() + duration).toISOString() : null;

    try {
      const cftools_id = await api.lookupCFToolsId(steam64id);
      await api.putQueuePriority({ cftools_id, comment, expires_at });
      await interaction.followUp(
        `Added queue priority for \`${steam64id}\` ${expires_at ? `until <t:${parseInt(new Date(expires_at).getTime() / 1000)}:f>` : "permanently"}.`
      );
    } catch (e) {
      return await interaction.followUp(`Error: ${e.message}`);
    }
  }
};