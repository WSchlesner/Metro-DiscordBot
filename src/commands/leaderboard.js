const { Command } = require("@sapphire/framework");
const api = require("../api.js");
const { hasRole } = require("../lib/roles.js");
const config = require("../../config.json");

module.exports = class extends Command {
  constructor(context, options) {
    super(context, { ...options, name: "leaderboard", description: "Get the server leaderboard" });
  }

  async registerApplicationCommands(registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .setDMPermission(false)
          .addStringOption((option) =>
            option.setName("stat").setDescription("Stat to rank by").setRequired(true)
              .setChoices(
                { name: "Kills", value: "kills" },
                { name: "Deaths", value: "deaths" },
                { name: "Suicides", value: "suicides" },
                { name: "Playtime", value: "playtime" },
                { name: "Longest Kill", value: "longest_kill" },
                { name: "Longest Shot", value: "longest_shot" },
                { name: "K/D Ratio", value: "kdratio" }
              )
          )
          .addIntegerOption((option) =>
            option.setName("limit").setDescription("Number of results (1-100, default 10)").setRequired(false)
          ),
      { guildIds: [config.guildId] }
    );
  }

  async chatInputRun(interaction) {
    if (!hasRole(interaction.member, "whitelisted"))
      return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });

    await interaction.deferReply();
    const stat = interaction.options.getString("stat", true);
    const limit = Math.min(Math.max(interaction.options.getInteger("limit") || 10, 1), 100);

    try {
      const data = await api.getLeaderboard({ stat, order: -1, limit });
      const entries = data.leaderboard || [];

      if (!entries.length) return await interaction.followUp("No leaderboard data found.");

      // Temporary: dump first entry so we can see the shape
      await interaction.followUp(`\`\`\`json\n${JSON.stringify(entries[0], null, 2)}\n\`\`\``);
    } catch (e) {
      return await interaction.followUp(`Error: ${e.message}`);
    }
  }
};