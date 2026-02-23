const { Command } = require("@sapphire/framework");
const { SteamId64 } = require("cftools-sdk");
const api = require("../api.js");
const config = require("../../config.json");

module.exports = class extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: "deletequeuepriority",
      description: "Remove queue priority from a player",
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
              .setDescription("ID of the player to remove queue priority from")
              .setRequired(true)
          ),
      { guildIds: [config.guildId] }
    );
  }

  async chatInputRun(interaction) {
    if (!interaction.member.roles.cache.has(config.moderatorRole))
      return interaction.reply("You don't have permission to use this command.");

    await interaction.deferReply();
    const steam64id = interaction.options.getString("steam64id", true);

    try {
      await api.deleteQueuePriority({
        cftools_id: SteamId64.of(steam64id),
      });
    } catch (e) {
      if (e?.message.startsWith("ResourceNotFound")) {
        return await interaction.followUp("Player not found or has no queue priority.");
      }
      return await interaction.followUp(`Error: ${e.message}`);
    }

    await interaction.followUp(`Removed queue priority from \`${steam64id}\`.`);
  }
};
