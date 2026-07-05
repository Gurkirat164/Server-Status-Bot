# Server Status Bot v2

A modular Discord bot. `index.js` scans the `modules/` folder on startup and
loads whatever it finds there — each module is fully self-contained (its own
commands, storage, and logic) and independent of every other module.

## Included modules

- **status** — live, auto-updating Minecraft server status embed (queries via
  the [mcstatus.io](https://mcstatus.io) API every 5 minutes).
- **help** — `/help` and `/help module:<name>`, auto-generated from whatever
  modules are currently loaded.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure your bot**
   - Copy `.env.example` to `.env`
   - Fill in `BOT_TOKEN` and `CLIENT_ID` from the [Discord Developer Portal](https://discord.com/developers/applications)
   - Optionally set `GUILD_ID` while developing — guild-scoped commands update
     instantly, global commands can take up to ~1 hour to propagate.

3. **Bot permissions / intents**
   - No privileged intents are required (the `status` module only needs to
     send messages and embed links in the channel you run `/status setup` in).
   - When generating your invite link in the Developer Portal, grant at
     least: `Send Messages`, `Embed Links`, `Attach Files`, `Read Message History`.

4. **Run it**
   ```bash
   npm start
   ```

## Status module — command reference

| Command | Access | Description |
|---|---|---|
| `/status setup #channel` | Admin/Owner or allow-list | Posts the status embed and starts auto-updating it every 5 min |
| `/status remove` | Admin/Owner or allow-list | Stops updating the message in the current channel (asks for confirmation; does not delete the message) |
| `/status set main <address> [port]` | Admin/Owner or allow-list | Sets the main server address (display + query). Port defaults to 25565 |
| `/status set version <text>` | Admin/Owner or allow-list | Sets the displayed version string |
| `/status set thumbnail <image>` | Admin/Owner or allow-list | Uploads and stores a new thumbnail locally |
| `/status set banner <image>` | Admin/Owner or allow-list | Uploads and stores a new banner locally |
| `/status subserver add <name> <ip> [port]` | Admin/Owner or allow-list | Adds a sub-server (IP is backend-only, never shown publicly) |
| `/status subserver remove <name>` | Admin/Owner or allow-list | Removes a sub-server (autocompletes existing names) |
| `/status subserver list` | Admin/Owner or allow-list | Lists all configured sub-servers (ephemeral, admin-only view) |
| `/status admin add-role <role>` | **Discord Admin/Owner only** | Grants a role access to the commands above |
| `/status admin remove-role <role>` | **Discord Admin/Owner only** | Revokes a role's access |
| `/status admin add-user <user>` | **Discord Admin/Owner only** | Grants a user access to the commands above |
| `/status admin remove-user <user>` | **Discord Admin/Owner only** | Revokes a user's access |
| `/status admin list` | **Discord Admin/Owner only** | Lists all roles/users with access |

Notes:
- The accent color (green/red) is driven **only** by the main server's
  online status — sub-servers never affect it.
- If a sub-server can't be reached, it's shown offline with 0 players.
- Peak players is only ever updated upward, automatically, whenever the main
  (proxy) server reports a new high player count.
- `/status admin` commands are **always** Discord Administrator/Owner only —
  being on the allow-list never grants access to manage the allow-list itself.

## Adding a new module

Create a folder under `modules/`, e.g. `modules/mymodule/`, containing:

- `module.json` — `{ "name": "mymodule", "description": "...", "enabled": true }`
- `index.js` — must export:
  ```js
  module.exports = {
    name: "mymodule",
    commands: [{ data: someSlashCommandBuilder, execute, autocomplete /* optional */ }],
    onLoad: async (client) => { /* optional: runs once on bot ready */ }
  };
  ```

That's it — `index.js` (the bot's, not the module's) picks it up automatically
on the next restart, registers its commands, and calls `onLoad`. Set
`"enabled": false` in a module's `module.json` to disable it without deleting
anything.
