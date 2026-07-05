const { getData, saveData } = require('../lib/dataStore');
const { isDiscordAdmin } = require('../../../core/permissions');

function register(builder) {
  return builder.addSubcommandGroup(group =>
    group
      .setName('admin')
      .setDescription('Manage who can use status config commands (Discord Admin/Owner only)')
      .addSubcommand(sub =>
        sub
          .setName('add-role')
          .setDescription('Allow a role to manage status commands')
          .addRoleOption(opt => opt.setName('role').setDescription('Role to allow').setRequired(true))
      )
      .addSubcommand(sub =>
        sub
          .setName('remove-role')
          .setDescription('Remove a role from the allow-list')
          .addStringOption(opt =>
            opt.setName('role').setDescription('Role to remove').setRequired(true).setAutocomplete(true)
          )
      )
      .addSubcommand(sub =>
        sub
          .setName('add-user')
          .setDescription('Allow a user to manage status commands')
          .addUserOption(opt => opt.setName('user').setDescription('User to allow').setRequired(true))
      )
      .addSubcommand(sub =>
        sub
          .setName('remove-user')
          .setDescription('Remove a user from the allow-list')
          .addStringOption(opt =>
            opt.setName('user').setDescription('User to remove').setRequired(true).setAutocomplete(true)
          )
      )
      .addSubcommand(sub => sub.setName('list').setDescription('List roles and users with status command access'))
  );
}

async function execute(interaction) {
  // Deliberately NOT using hasAccess() here — allow-listed users/roles must
  // never be able to grant themselves or others further access.
  if (!isDiscordAdmin(interaction.member)) {
    return interaction.reply({ content: '❌ Only server Administrators or the Owner can use this command.', ephemeral: true });
  }

  const data = getData();
  const sub = interaction.options.getSubcommand();

  if (sub === 'add-role') {
    const role = interaction.options.getRole('role');
    if (data.admins.roles.includes(role.id)) {
      return interaction.reply({ content: `❌ <@&${role.id}> is already in the allow-list.`, ephemeral: true });
    }
    data.admins.roles.push(role.id);
    saveData(data);
    return interaction.reply({ content: `✅ <@&${role.id}> can now use status commands.`, ephemeral: true });
  }

  if (sub === 'remove-role') {
    const roleId = interaction.options.getString('role');
    if (!data.admins.roles.includes(roleId)) {
      return interaction.reply({ content: '❌ That role is not in the allow-list.', ephemeral: true });
    }
    data.admins.roles = data.admins.roles.filter(r => r !== roleId);
    saveData(data);
    return interaction.reply({ content: '✅ Role removed from the allow-list.', ephemeral: true });
  }

  if (sub === 'add-user') {
    const user = interaction.options.getUser('user');
    if (data.admins.users.includes(user.id)) {
      return interaction.reply({ content: `❌ <@${user.id}> is already in the allow-list.`, ephemeral: true });
    }
    data.admins.users.push(user.id);
    saveData(data);
    return interaction.reply({ content: `✅ <@${user.id}> can now use status commands.`, ephemeral: true });
  }

  if (sub === 'remove-user') {
    const userId = interaction.options.getString('user');
    if (!data.admins.users.includes(userId)) {
      return interaction.reply({ content: '❌ That user is not in the allow-list.', ephemeral: true });
    }
    data.admins.users = data.admins.users.filter(u => u !== userId);
    saveData(data);
    return interaction.reply({ content: '✅ User removed from the allow-list.', ephemeral: true });
  }

  if (sub === 'list') {
    const roles = data.admins.roles.length ? data.admins.roles.map(r => `<@&${r}>`).join(', ') : 'None';
    const users = data.admins.users.length ? data.admins.users.map(u => `<@${u}>`).join(', ') : 'None';
    return interaction.reply({ content: `**Roles:** ${roles}\n**Users:** ${users}`, ephemeral: true });
  }
}

async function autocomplete(interaction) {
  const data = getData();
  const focused = interaction.options.getFocused().toLowerCase();
  const sub = interaction.options.getSubcommand();
  const guild = interaction.guild;

  if (sub === 'remove-role') {
    const choices = data.admins.roles.map(roleId => {
      const role = guild.roles.cache.get(roleId);
      return { name: role ? role.name : roleId, value: roleId };
    });
    return interaction.respond(
      choices.filter(c => c.name.toLowerCase().includes(focused)).slice(0, 25)
    );
  }

  if (sub === 'remove-user') {
    const choices = [];
    for (const userId of data.admins.users) {
      let name = userId;
      try {
        const member = await guild.members.fetch(userId);
        name = member.user.tag;
      } catch {
        // Member left the guild — fall back to raw id.
      }
      choices.push({ name, value: userId });
    }
    return interaction.respond(
      choices.filter(c => c.name.toLowerCase().includes(focused)).slice(0, 25)
    );
  }
}

module.exports = { register, execute, autocomplete };
