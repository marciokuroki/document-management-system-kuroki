import { useCallback, useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments, uploadDocument } from './services/api.js';
import './App.css';

const CURRENT_USER = 'user-1';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      setDocuments(await listDocuments(CURRENT_USER));
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  async function handleUpload(file) {
    setUploading(true);
    try {
      const document = await uploadDocument(file, CURRENT_USER);
      setDocuments((currentDocuments) => [document, ...currentDocuments]);
      setError('');
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="app-shell">
      <div className="page-grid">
        <header className="app-header">
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">D</span>
            <div>
              <p className="eyebrow">Arquivo pessoal</p>
              <h1>Document Management System</h1>
            </div>
          </div>
          <div className="connection-status">
            <span className="status-dot" aria-hidden="true" />
            <span>Workspace online</span>
          </div>
        </header>

        <section className="welcome-panel" aria-labelledby="welcome-heading">
          <div>
            <p className="eyebrow">Seu espaço de documentos</p>
            <h2 id="welcome-heading">Tudo importante,<br /><em>ao seu alcance.</em></h2>
            <p className="welcome-copy">Envie, organize e recupere seus arquivos com uma visão limpa do que está guardado.</p>
          </div>
          <div className="document-count" aria-label={`${documents.length} documentos armazenados`}>
            <strong>{documents.length.toString().padStart(2, '0')}</strong>
            <span>documentos<br />armazenados</span>
          </div>
        </section>

        <section className="upload-section" aria-labelledby="upload-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Adicionar ao arquivo</p>
              <h2 id="upload-heading">Envie um novo documento</h2>
            </div>
            <span className="file-limit">Limite configurado pelo servidor</span>
          </div>
          <UploadComponent onUpload={handleUpload} disabled={uploading || loading} />
        </section>

        {error && <p className="feedback feedback-error" role="alert">{error}</p>}

        <section className="documents-section" aria-labelledby="documents-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Visão geral</p>
              <h2 id="documents-heading">Seus documentos</h2>
            </div>
            {!loading && documents.length > 0 && <span className="document-total">{documents.length} {documents.length === 1 ? 'arquivo' : 'arquivos'}</span>}
          </div>
          {loading ? (
            <div className="loading-state"><span className="spinner" aria-hidden="true" />Carregando seus documentos...</div>
          ) : (
            <DocumentList
              documents={documents}
              owner={CURRENT_USER}
              onDownloadError={(downloadError) => setError(downloadError.message)}
            />
          )}
        </section>

        <footer className="app-footer">
          <span>Armazenamento local seguro</span>
          <span>·</span>
          <span>Conta {CURRENT_USER}</span>
        </footer>
      </div>
    </main>
  );
}
