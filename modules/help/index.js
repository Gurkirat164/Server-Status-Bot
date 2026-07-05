const { SlashCommandBuilder } = require('discord.js');
const helpCmd = require('./commands/help');

let builder = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Show available commands and modules');

builder = helpCmd.register(builder);

module.exports = {
  name: 'help',
  commands: [{ data: builder, execute: helpCmd.execute, autocomplete: helpCmd.autocomplete }],
  onLoad: async () => {}
};
