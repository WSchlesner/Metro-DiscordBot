const { Command } = require("@sapphire/framework");
const { SteamId64 } = require("cftools-sdk");
const api = require("../api.js");
const config = require("../../config.json");

module.exports = class extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: "deletewhitelist",
      description: "Delete a player from the whitelist",
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
            .setDescription("ID of the player to delete from the whitelist")
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

    try {
      await api.deleteWhitelist(SteamId64.of(steam64id));
    } catch (e) {
      if (e?.message.startsWith("ResourceNotFound")) {
        return await interaction.followUp("Player not found.");
      }
      return await interaction.followUp(`Error: ${e.message}`);
    }
    await interaction.followUp(`Deleted \`${steam64id}\` from the whitelist.`);
  }
};
