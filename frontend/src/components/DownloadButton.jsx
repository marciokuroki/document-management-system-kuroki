import { useState } from 'react';
import { downloadDocument } from '../services/api.js';

export default function DownloadButton({ document, owner, onError }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await downloadDocument(document.id, owner);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      onError(error);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button type="button" onClick={handleDownload} disabled={downloading}>
      {downloading ? 'Baixando...' : 'Baixar'}
    </button>
  );
}
