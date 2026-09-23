// Seed do servidor backend do Document Management System.
//
// O backend usa storage local e mantém metadados em memória nesta primeira fase.

const express = require('express');
const multer = require('multer');
const { createDocumentRouter } = require('./routes/documentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(createDocumentRouter());

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    const isTooLarge = error.code === 'LIMIT_FILE_SIZE';
    return res.status(isTooLarge ? 413 : 400).json({
      error: {
        code: isTooLarge ? 'FILE_TOO_LARGE' : 'INVALID_REQUEST',
        message: isTooLarge ? 'Arquivo excede o limite permitido.' : 'Requisição de upload inválida.',
      },
    });
  }

  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: statusCode === 500 ? 'Erro interno do servidor.' : error.message,
    },
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
