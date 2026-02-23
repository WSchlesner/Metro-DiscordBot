const { Command } = require("@sapphire/framework");
const api = require("../api.js");
const { hasRole } = require("../lib/roles.js");
const config = require("../../config.json");

module.exports = class extends Command {
  constructor(context, options) {
    super(context, { ...options, name: "playerstats", description: "Get stats for a player" });
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
    if (!hasRole(interaction.member, "whitelisted"))
      return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });

    await interaction.deferReply();
    const steam64id = interaction.options.getString("steam64id", true);

    try {
      const cftools_id = await api.lookupCFToolsId(steam64id);
      const stats = await api.getPlayerStats(cftools_id);

      if (!stats) return await interaction.followUp("No stats found for this player.");

      const name = stats.omega?.name_history?.[0] || "Unknown";
      const s = stats.game?.dayz || {};
      const kills = s.kills || {};
      const shots = s.shots || {};

      const playtimeSeconds = stats.omega?.playtime || 0;
      const playtime = playtimeSeconds
        ? `${Math.floor(playtimeSeconds / 3600)}h ${Math.floor((playtimeSeconds % 3600) / 60)}m`
        : "N/A";

      const distanceKm = s.distance_traveled
        ? `${(s.distance_traveled / 1000).toFixed(1)} km`
        : "N/A";

      const shotAccuracy = shots.fired
        ? `${shots.fired.toLocaleString()} (${((shots.hit / shots.fired) * 100).toFixed(1)}%)`
        : "N/A";

      await interaction.followUp([
        `**Player Stats — ${name}**`,
        `Steam64: \`${steam64id}\``,
        ``,
        `**Combat**`,
        `Players Killed: ${kills.players ?? "N/A"}`,
        `AI Killed: ${(kills.infected ?? 0) + (kills.animals ?? 0)}`,
        `Deaths: ${s.deaths ?? "N/A"}`,
        `K/D Ratio: ${s.kdratio ?? "N/A"}`,
        `Suicides: ${s.suicides ?? "N/A"}`,
        ``,
        `**Shooting**`,
        `Shots Fired: ${shots.fired?.toLocaleString() ?? "N/A"}`,
        `Accuracy: ${shots.fired ? `${((shots.hit / shots.fired) * 100).toFixed(1)}%` : "N/A"}`,
        `Furthest Kill: ${s.longest_kill ?? "N/A"}m`,
        `Furthest Shot: ${s.longest_shot ?? "N/A"}m`,
        ``,
        `**General**`,
        `Playtime: ${playtime}`,
        `Sessions: ${stats.omega?.sessions ?? "N/A"}`,
        `Distance Traveled: ${distanceKm}`,
        `Environment Deaths: ${s.environment_deaths ?? "N/A"}`
      ].join("\n"));
    } catch (e) {
      return await interaction.followUp(`Error: ${e.message}`);
    }
  }
};