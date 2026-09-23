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
    <form onSubmit={handleSubmit}>
      <label htmlFor="document-file">Documento</label>
      <input
        id="document-file"
        type="file"
        onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
        disabled={disabled}
      />
      <button type="submit" disabled={!selectedFile || disabled}>
        {disabled ? 'Enviando...' : 'Enviar documento'}
      </button>
    </form>
  );
}
