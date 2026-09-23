const path = require('node:path');

const defaultStorageDirectory = path.resolve(__dirname, '../storage');
const storageDirectory = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : defaultStorageDirectory;
const configuredMaxFileSize = Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024);

if (!Number.isSafeInteger(configuredMaxFileSize) || configuredMaxFileSize <= 0) {
  throw new Error('MAX_FILE_SIZE deve ser um inteiro positivo.');
}

module.exports = {
  storageDirectory,
  maxFileSize: configuredMaxFileSize,
};
