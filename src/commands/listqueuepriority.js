const { Command } = require("@sapphire/framework");
const api = require("../api.js");
const config = require("../../config.json");

module.exports = class extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: "listqueuepriority",
      description: "List all queue priority entries",
    });
  }

  async registerApplicationCommands(registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .setDMPermission(false)
          .addIntegerOption((option) =>
            option
              .setName("page")
              .setDescription("Page number (default: 1)")
              .setRequired(false)
          ),
      { guildIds: [config.guildId] }
    );
  }

  async chatInputRun(interaction) {
    if (!interaction.member.roles.cache.has(config.moderatorRole))
      return interaction.reply("You don't have permission to use this command.");

    await interaction.deferReply();

    try {
      const entries = await api.getQueuePriority();

      if (!entries || entries.length === 0) {
        return await interaction.followUp("No queue priority entries found.");
      }

      const page = interaction.options.getInteger("page") || 1;
      const perPage = 10;
      const totalPages = Math.ceil(entries.length / perPage);
      const start = (page - 1) * perPage;
      const pageEntries = entries.slice(start, start + perPage);

      if (page > totalPages) {
        return await interaction.followUp(`Invalid page. There are only ${totalPages} pages.`);
      }

      const formattedEntries = pageEntries
        .map((entry) => {
          const expiryText = entry.meta.expiration
            ? `Expires: <t:${parseInt(new Date(entry.meta.expiration).getTime() / 1000)}:f>`
            : "Permanent";
          return `Player: \`${entry.user.cftools_id}\`\nComment: ${entry.meta.comment || "None"}\n${expiryText}`;
        })
        .join("\n\n");

      await interaction.followUp(
        `**Queue Priority List** (Page ${page}/${totalPages} — ${entries.length} total)\n\n${formattedEntries}`
      );
    } catch (e) {
      return await interaction.followUp(`Error: ${e.message}`);
    }
  }
};