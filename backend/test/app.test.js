const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const storageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDirectory;
process.env.MAX_FILE_SIZE = '10';

const app = require('../src/app');

let server;
let baseUrl;

before(async () => {
  server = await new Promise((resolve) => {
    const listeningServer = app.listen(0, () => resolve(listeningServer));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  fs.rmSync(storageDirectory, { recursive: true, force: true });
});

function createUploadBody(content, filename = 'document.txt') {
  const formData = new FormData();
  formData.append('file', new Blob([content], { type: 'text/plain' }), filename);
  return formData;
}

async function uploadDocument({ owner = 'user-1', content = 'documento', filename = 'document.txt' } = {}) {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: createUploadBody(content, filename),
  });
  return { response, document: await response.json() };
}

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('faz upload de documento', async () => {
  const { response, document } = await uploadDocument({ owner: 'upload-user', content: 'documento' });

  assert.equal(response.status, 201);
  assert.equal(document.originalName, 'document.txt');
  assert.equal(document.owner, 'upload-user');
  assert.equal(document.size, 9);
});

test('lista documentos do usuário autenticado', async () => {
  const { document } = await uploadDocument({ owner: 'list-user', content: 'listagem' });

  const listResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'list-user' },
  });
  assert.deepEqual(await listResponse.json(), [document]);

  const otherUserResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'other-list-user' },
  });
  assert.deepEqual(await otherUserResponse.json(), []);
});

test('baixa documento enviado pelo usuário', async () => {
  const { document } = await uploadDocument({ owner: 'download-user', content: 'download' });

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'download-user' },
  });

  assert.equal(downloadResponse.status, 200);
  assert.equal(await downloadResponse.text(), 'download');
  assert.match(downloadResponse.headers.get('content-disposition'), /attachment/);
});

test('rejeita requisições sem usuário', async () => {
  const response = await fetch(`${baseUrl}/documents`);

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'INVALID_REQUEST');
});

test('rejeita upload sem usuário e não deixa arquivo órfão', async () => {
  const fileCountBeforeUpload = fs.readdirSync(storageDirectory).length;
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: createUploadBody('sem owner'),
  });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'INVALID_REQUEST');
  assert.equal(fs.readdirSync(storageDirectory).length, fileCountBeforeUpload);
});

test('rejeita arquivo acima do limite configurado', async () => {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: createUploadBody('conteúdo maior que dez bytes'),
  });

  assert.equal(response.status, 413);
  assert.equal((await response.json()).error.code, 'FILE_TOO_LARGE');
});

test('retorna erro quando upload não contém arquivo', async () => {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: new FormData(),
  });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'INVALID_REQUEST');
});

test('rejeita arquivo vazio', async () => {
  const fileCountBeforeUpload = fs.readdirSync(storageDirectory).length;
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: createUploadBody(''),
  });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'INVALID_REQUEST');
  assert.equal(fs.readdirSync(storageDirectory).length, fileCountBeforeUpload);
});

test('rejeita arquivo sem nome original', async () => {
  const formData = new FormData();
  formData.append('file', new Blob(['conteudo'], { type: 'text/plain' }), ' ');

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: formData,
  });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'INVALID_REQUEST');
});

test('rejeita mais de um arquivo por requisição', async () => {
  const formData = new FormData();
  formData.append('file', new Blob(['um'], { type: 'text/plain' }), 'one.txt');
  formData.append('file', new Blob(['dois'], { type: 'text/plain' }), 'two.txt');

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: formData,
  });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'INVALID_REQUEST');
});

test('não permite download por outro usuário ou por ID inválido', async () => {
  const forbiddenResponse = await fetch(`${baseUrl}/documents/not-a-document/download`, {
    headers: { 'X-User-Id': 'user-2' },
  });
  assert.equal(forbiddenResponse.status, 400);
  assert.equal((await forbiddenResponse.json()).error.code, 'INVALID_REQUEST');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: createUploadBody('owned'),
  });
  const document = await uploadResponse.json();

  const forbiddenDocumentResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'user-2' },
  });
  assert.equal(forbiddenDocumentResponse.status, 404);
  assert.equal((await forbiddenDocumentResponse.json()).error.code, 'DOCUMENT_NOT_FOUND');

  const missingResponse = await fetch(`${baseUrl}/documents/550e8400-e29b-41d4-a716-446655440000/download`, {
    headers: { 'X-User-Id': 'user-2' },
  });
  assert.equal(missingResponse.status, 404);
  assert.equal((await missingResponse.json()).error.code, 'DOCUMENT_NOT_FOUND');
});

test('retorna erro quando arquivo físico não existe', async () => {
  const filesBeforeUpload = new Set(fs.readdirSync(storageDirectory));
  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: createUploadBody('removido'),
  });
  const document = await uploadResponse.json();
  const [newFile] = fs.readdirSync(storageDirectory).filter((file) => !filesBeforeUpload.has(file));
  fs.rmSync(path.join(storageDirectory, newFile));

  const response = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'user-1' },
  });

  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, 'DOCUMENT_NOT_FOUND');
});

test('responde ao health check', async () => {
  const response = await fetch(`${baseUrl}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});
