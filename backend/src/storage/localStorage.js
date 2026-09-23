const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const multer = require('multer');

function isPathInsideDirectory(filePath, directory) {
  const relativePath = path.relative(directory, filePath);
  return relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
}

class LocalStorage {
  constructor({ directory }) {
    this.directory = path.resolve(directory);
    fs.mkdirSync(this.directory, { recursive: true });
  }

  createMulterStorage() {
    return multer.diskStorage({
      destination: (_request, _file, callback) => callback(null, this.directory),
      filename: (request, file, callback) => {
        const id = crypto.randomUUID();
        request.documentId = id;
        const extension = path.extname(file.originalname).match(/^\.[a-zA-Z0-9]{1,10}$/)?.[0] || '';
        callback(null, `${id}${extension}`);
      },
    });
  }

  async remove(filePath) {
    if (!filePath) {
      return;
    }
    const resolvedPath = path.resolve(filePath);
    if (!isPathInsideDirectory(resolvedPath, this.directory)) {
      return;
    }
    await fs.promises.unlink(resolvedPath).catch(() => {});
  }

  validatePath(filePath) {
    const resolvedPath = path.resolve(filePath);
    if (!isPathInsideDirectory(resolvedPath, this.directory)) {
      const error = new Error('Caminho de armazenamento inválido.');
      error.statusCode = 500;
      error.code = 'INTERNAL_ERROR';
      throw error;
    }
    try {
      if (fs.lstatSync(resolvedPath).isSymbolicLink()) {
        const error = new Error('Caminho de armazenamento inválido.');
        error.statusCode = 500;
        error.code = 'INTERNAL_ERROR';
        throw error;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    return resolvedPath;
  }
}

module.exports = LocalStorage;