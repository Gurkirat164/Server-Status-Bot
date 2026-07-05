const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { getLoadedModules } = require('../../../core/moduleLoader');

const EMBED_COLOR = 0x5865f2;
const COMMANDS_PER_PAGE = 10;

function register(builder) {
  return builder.addStringOption(opt =>
    opt
      .setName('module')
      .setDescription('Get detailed help for a specific module')
      .setRequired(false)
      .setAutocomplete(true)
  );
}

/**
 * Flattens a slash command's JSON definition (which may have plain
 * subcommands, subcommand groups, or neither) into a flat list of
 * { usage, description } entries — independent of any specific module.
 */
function flattenCommands(jsonCmd) {
  const results = [];
  const base = `/${jsonCmd.name}`;
  const options = jsonCmd.options || [];

  const hasSubStructure = options.some(o => o.type === 1 || o.type === 2);

  if (!hasSubStructure) {
    results.push({ usage: base, description: jsonCmd.description });
    return results;
  }

  for (const opt of options) {
    if (opt.type === 1) {
      // SUB_COMMAND
      results.push({ usage: `${base} ${opt.name}`, description: opt.description });
    } else if (opt.type === 2) {
      // SUB_COMMAND_GROUP
      for (const sub of opt.options || []) {
        results.push({ usage: `${base} ${opt.name} ${sub.name}`, description: sub.description });
      }
    }
  }

  return results;
}

function buildOverviewEmbed() {
  const modules = getLoadedModules();

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle('📖 Help — Available Modules')
    .setDescription('Use `/help module:<name>` to see every command for a specific module.');

  for (const mod of modules) {
    const cmdNames = mod.commands.map(c => `\`/${c.data.name}\``).join(', ');
    embed.addFields({
      name: `📦 ${mod.manifest?.name || mod.name}`,
      value: `${mod.manifest?.description || ''}\n${cmdNames}`.trim() || 'No description.'
    });
  }

  return embed;
}

function chunk(items, size) {
  const pages = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages.length ? pages : [[]];
}

function buildModuleEmbeds(mod) {
  const allCommands = mod.commands.flatMap(c => flattenCommands(c.data.toJSON()));
  const pages = chunk(allCommands, COMMANDS_PER_PAGE);

  return pages.map((page, idx) =>
    new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle(
        `📖 Help — ${mod.manifest?.name || mod.name}` + (pages.length > 1 ? ` (Page ${idx + 1}/${pages.length})` : '')
      )
      .setDescription(page.map(c => `**\`${c.usage}\`**\n${c.description}`).join('\n\n') || 'No commands.')
  );
}

async function execute(interaction) {
  const moduleName = interaction.options.getString('module');
  const modules = getLoadedModules();

  if (!moduleName) {
    return interaction.reply({ embeds: [buildOverviewEmbed()] });
  }

  const mod = modules.find(m => (m.manifest?.name || m.name).toLowerCase() === moduleName.toLowerCase());
  if (!mod) {
    return interaction.reply({ content: `❌ No module named \`${moduleName}\` found.`, ephemeral: true });
  }

  const embeds = buildModuleEmbeds(mod);

  if (embeds.length === 1) {
    return interaction.reply({ embeds: [embeds[0]] });
  }

  let page = 0;
  const buildRow = () =>
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('help_prev').setLabel('◀ Prev').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
      new ButtonBuilder().setCustomId('help_next').setLabel('Next ▶').setStyle(ButtonStyle.Secondary).setDisabled(page === embeds.length - 1)
    );

  await interaction.reply({ embeds: [embeds[page]], components: [buildRow()] });
  const message = await interaction.fetchReply();

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 120_000
  });

  collector.on('collect', async btnInteraction => {
    if (btnInteraction.user.id !== interaction.user.id) {
      return btnInteraction.reply({ content: 'This is not your help menu.', ephemeral: true });
    }

    if (btnInteraction.customId === 'help_prev') page = Math.max(0, page - 1);
    if (btnInteraction.customId === 'help_next') page = Math.min(embeds.length - 1, page + 1);

    await btnInteraction.update({ embeds: [embeds[page]], components: [buildRow()] });
  });

  collector.on('end', () => {
    interaction.editReply({ components: [] }).catch(() => {});
  });
}

async function autocomplete(interaction) {
  const focused = interaction.options.getFocused().toLowerCase();
  const modules = getLoadedModules();

  const choices = modules
    .map(m => m.manifest?.name || m.name)
    .filter(n => n.toLowerCase().includes(focused))
    .slice(0, 25)
    .map(n => ({ name: n, value: n }));

  await interaction.respond(choices);
}

module.exports = { register, execute, autocomplete };
