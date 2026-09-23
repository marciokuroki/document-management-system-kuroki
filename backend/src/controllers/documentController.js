function getOwner(request) {
  const owner = request.get('X-User-Id');
  if (!owner?.trim() || owner.length > 100) {
    const error = new Error('Identificador de usuário inválido.');
    error.statusCode = 400;
    error.code = 'INVALID_REQUEST';
    throw error;
  }
  return owner;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function createDocumentController({ documentService }) {
  return {
    async upload(request, response) {
      const owner = getOwner(request);
      if (!request.file || !request.documentId) {
        const error = new Error('Arquivo é obrigatório.');
        error.statusCode = 400;
        error.code = 'INVALID_REQUEST';
        throw error;
      }
      if (request.file.size === 0 || !request.file.originalname?.trim()) {
        const error = new Error('Arquivo vazio ou nome inválido.');
        error.statusCode = 400;
        error.code = 'INVALID_REQUEST';
        throw error;
      }

      const document = await documentService.createDocument({
        file: request.file,
        owner,
        id: request.documentId,
      });
      return response.status(201).json(documentService.toPublicDocument(document));
    },

    list(request, response) {
      const owner = getOwner(request);
      return response.json(documentService.listDocuments(owner));
    },

    download(request, response, next) {
      const owner = getOwner(request);
      if (!isUuid(request.params.id)) {
        const error = new Error('Identificador de documento inválido.');
        error.statusCode = 400;
        error.code = 'INVALID_REQUEST';
        throw error;
      }

      const document = documentService.getDocumentForOwner(request.params.id, owner);
      if (!document) {
        const error = new Error('Documento não encontrado.');
        error.statusCode = 404;
        error.code = 'DOCUMENT_NOT_FOUND';
        throw error;
      }

      response.set('X-Content-Type-Options', 'nosniff');
      response.type(document.mimeType || 'application/octet-stream');
      response.attachment(document.originalName.replace(/[\\\0\r\n"]/g, '_'));
      return response.sendFile(document.storagePath, (error) => {
        if (error && !response.headersSent) {
          if (error.code === 'ENOENT') {
            error.statusCode = 404;
            error.code = 'DOCUMENT_NOT_FOUND';
          }
          next(error);
        }
      });
    },
  };
}

module.exports = { createDocumentController };
