import DownloadButton from './DownloadButton.jsx';

function formatFileSize(size) {
  if (size < 1024) {
    return `${size} B`;
  }
  return `${(size / 1024).toFixed(1)} KB`;
}

export default function DocumentList({ documents, owner, onDownloadError }) {
  if (documents.length === 0) {
    return <p>Nenhum documento enviado.</p>;
  }

  return (
    <ul>
      {documents.map((document) => (
        <li key={document.id}>
          <span>
            {document.originalName} ({formatFileSize(document.size)})
          </span>{' '}
          <time dateTime={document.uploadedAt}>
            {new Date(document.uploadedAt).toLocaleString('pt-BR')}
          </time>{' '}
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
