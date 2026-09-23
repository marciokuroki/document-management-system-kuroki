class DocumentRepository {
  constructor() {
    this.documents = new Map();
  }

  create(document) {
    this.documents.set(document.id, document);
    return document;
  }

  findById(id) {
    return this.documents.get(id) || null;
  }

  findByOwner(owner) {
    return [...this.documents.values()]
      .filter((document) => document.owner === owner)
      .sort((first, second) => {
        const dateComparison = second.uploadedAt.localeCompare(first.uploadedAt);
        return dateComparison || first.id.localeCompare(second.id);
      });
  }
}

module.exports = DocumentRepository;
