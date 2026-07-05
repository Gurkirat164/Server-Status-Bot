const { getData } = require('../lib/dataStore');
const { hasAccess } = require('../../../core/permissions');
const { forceUpdate } = require('../lib/updateLoop');

function register(builder) {
    return builder.addSubcommand(sub =>
      sub.setName('update').setDescription('Force-refresh the status embed now and reset the 5-minute auto-update timer')
  );
}

async function execute(interaction) {
  const data = getData();

  if (!hasAccess(interaction.member, data.admins)) {
    return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    await forceUpdate(interaction.client);
    await interaction.editReply({ content: '✅ Status updated and the 5-minute timer has been reset.' });
  } catch (err) {
    console.error('[status/update] Force update failed:', err);
    await interaction.editReply({ content: '❌ Failed to update the status.' });
  }
}

module.exports = { register, execute };