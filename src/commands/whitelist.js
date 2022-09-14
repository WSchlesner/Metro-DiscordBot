const { Command } = require("@sapphire/framework");
const { SteamId64 } = require("cftools-sdk");
const api = require("../api.js");
const config = require("../../config.json");

module.exports = class extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: "whitelist",
      description: "Put a player on the whitelist",
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
            .setDescription("ID of the player to put on the whitelist")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("comment")
            .setDescription("Additional comment")
            .setRequired(true)
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
    const comment = interaction.options.getString("comment", true);

    try {
      await api.putWhitelist({
        id: SteamId64.of(steam64id),
        comment,
      });
    } catch (e) {
      if (e?.message.startsWith("ResourceNotFound")) {
        return await interaction.followUp("Player not found.");
      }
      return await interaction.followUp(`Error: ${e.message}`);
    }

    await interaction.followUp(`Added \`${steam64id}\` to the whitelist.`);
  }
};
