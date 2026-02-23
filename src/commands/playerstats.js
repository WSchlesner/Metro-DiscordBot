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

      // Kills can be a nested object { pve, pvp, environment } or a flat number
      let killsDisplay = "N/A";
      if (s.kills !== undefined && s.kills !== null) {
        if (typeof s.kills === "object") {
          const pve = s.kills.pve ?? 0;
          const pvp = s.kills.pvp ?? 0;
          const env = s.kills.environment ?? 0;
          killsDisplay = `${pve + pvp + env} (PvP: ${pvp}, PvE: ${pve}, Env: ${env})`;
        } else {
          killsDisplay = s.kills;
        }
      }

      // Playtime may be in omega (overall) rather than game.dayz
      const playtimeSeconds = s.playtime || stats.omega?.playtime || null;
      const playtime = playtimeSeconds
        ? `${Math.floor(playtimeSeconds / 3600)}h ${Math.floor((playtimeSeconds % 3600) / 60)}m`
        : "N/A";

      await interaction.followUp([
        `**Player Stats — ${name}**`,
        `Steam64: \`${steam64id}\``,
        `Kills: ${killsDisplay}`,
        `Deaths: ${s.deaths ?? "N/A"}`,
        `K/D: ${s.kdratio ?? "N/A"}`,
        `Playtime: ${playtime}`,
        `Longest Kill: ${s.longest_kill ?? "N/A"}m`,
        `Longest Shot: ${s.longest_shot ?? "N/A"}m`,
        `Suicides: ${s.suicides ?? "N/A"}`
      ].join("\n"));
    } catch (e) {
      return await interaction.followUp(`Error: ${e.message}`);
    }
  }
};