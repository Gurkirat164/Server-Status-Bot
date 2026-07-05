const { SlashCommandBuilder } = require('discord.js');
const setupCmd = require('./commands/setup');
const removeCmd = require('./commands/remove');
const setCmd = require('./commands/set');
const subserverCmd = require('./commands/subserver');
const adminCmd = require('./commands/admin');
const { startUpdateLoop } = require('./lib/updateLoop');

let builder = new SlashCommandBuilder()
  .setName('status')
  .setDescription('Manage the Horizion server status module');

builder = setupCmd.register(builder);
builder = removeCmd.register(builder);
builder = setCmd.register(builder);
builder = subserverCmd.register(builder);
builder = adminCmd.register(builder);

async function execute(interaction) {
  const group = interaction.options.getSubcommandGroup(false);
  const sub = interaction.options.getSubcommand(false);

  if (!group && sub === 'setup') return setupCmd.execute(interaction);
  if (!group && sub === 'remove') return removeCmd.execute(interaction);
  if (group === 'set') return setCmd.execute(interaction);
  if (group === 'subserver') return subserverCmd.execute(interaction);
  if (group === 'admin') return adminCmd.execute(interaction);

  return interaction.reply({ content: '❌ Unknown subcommand.', ephemeral: true });
}

async function autocomplete(interaction) {
  const group = interaction.options.getSubcommandGroup(false);

  if (group === 'subserver' && subserverCmd.autocomplete) return subserverCmd.autocomplete(interaction);
  if (group === 'admin' && adminCmd.autocomplete) return adminCmd.autocomplete(interaction);
}

module.exports = {
  name: 'status',
  commands: [{ data: builder, execute, autocomplete }],
  onLoad: async client => {
    startUpdateLoop(client);
  }
};
