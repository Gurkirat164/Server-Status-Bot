const { getData, saveData } = require('../lib/dataStore');
const { hasAccess } = require('../../../core/permissions');
const { saveImage } = require('../lib/imageStore');
const { refreshAndUpdate } = require('../lib/updateLoop');

function register(builder) {
  return builder.addSubcommandGroup(group =>
    group
      .setName('set')
      .setDescription('Update status configuration')
      .addSubcommand(sub =>
        sub
          .setName('main')
          .setDescription('Set the main server address (used for both display and querying)')
          .addStringOption(opt =>
            opt.setName('address').setDescription('Server address, e.g. play.horizion.in').setRequired(true)
          )
          .addIntegerOption(opt =>
            opt.setName('port').setDescription('Query port (default 25565)').setRequired(false)
          )
      )
      .addSubcommand(sub =>
        sub
          .setName('version')
          .setDescription('Set the displayed version string')
          .addStringOption(opt =>
            opt.setName('text').setDescription('e.g. 1.7.2 - 26.1.2').setRequired(true)
          )
      )
      .addSubcommand(sub =>
        sub
          .setName('thumbnail')
          .setDescription('Set the status embed thumbnail image')
          .addAttachmentOption(opt =>
            opt.setName('image').setDescription('Thumbnail image').setRequired(true)
          )
      )
      .addSubcommand(sub =>
        sub
          .setName('banner')
          .setDescription('Set the status embed banner image')
          .addAttachmentOption(opt =>
            opt.setName('image').setDescription('Banner image').setRequired(true)
          )
      )
  );
}

async function execute(interaction) {
  const data = getData();

  if (!hasAccess(interaction.member, data.admins)) {
    return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
  }

  const sub = interaction.options.getSubcommand();

  if (sub === 'main') {
    const address = interaction.options.getString('address');
    const port = interaction.options.getInteger('port') ?? 25565;

    data.mainServer.displayAddress = address;
    data.mainServer.queryIp = address;
    data.mainServer.queryPort = port;
    saveData(data);

    await interaction.reply({ content: `✅ Main server set to \`${address}:${port}\`.`, ephemeral: true });
  } else if (sub === 'version') {
    const text = interaction.options.getString('text');
    data.mainServer.version = text;
    saveData(data);

    await interaction.reply({ content: `✅ Version set to \`${text}\`.`, ephemeral: true });
  } else if (sub === 'thumbnail' || sub === 'banner') {
    const attachment = interaction.options.getAttachment('image');

    if (!attachment.contentType || !attachment.contentType.startsWith('image/')) {
      return interaction.reply({ content: '❌ Please upload a valid image file.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const { filename } = await saveImage(attachment, sub);
      const fresh = getData();
      if (sub === 'thumbnail') fresh.thumbnailFile = filename;
      else fresh.bannerFile = filename;
      saveData(fresh);

      await interaction.editReply({ content: `✅ ${sub === 'thumbnail' ? 'Thumbnail' : 'Banner'} updated.` });
    } catch (err) {
      console.error('[status/set] Failed to save image:', err);
      return interaction.editReply({ content: '❌ Failed to download and save that image. Please try again.' });
    }
  }

  await refreshAndUpdate(interaction.client).catch(err => console.error('[status/set] Refresh after update failed:', err));
}

module.exports = { register, execute };
