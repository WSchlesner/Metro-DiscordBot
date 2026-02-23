const { Command } = require("@sapphire/framework");
const api = require("../api.js");
const config = require("../../config.json");

module.exports = class extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: "putqueuepriority",
      description: "Add a queue priority entry for a player",
    });
  }

  async registerApplicationCommands(registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .setDMPermission(false)
          .addStringOption((option) =>
            option
              .setName("steam64id")
              .setDescription("Steam64 ID of the player to give queue priority")
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("comment")
              .setDescription("Comment for the queue priority entry")
              .setRequired(true)
          )
          .addIntegerOption((option) =>
            option
              .setName("duration")
              .setDescription("Duration of the queue priority (default: Permanent)")
              .setRequired(false)
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
    if (!interaction.member.roles.cache.has(config.moderatorRole))
      return interaction.reply("You don't have permission to use this command.");

    await interaction.deferReply();
    const steam64id = interaction.options.getString("steam64id", true);
    const comment = interaction.options.getString("comment", true);
    const duration = interaction.options.getInteger("duration", false);

    // duration === 0 means Permanent was selected, null means no option chosen (also permanent)
    const expires_at = (duration && duration > 0)
      ? new Date(Date.now() + duration).toISOString()
      : null;

    try {
      const cftools_id = await api.lookupCFToolsId(steam64id);

      await api.putQueuePriority({
        cftools_id,
        comment,
        expires_at
      });
    } catch (e) {
      return await interaction.followUp(`Error: ${e.message}`);
    }

    await interaction.followUp(
      `Added queue priority for \`${steam64id}\` ${
        expires_at
          ? `until <t:${parseInt(new Date(expires_at).getTime() / 1000)}:f>`
          : "permanently"
      }.`
    );
  }
};