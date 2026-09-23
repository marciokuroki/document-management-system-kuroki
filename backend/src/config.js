const path = require('node:path');

const defaultStorageDirectory = path.resolve(__dirname, '../storage');
const storageDirectory = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : defaultStorageDirectory;

module.exports = {
  storageDirectory,
  maxFileSize: Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024),
};
