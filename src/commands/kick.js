const { Command } = require("@sapphire/framework");
const api = require("../api.js");
const { hasRole } = require("../lib/roles.js");
const config = require("../../config.json");

module.exports = class extends Command {
  constructor(context, options) {
    super(context, { ...options, name: "kick", description: "Kick a player from the server" });
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
            option.setName("reason").setDescription("Reason for the kick").setRequired(true)
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

    try {
      const cftools_id = await api.lookupCFToolsId(steam64id);
      // Get active session for this player
      const playerList = await api.getPlayerList();
      const sessions = playerList.sessions || [];
      const session = sessions.find((s) => s.cftools_id === cftools_id);

      if (!session)
        return await interaction.followUp(`\`${steam64id}\` is not currently online.`);

      await api.kickPlayer({ gamesession_id: session.id, reason });
      await interaction.followUp(`Kicked \`${steam64id}\`. Reason: ${reason}`);
    } catch (e) {
      return await interaction.followUp(`Error: ${e.message}`);
    }
  }
};