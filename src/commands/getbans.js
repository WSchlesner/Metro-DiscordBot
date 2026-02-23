const { Command } = require("@sapphire/framework");
const api = require("../api.js");
const { hasRole } = require("../lib/roles.js");
const config = require("../../config.json");

module.exports = class extends Command {
  constructor(context, options) {
    super(context, { ...options, name: "getbans", description: "Look up bans for a player or IP" });
  }

  async registerApplicationCommands(registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .setDMPermission(false)
          .addStringOption((option) =>
            option.setName("steam64id").setDescription("Steam64 ID to look up").setRequired(false)
          )
          .addStringOption((option) =>
            option.setName("ip").setDescription("IP address to look up").setRequired(false)
          ),
      { guildIds: [config.guildId] }
    );
  }

  async chatInputRun(interaction) {
    if (!hasRole(interaction.member, "support"))
      return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });

    await interaction.deferReply();
    const steam64id = interaction.options.getString("steam64id", false);
    const ip = interaction.options.getString("ip", false);

    if (!steam64id && !ip)
      return await interaction.followUp("Please provide either a Steam64 ID or an IP address.");

    try {
      let filter;
      if (steam64id) {
        filter = await api.lookupCFToolsId(steam64id);
      } else {
        filter = ip;
      }

      const bans = await api.getBans(filter);

      if (!bans.length)
        return await interaction.followUp(`No bans found for \`${steam64id || ip}\`.`);

      const lines = bans.map((ban) => {
        const expiryText = ban.expires_at
          ? `Expires: <t:${parseInt(new Date(ban.expires_at).getTime() / 1000)}:f>`
          : "Permanent";
        return [
          `Ban ID: \`${ban.id}\``,
          `Reason: ${ban.reason || "None"}`,
          expiryText
        ].join(" | ");
      });

      await interaction.followUp(`**Bans for \`${steam64id || ip}\`**\n\n${lines.join("\n")}`);
    } catch (e) {
      return await interaction.followUp(`Error: ${e.message}`);
    }
  }
};