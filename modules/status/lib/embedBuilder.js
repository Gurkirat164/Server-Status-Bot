const path = require('path');
const { EmbedBuilder } = require('discord.js');

const COLOR_ONLINE = 0x00ff00;
const COLOR_OFFLINE = 0xff0000;

/**
 * Builds the "SERVER STATUS" embed. Accent color is driven ONLY by the
 * main server's online state — sub-server status never affects it.
 */
function buildStatusEmbed({ mainStatus, subStatuses, data }) {
  const color = mainStatus.online ? COLOR_ONLINE : COLOR_OFFLINE;
  const statusEmoji = mainStatus.online ? '🟢' : '🔴';
  const statusText = mainStatus.online ? 'ONLINE!' : 'OFFLINE!';

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle('SERVER STATUS')
    .addFields(
      { name: '🌐 Server Address', value: data.mainServer.displayAddress || 'Not set' },
      { name: '📊 Status', value: `${statusEmoji} ${statusText}` },
      { name: '🎮 Version', value: data.mainServer.version || 'Not set' },
      { name: '👥 Players Online', value: `${mainStatus.players}/${mainStatus.maxPlayers}` },
      { name: '🏆 Peak Players', value: `${data.peakPlayers}` }
    );

  if (data.subServers.length > 0) {
    const subLines = data.subServers
      .map((sub, i) => {
        const st = subStatuses[i] || { online: false, players: 0 };
        const dot = st.online ? '🟢' : '🔴';
        return `${dot} **${sub.name}:** ${st.players} players`;
      })
      .join('\n');

    embed.addFields({ name: '🎲 Servers', value: subLines });
  }

  embed.setFooter({ text: 'Last Updated' }).setTimestamp();

  if (data.thumbnailFile) {
    embed.setThumbnail(`attachment://${path.basename(data.thumbnailFile)}`);
  }
  if (data.bannerFile) {
    embed.setImage(`attachment://${path.basename(data.bannerFile)}`);
  }

  return embed;
}

module.exports = { buildStatusEmbed };
