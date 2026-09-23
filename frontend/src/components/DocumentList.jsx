import DownloadButton from './DownloadButton.jsx';

function formatFileSize(size) {
  if (size < 1024) {
    return `${size} B`;
  }
  return `${(size / 1024).toFixed(1)} KB`;
}

export default function DocumentList({ documents, owner, onDownloadError }) {
  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-mark" aria-hidden="true">＋</span>
        <span>Nenhum documento enviado ainda. Seu arquivo aparecerá aqui.</span>
      </div>
    );
  }

  return (
    <ul className="document-list">
      {documents.map((document) => (
        <li className="document-item" key={document.id}>
          <div className="document-main">
            <span className="document-type" aria-hidden="true">FILE</span>
            <span className="document-name" title={document.originalName}>{document.originalName}</span>
          </div>
          <span className="document-meta">
            {formatFileSize(document.size)} ·{' '}
            <time dateTime={document.uploadedAt}>
              {new Date(document.uploadedAt).toLocaleDateString('pt-BR')}
            </time>
          </span>
          <DownloadButton
            document={document}
            owner={owner}
            onError={onDownloadError}
          />
        </li>
      ))}
    </ul>
  );
}
