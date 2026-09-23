const API_BASE_URL = '/api';

async function parseResponse(response) {
  if (response.ok) {
    return response;
  }

  let message = 'Não foi possível concluir a operação.';
  try {
    const body = await response.json();
    message = body.error?.message || message;
  } catch {
    // Mantém mensagem padrão quando backend não retorna JSON.
  }

  throw new Error(message);
}

export async function listDocuments(owner) {
  const response = await fetch(`${API_BASE_URL}/documents`, {
    headers: { 'X-User-Id': owner },
  });
  await parseResponse(response);
  return response.json();
}

export async function uploadDocument(file, owner) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: formData,
  });
  await parseResponse(response);
  return response.json();
}

export async function downloadDocument(id, owner) {
  const response = await fetch(`${API_BASE_URL}/documents/${encodeURIComponent(id)}/download`, {
    headers: { 'X-User-Id': owner },
  });
  await parseResponse(response);
  return response.blob();
}
