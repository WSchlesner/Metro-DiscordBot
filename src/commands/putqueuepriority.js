const { Command } = require("@sapphire/framework");
const { SteamId64 } = require("cftools-sdk");
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
              .setDescription("ID of the player to give queue priority")
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
              .setDescription("Duration of the queue priority (permanent if not set)")
              .setRequired(false)
              .setChoices(
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
    const expires_at = duration ? new Date(Date.now() + duration) : null;

    try {
      await api.putQueuePriority({
        cftools_id: SteamId64.of(steam64id),
        comment,
        expires_at
      });
    } catch (e) {
      if (e?.message.startsWith("ResourceNotFound")) {
        return await interaction.followUp("Player not found.");
      }
      return await interaction.followUp(`Error: ${e.message}`);
    }

    await interaction.followUp(
      `Added queue priority for \`${steam64id}\` ${
        expires_at
          ? `until <t:${parseInt(expires_at.getTime() / 1000)}:f>`
          : "permanently"
      }.`
    );
  }
};
