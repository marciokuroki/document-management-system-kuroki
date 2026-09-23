const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
const multer = require('multer');
const { storageDirectory, maxFileSize } = require('../config');
const { createDocumentController } = require('../controllers/documentController');
const DocumentRepository = require('../repositories/documentRepository');
const DocumentService = require('../services/documentService');

fs.mkdirSync(storageDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, storageDirectory),
  filename: (request, file, callback) => {
    const id = crypto.randomUUID();
    request.documentId = id;
    const extension = path.extname(file.originalname).match(/^\.[a-zA-Z0-9]{1,10}$/)?.[0] || '';
    callback(null, `${id}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxFileSize, files: 1 },
});

function createDocumentRouter() {
  const router = require('express').Router();
  const documentRepository = new DocumentRepository();
  const documentService = new DocumentService({ documentRepository });
  const controller = createDocumentController({ documentService });

  router.post('/upload', upload.single('file'), controller.upload);
  router.get('/documents', controller.list);
  router.get('/documents/:id/download', controller.download);

  return router;
}

module.exports = { createDocumentRouter };
