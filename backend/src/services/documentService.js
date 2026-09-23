const fs = require('node:fs/promises');

class DocumentService {
  constructor({ documentRepository }) {
    this.documentRepository = documentRepository;
  }

  async createDocument({ file, owner, id }) {
    const document = {
      id,
      originalName: file.originalname,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner,
      storageName: file.filename,
      mimeType: file.mimetype,
      storagePath: file.path,
    };

    try {
      return this.documentRepository.create(document);
    } catch (error) {
      await fs.unlink(file.path).catch(() => {});
      throw error;
    }
  }

  listDocuments(owner) {
    return this.documentRepository.findByOwner(owner).map((document) => this.toPublicDocument(document));
  }

  getDocumentForOwner(id, owner) {
    const document = this.documentRepository.findById(id);
    if (!document || document.owner !== owner) {
      return null;
    }
    return document;
  }

  toPublicDocument(document) {
    return {
      id: document.id,
      originalName: document.originalName,
      size: document.size,
      uploadedAt: document.uploadedAt,
      owner: document.owner,
    };
  }
}

module.exports = DocumentService;
