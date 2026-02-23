const { Command } = require("@sapphire/framework");
const api = require("../api.js");
const { hasRole } = require("../lib/roles.js");
const config = require("../../config.json");

module.exports = class extends Command {
  constructor(context, options) {
    super(context, { ...options, name: "getwhitelist", description: "Check if a player is whitelisted" });
  }

  async registerApplicationCommands(registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .setDMPermission(false)
          .addStringOption((option) =>
            option.setName("steam64id").setDescription("Steam64 ID to check").setRequired(true)
          ),
      { guildIds: [config.guildId] }
    );
  }

  async chatInputRun(interaction) {
    if (!hasRole(interaction.member, "support"))
      return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });

    await interaction.deferReply();
    const steam64id = interaction.options.getString("steam64id", true);

    try {
      const cftools_id = await api.lookupCFToolsId(steam64id);
      const entries = await api.getWhitelistEntry(cftools_id);

      if (!entries.length)
        return await interaction.followUp(`\`${steam64id}\` is **not** whitelisted.`);

      const entry = entries[0];
      const expiryText = entry.meta?.expiration
        ? `Expires: <t:${parseInt(new Date(entry.meta.expiration).getTime() / 1000)}:f>`
        : "Permanent";

      await interaction.followUp([
        `\`${steam64id}\` is **whitelisted**.`,
        `Comment: ${entry.meta?.comment || "None"}`,
        expiryText
      ].join("\n"));
    } catch (e) {
      return await interaction.followUp(`Error: ${e.message}`);
    }
  }
};