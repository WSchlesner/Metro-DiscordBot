const { Command } = require("@sapphire/framework");
const api = require("../api.js");
const { hasRole } = require("../lib/roles.js");
const config = require("../../config.json");

module.exports = class extends Command {
  constructor(context, options) {
    super(context, { ...options, name: "unban", description: "Revoke a ban" });
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
    if (!hasRole(interaction.member, "mod"))
      return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });

    await interaction.deferReply();
    const steam64id = interaction.options.getString("steam64id", true);

    try {
      const cftools_id = await api.lookupCFToolsId(steam64id);
      const bans = await api.getBans(cftools_id);

      if (!bans.length)
        return await interaction.followUp(`No active bans found for \`${steam64id}\`.`);

      // Revoke all active bans for this player
      await Promise.all(bans.map((ban) => api.revokeBan(ban.id)));
      await interaction.followUp(`Revoked ${bans.length} ban(s) for \`${steam64id}\`.`);
    } catch (e) {
      return await interaction.followUp(`Error: ${e.message}`);
    }
  }
};