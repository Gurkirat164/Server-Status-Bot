const { ChannelType } = require('discord.js');
const { getData, saveData } = require('../lib/dataStore');
const { hasAccess } = require('../../../core/permissions');
const { refreshAndUpdate } = require('../lib/updateLoop');

function register(builder) {
  return builder.addSubcommand(sub =>
    sub
      .setName('setup')
      .setDescription('Post the status embed in a channel and start auto-updating it')
      .addChannelOption(opt =>
        opt
          .setName('channel')
          .setDescription('Channel to post the status embed in')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  );
}

async function execute(interaction) {
  const data = getData();

  if (!hasAccess(interaction.member, data.admins)) {
    return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
  }

  const channel = interaction.options.getChannel('channel');

  const existing = data.instances.find(i => i.channelId === channel.id);
  if (existing) {
    return interaction.reply({ content: `❌ A status message is already set up in <#${channel.id}>.`, ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  let placeholder;
  try {
    placeholder = await channel.send({ content: 'Setting up status...' });
  } catch (err) {
    return interaction.editReply({ content: `❌ Failed to send a message in <#${channel.id}>. Make sure I have permission to post there.` });
  }

  data.instances.push({ guildId: interaction.guildId, channelId: channel.id, messageId: placeholder.id });
  saveData(data);

  await refreshAndUpdate(interaction.client);

  await interaction.editReply({ content: `✅ Status embed set up in <#${channel.id}>.` });
}

module.exports = { register, execute };
