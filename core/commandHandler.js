const { getLoadedModules } = require('./moduleLoader');

function findCommand(commandName) {
  for (const mod of getLoadedModules()) {
    const found = mod.commands.find(c => c.data.name === commandName);
    if (found) return found;
  }
  return null;
}

async function handleInteraction(interaction) {
  if (interaction.isChatInputCommand()) {
    const command = findCommand(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`[commandHandler] Error executing /${interaction.commandName}:`, err);
      const payload = { content: '❌ Something went wrong running that command.', ephemeral: true };
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload);
        } else {
          await interaction.reply(payload);
        }
      } catch {
        // Interaction likely expired — nothing more we can do.
      }
    }
  } else if (interaction.isAutocomplete()) {
    const command = findCommand(interaction.commandName);
    if (!command || !command.autocomplete) return;

    try {
      await command.autocomplete(interaction);
    } catch (err) {
      console.error(`[commandHandler] Error in autocomplete for /${interaction.commandName}:`, err);
    }
  }
}

module.exports = { handleInteraction, findCommand };
