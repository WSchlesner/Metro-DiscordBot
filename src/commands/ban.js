const { Command } = require("@sapphire/framework");
const { SteamId64, Banlist } = require("cftools-sdk");
const api = require("../api.js");
const config = require("../../config.json");

module.exports = class extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: "ban",
      description: "Put a player on the ban list",
    });
  }

  /**
   * @param {Command.Registry} registry
   */
  async registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setDMPermission(false)
        .addStringOption((option) =>
          option
            .setName("steam64id")
            .setDescription("ID of the player to put on the ban list")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("Reason for the ban")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("duration")
            .setDescription("Duration of the ban")
            .setRequired(false)
            .setChoices(
              { name: "5 minutes", value: 5 * 60 * 1000 },
              { name: "10 minutes", value: 10 * 60 * 1000 },
              { name: "15 minutes", value: 15 * 60 * 1000 },
              { name: "30 minutes", value: 30 * 60 * 1000 },
              { name: "1 hour", value: 60 * 60 * 1000 },
              { name: "3 hours", value: 3 * 60 * 60 * 1000 },
              { name: "5 hours", value: 5 * 60 * 60 * 1000 },
              { name: "12 hours", value: 12 * 60 * 60 * 1000 },
              { name: "1 day", value: 24 * 60 * 60 * 1000 },
              { name: "3 days", value: 3 * 24 * 60 * 60 * 1000 },
              { name: "3 days", value: 5 * 24 * 60 * 60 * 1000 },
              { name: "1 week", value: 7 * 24 * 60 * 60 * 1000 },
              { name: "10 days", value: 10 * 24 * 60 * 60 * 1000 }
            )
        )
    );
  }

  /**
   * @param {Command.ChatInputInteraction} interaction
   */
  async chatInputRun(interaction) {
    if (!interaction.member.roles.cache.has(config.moderatorRole))
      return interaction.reply(
        "You don't have permission to use this command."
      );
    await interaction.deferReply();
    const steam64id = interaction.options.getString("steam64id", true);
    const reason = interaction.options.getString("reason", true);
    const duration = interaction.options.getInteger("duration", false);

    const expiration = duration ? new Date(Date.now() + duration) : "Permanent";

    try {
      await api.putBan({
        playerId: SteamId64.of(steam64id),
        list: Banlist.of(config.cftools.banlist),
        reason,
        expiration,
      });
    } catch (e) {
      if (e?.message.startsWith("ResourceNotFound")) {
        return await interaction.followUp("Player not found.");
      }
      return await interaction.followUp(`Error: ${e.message}`);
    }

    await interaction.followUp(
      `Banned \`${steam64id}\` ${
        expiration === "Permanent"
          ? "permanently"
          : `until <t:${parseInt(expiration.getTime() / 1000)}:f>`
      }.`
    );
  }
};
