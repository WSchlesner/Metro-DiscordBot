const { Command } = require("@sapphire/framework");
const api = require("../api.js");
const { hasRole } = require("../lib/roles.js");
const config = require("../../config.json");

module.exports = class extends Command {
  constructor(context, options) {
    super(context, { ...options, name: "lookup", description: "Look up a player in the CFTools database" });
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
          ),
      { guildIds: [config.guildId] }
    );
  }

  async chatInputRun(interaction) {
    if (!hasRole(interaction.member, "admin"))
      return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });

    await interaction.deferReply();
    const steam64id = interaction.options.getString("steam64id", true);

    try {
      const cftools_id = await api.lookupCFToolsId(steam64id);
      const profile = await api.getPlayerProfile(cftools_id);

      await interaction.followUp([
        `**Player Lookup**`,
        `Steam64: \`${steam64id}\``,
        `CFTools ID: \`${cftools_id}\``,
        `CFTools Profile: <https://app.cftools.cloud/profile/${cftools_id}>`,
        `Name: ${profile?.name || "Unknown"}`
      ].join("\n"));
    } catch (e) {
      return await interaction.followUp(`Error: ${e.message}`);
    }
  }
};