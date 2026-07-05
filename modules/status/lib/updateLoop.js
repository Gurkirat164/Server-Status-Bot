const path = require('path');
const { AttachmentBuilder } = require('discord.js');
const { getData, saveData } = require('./dataStore');
const { queryJava } = require('./mcstatus');
const { buildStatusEmbed } = require('./embedBuilder');
const { IMAGES_DIR } = require('./imageStore');

const UPDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches live status for the main server + all sub-servers, updates the
 * stored peak player count if beaten, builds the embed, and edits every
 * tracked instance's message. Dead instances (deleted message/channel)
 * are dropped from storage automatically.
 */
async function refreshAndUpdate(client) {
  const data = getData();

  const mainStatus = await queryJava(data.mainServer.queryIp, data.mainServer.queryPort || 25565);

  if (mainStatus.online && mainStatus.players > data.peakPlayers) {
    data.peakPlayers = mainStatus.players;
  }

  const subStatuses = [];
  for (const sub of data.subServers) {
    subStatuses.push(await queryJava(sub.ip, sub.port || 25565));
  }

  const embed = buildStatusEmbed({ mainStatus, subStatuses, data });

  const files = [];
  if (data.thumbnailFile) files.push(new AttachmentBuilder(path.join(IMAGES_DIR, data.thumbnailFile)));
  if (data.bannerFile) files.push(new AttachmentBuilder(path.join(IMAGES_DIR, data.bannerFile)));

  const validInstances = [];

  for (const inst of data.instances) {
    try {
      const guild = await client.guilds.fetch(inst.guildId);
      const channel = await guild.channels.fetch(inst.channelId);
      const message = await channel.messages.fetch(inst.messageId);
      await message.edit({ content: null, embeds: [embed], files });
      validInstances.push(inst);
    } catch (err) {
      // Unknown Message (10008) or Unknown Channel (10003) -> the message
      // or channel is gone, so drop this instance. Anything else (a
      // transient network blip, missing perms, etc.) — keep it and retry
      // next cycle rather than silently losing tracking.
      if (err.code === 10008 || err.code === 10003) {
        console.warn(`[status] Dropping dead instance (guild=${inst.guildId}, channel=${inst.channelId}):`, err.message);
      } else {
        console.error(`[status] Failed to update instance (guild=${inst.guildId}, channel=${inst.channelId}):`, err.message);
        validInstances.push(inst);
      }
    }
  }

  data.instances = validInstances;
  saveData(data);

  return { embed, files, mainStatus, subStatuses };
}

function startUpdateLoop(client) {
  refreshAndUpdate(client).catch(err => console.error('[status] Initial update failed:', err));

  setInterval(() => {
    refreshAndUpdate(client).catch(err => console.error('[status] Update loop failed:', err));
  }, UPDATE_INTERVAL_MS);

  console.log('[status] Auto-update loop started (every 5 minutes).');
}

module.exports = { startUpdateLoop, refreshAndUpdate };
