const { getData, saveData } = require('../lib/dataStore');
const { hasAccess } = require('../../../core/permissions');
const { refreshAndUpdate } = require('../lib/updateLoop');

function register(builder) {
  return builder.addSubcommandGroup(group =>
    group
      .setName('subserver')
      .setDescription('Manage sub-servers')
      .addSubcommand(sub =>
        sub
          .setName('add')
          .setDescription('Add a sub-server')
          .addStringOption(opt => opt.setName('name').setDescription('Display name').setRequired(true))
          .addStringOption(opt => opt.setName('ip').setDescription('Backend IP (not shown publicly)').setRequired(true))
          .addIntegerOption(opt => opt.setName('port').setDescription('Query port (default 25565)').setRequired(false))
      )
      .addSubcommand(sub =>
        sub
          .setName('remove')
          .setDescription('Remove a sub-server')
          .addStringOption(opt =>
            opt.setName('name').setDescription('Sub-server name').setRequired(true).setAutocomplete(true)
          )
      )
      .addSubcommand(sub => sub.setName('list').setDescription('List all configured sub-servers'))
  );
}

async function execute(interaction) {
  const data = getData();

  if (!hasAccess(interaction.member, data.admins)) {
    return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
  }

  const sub = interaction.options.getSubcommand();

  if (sub === 'add') {
    const name = interaction.options.getString('name');
    const ip = interaction.options.getString('ip');
    const port = interaction.options.getInteger('port') ?? 25565;

    if (data.subServers.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      return interaction.reply({ content: `❌ A sub-server named \`${name}\` already exists.`, ephemeral: true });
    }

    data.subServers.push({ name, ip, port });
    saveData(data);

    await interaction.reply({ content: `✅ Sub-server \`${name}\` added.`, ephemeral: true });
  } else if (sub === 'remove') {
    const name = interaction.options.getString('name');
    const idx = data.subServers.findIndex(s => s.name.toLowerCase() === name.toLowerCase());

    if (idx === -1) {
      return interaction.reply({ content: `❌ No sub-server named \`${name}\` found.`, ephemeral: true });
    }

    data.subServers.splice(idx, 1);
    saveData(data);

    await interaction.reply({ content: `✅ Sub-server \`${name}\` removed.`, ephemeral: true });
  } else if (sub === 'list') {
    if (data.subServers.length === 0) {
      return interaction.reply({ content: 'No sub-servers configured.', ephemeral: true });
    }

    const lines = data.subServers.map(s => `• **${s.name}** — \`${s.ip}:${s.port}\``).join('\n');
    return interaction.reply({ content: lines, ephemeral: true });
  }

  await refreshAndUpdate(interaction.client).catch(err => console.error('[status/subserver] Refresh after update failed:', err));
}

async function autocomplete(interaction) {
  const data = getData();
  const focused = interaction.options.getFocused().toLowerCase();

  const choices = data.subServers
    .filter(s => s.name.toLowerCase().includes(focused))
    .slice(0, 25)
    .map(s => ({ name: s.name, value: s.name }));

  await interaction.respond(choices);
}

module.exports = { register, execute, autocomplete };
