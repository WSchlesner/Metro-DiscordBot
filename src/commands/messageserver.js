const { Command } = require("@sapphire/framework");
const api = require("../api.js");
const { hasRole } = require("../lib/roles.js");
const config = require("../../config.json");

module.exports = class extends Command {
  constructor(context, options) {
    super(context, { ...options, name: "messageserver", description: "Send a public message to the server" });
  }

  async registerApplicationCommands(registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .setDMPermission(false)
          .addStringOption((option) =>
            option.setName("message").setDescription("Message to send (max 256 characters)").setRequired(true)
          ),
      { guildIds: [config.guildId] }
    );
  }

  async chatInputRun(interaction) {
    if (!hasRole(interaction.member, "eventManager"))
      return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });

    await interaction.deferReply();
    const content = interaction.options.getString("message", true);

    if (content.length > 256)
      return await interaction.followUp("Message too long. Maximum 256 characters.");

    try {
      await api.messageServer({ content });
      await interaction.followUp(`Message sent to server: *${content}*`);
    } catch (e) {
      return await interaction.followUp(`Error: ${e.message}`);
    }
  }
};