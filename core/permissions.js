const { PermissionFlagsBits } = require('discord.js');

/**
 * True if the member is a Discord Administrator or the guild owner.
 * This is the ONLY check allowed for `/status admin` commands — the
 * allow-list itself cannot grant access to manage the allow-list.
 */
function isDiscordAdmin(member) {
  if (!member) return false;
  if (member.guild?.ownerId === member.id) return true;
  return member.permissions?.has(PermissionFlagsBits.Administrator) ?? false;
}

/**
 * True if the member is a Discord Admin/Owner OR is present in the
 * module's allow-list (by role or by user id). Used for the regular
 * config commands (setup, remove, set, subserver).
 *
 * `admins` is expected to be `{ roles: string[], users: string[] }`.
 */
function hasAccess(member, admins = { roles: [], users: [] }) {
  if (!member) return false;
  if (isDiscordAdmin(member)) return true;
  if (admins.users?.includes(member.id)) return true;
  if (member.roles?.cache?.some(r => admins.roles?.includes(r.id))) return true;
  return false;
}

module.exports = { isDiscordAdmin, hasAccess };
