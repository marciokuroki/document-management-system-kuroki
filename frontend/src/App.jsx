import { useCallback, useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments, uploadDocument } from './services/api.js';

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
    <main style={{ fontFamily: 'system-ui, sans-serif', margin: '0 auto', maxWidth: '60rem', padding: '2rem' }}>
      <h1>Document Management System</h1>
      <UploadComponent onUpload={handleUpload} disabled={uploading} />

      {error && <p role="alert">{error}</p>}

      <section aria-labelledby="documents-heading">
        <h2 id="documents-heading">Meus documentos</h2>
        {loading ? (
          <p>Carregando documentos...</p>
        ) : (
          <DocumentList
            documents={documents}
            owner={CURRENT_USER}
            onDownloadError={(downloadError) => setError(downloadError.message)}
          />
        )}
      </section>
    </main>
  );
}
