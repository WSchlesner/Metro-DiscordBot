const { Command } = require("@sapphire/framework");
const api = require("../api.js");
const { hasRole } = require("../lib/roles.js");
const config = require("../../config.json");

module.exports = class extends Command {
  constructor(context, options) {
    super(context, { ...options, name: "messageplayer", description: "Send a private in-game message to a player" });
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
            option.setName("message").setDescription("Message to send (max 256 characters)").setRequired(true)
          ),
      { guildIds: [config.guildId] }
    );
  }

  async chatInputRun(interaction) {
    if (!hasRole(interaction.member, "admin"))
      return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });

    await interaction.deferReply();
    const steam64id = interaction.options.getString("steam64id", true);
    const content = interaction.options.getString("message", true);

    if (content.length > 256)
      return await interaction.followUp("Message too long. Maximum 256 characters.");

    try {
      const cftools_id = await api.lookupCFToolsId(steam64id);
      const playerList = await api.getPlayerList();
      const sessions = playerList.sessions || [];
      const session = sessions.find((s) => s.cftools_id === cftools_id);

      if (!session)
        return await interaction.followUp(`\`${steam64id}\` is not currently online.`);

      await api.messagePrivate({ gamesession_id: session.id, content });
      await interaction.followUp(`Message sent to \`${steam64id}\`: *${content}*`);
    } catch (e) {
      return await interaction.followUp(`Error: ${e.message}`);
    }
  }
};