require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const { loadModules, getLoadedModules } = require('./core/moduleLoader');
const { handleInteraction } = require('./core/commandHandler');

if (!process.env.BOT_TOKEN || !process.env.CLIENT_ID) {
  console.error('❌ Missing BOT_TOKEN or CLIENT_ID in your .env file. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

async function registerCommands() {
  const modules = getLoadedModules();
  const commandsJSON = modules.flatMap(mod => mod.commands.map(c => c.data.toJSON()));

  const rest = new REST().setToken(process.env.BOT_TOKEN);

  const route = process.env.GUILD_ID
    ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
    : Routes.applicationCommands(process.env.CLIENT_ID);

  await rest.put(route, { body: commandsJSON });

  console.log(
    `✅ Registered ${commandsJSON.length} command(s)` +
    (process.env.GUILD_ID ? ' (guild-scoped — instant)' : ' (global — may take up to ~1hr to appear)')
  );
}

client.once('ready', async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);

  for (const mod of getLoadedModules()) {
    if (typeof mod.onLoad === 'function') {
      try {
        await mod.onLoad(client);
      } catch (err) {
        console.error(`[index] Error in onLoad for module "${mod.name}":`, err);
      }
    }
  }

  console.log('✅ All modules initialized. Bot is ready.');
});

client.on('interactionCreate', handleInteraction);

(async () => {
  loadModules();
  await registerCommands();
  await client.login(process.env.BOT_TOKEN);
})();
