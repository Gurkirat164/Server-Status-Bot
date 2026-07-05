const path = require('path');
const { readJSON, writeJSON } = require('../../../core/storage');

const DATA_PATH = path.join(__dirname, '..', 'storage', 'data.json');

const DEFAULT_DATA = {
  mainServer: { displayAddress: '', queryIp: '', queryPort: 25565, version: '' },
  subServers: [],
  peakPlayers: 0,
  thumbnailFile: null,
  bannerFile: null,
  instances: [],
  admins: { roles: [], users: [] }
};

function getData() {
  const data = readJSON(DATA_PATH, DEFAULT_DATA);

  // Defensive merge so older/partial data files never crash the bot.
  return {
    ...DEFAULT_DATA,
    ...data,
    mainServer: { ...DEFAULT_DATA.mainServer, ...(data.mainServer || {}) },
    admins: { ...DEFAULT_DATA.admins, ...(data.admins || {}) },
    subServers: Array.isArray(data.subServers) ? data.subServers : [],
    instances: Array.isArray(data.instances) ? data.instances : []
  };
}

function saveData(data) {
  writeJSON(DATA_PATH, data);
}

module.exports = { getData, saveData, DATA_PATH };
