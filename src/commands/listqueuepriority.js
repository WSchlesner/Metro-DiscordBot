const { Command } = require("@sapphire/framework");
const api = require("../api.js");
const { hasRole } = require("../lib/roles.js");
const config = require("../../config.json");

module.exports = class extends Command {
  constructor(context, options) {
    super(context, { ...options, name: "listqueuepriority", description: "List all queue priority entries" });
  }

  async registerApplicationCommands(registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .setDMPermission(false)
          .addIntegerOption((option) =>
            option.setName("page").setDescription("Page number (default: 1)").setRequired(false)
          ),
      { guildIds: [config.guildId] }
    );
  }

  async chatInputRun(interaction) {
    if (!hasRole(interaction.member, "mod"))
      return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });

    await interaction.deferReply();

    try {
      const entries = await api.getQueuePriority();
      if (!entries.length) return await interaction.followUp("No queue priority entries found.");

      const page = interaction.options.getInteger("page") || 1;
      const perPage = 10;
      const totalPages = Math.ceil(entries.length / perPage);

      if (page < 1 || page > totalPages)
        return await interaction.followUp(`Invalid page. There are only ${totalPages} pages.`);

      const pageEntries = entries.slice((page - 1) * perPage, page * perPage);

      const profiles = await Promise.all(
        pageEntries.map((entry) => api.getPlayerProfile(entry.user.cftools_id).catch(() => null))
      );

      const formatted = pageEntries.map((entry, i) => {
        const profile = profiles[i];
        const expiryText = entry.meta.expiration
          ? `Expires: <t:${parseInt(new Date(entry.meta.expiration).getTime() / 1000)}:f>`
          : "Permanent";
        return [
          `**${profile?.name || "Unknown"}**`,
          `CFTools: \`${entry.user.cftools_id}\` (<https://app.cftools.cloud/profile/${entry.user.cftools_id}>)`,
          `Steam64: \`${profile?.steam64 || "Unknown"}\``,
          `Comment: ${entry.meta.comment || "None"}`,
          expiryText
        ].join("\n");
      }).join("\n\n");

      await interaction.followUp(
        `**Queue Priority List** (Page ${page}/${totalPages} — ${entries.length} total)\n\n${formatted}`
      );
    } catch (e) {
      return await interaction.followUp(`Error: ${e.message}`);
    }
  }
};