const multer = require('multer');
const { storageDirectory, maxFileSize } = require('../config');
const { createDocumentController } = require('../controllers/documentController');
const DocumentRepository = require('../repositories/documentRepository');
const DocumentService = require('../services/documentService');
const LocalStorage = require('../storage/localStorage');

function createDocumentRouter() {
  const router = require('express').Router();
  const localStorage = new LocalStorage({ directory: storageDirectory });
  const upload = multer({
    storage: localStorage.createMulterStorage(),
    limits: { fileSize: maxFileSize, files: 1 },
  });
  const documentRepository = new DocumentRepository();
  const documentService = new DocumentService({ documentRepository, localStorage });
  const controller = createDocumentController({ documentService });

  async function handleUpload(request, response, next) {
    try {
      await new Promise((resolve, reject) => {
        upload.single('file')(request, response, (error) => (error ? reject(error) : resolve()));
      });
      return await controller.upload(request, response);
    } catch (error) {
      await localStorage.remove(request.file?.path);
      return next(error);
    }
  }

  router.post(
    '/upload',
    (request, _response, next) => {
      if (!request.is('multipart/form-data')) {
        const error = new Error('Tipo de conteúdo inválido.');
        error.statusCode = 415;
        error.code = 'UNSUPPORTED_MEDIA_TYPE';
        return next(error);
      }
      return next();
    },
    handleUpload
  );
  router.get('/documents', controller.list);
  router.get('/documents/:id/download', controller.download);

  return router;
}

module.exports = { createDocumentRouter };
