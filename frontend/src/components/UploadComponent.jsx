import { useState } from 'react';

export default function UploadComponent({ onUpload, disabled = false }) {
  const [selectedFile, setSelectedFile] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile || disabled) {
      return;
    }

    onUpload(selectedFile);
    setSelectedFile(null);
    event.target.reset();
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <div className="file-dropzone">
        <span className="file-icon" aria-hidden="true">↑</span>
        <input
          className="file-input"
          id="document-file"
          type="file"
          onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          disabled={disabled}
        />
        <label className="file-input-label" htmlFor="document-file">
          <strong>{selectedFile ? selectedFile.name : 'Escolha um arquivo para enviar'}</strong>
          <span>{selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB selecionado` : 'Clique para procurar no dispositivo'}</span>
        </label>
      </div>
      <button className="upload-button" type="submit" disabled={!selectedFile || disabled}>
        {disabled ? 'Enviando...' : 'Enviar documento'}
      </button>
    </form>
  );
}
