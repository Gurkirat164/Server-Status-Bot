const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { getData, saveData } = require('../lib/dataStore');
const { hasAccess } = require('../../../core/permissions');

function register(builder) {
  return builder.addSubcommand(sub =>
    sub.setName('remove').setDescription('Stop auto-updating the status embed in this channel')
  );
}

async function execute(interaction) {
  const data = getData();

  if (!hasAccess(interaction.member, data.admins)) {
    return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
  }

  const existing = data.instances.find(i => i.channelId === interaction.channelId);
  if (!existing) {
    return interaction.reply({ content: '❌ There is no status message set up in this channel.', ephemeral: true });
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('status_remove_confirm').setLabel('Yes, remove').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('status_remove_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({
    content: '⚠️ This will stop auto-updating the status message in this channel. The message itself will **not** be deleted. Continue?',
    components: [row],
    ephemeral: true
  });

  const message = await interaction.fetchReply();

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: i => i.user.id === interaction.user.id,
    time: 30_000,
    max: 1
  });

  collector.on('collect', async btnInteraction => {
    if (btnInteraction.customId === 'status_remove_confirm') {
      const fresh = getData();
      fresh.instances = fresh.instances.filter(i => i.channelId !== interaction.channelId);
      saveData(fresh);
      await btnInteraction.update({ content: '✅ Status tracking removed for this channel. The message itself was left untouched.', components: [] });
    } else {
      await btnInteraction.update({ content: '❌ Cancelled.', components: [] });
    }
  });

  collector.on('end', collected => {
    if (collected.size === 0) {
      interaction.editReply({ content: '⏱️ Confirmation timed out. No changes were made.', components: [] }).catch(() => {});
    }
  });
}

module.exports = { register, execute };
