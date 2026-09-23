import { useState } from 'react';
import { downloadDocument } from '../services/api.js';

export default function DownloadButton({ documentMetadata, owner, onError }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await downloadDocument(documentMetadata.id, owner);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = documentMetadata.originalName;
      window.document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      onError(error);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      className="download-button"
      type="button"
      onClick={handleDownload}
      disabled={downloading}
    >
      {downloading ? 'Baixando...' : 'Baixar'}
    </button>
  );
}
