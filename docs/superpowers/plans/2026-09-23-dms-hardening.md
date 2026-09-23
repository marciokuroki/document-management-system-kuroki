# DMS Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar correções prioritárias de segurança, arquitetura, validação e UX sem alterar os endpoints públicos do DMS.

**Architecture:** Extrair operações de filesystem para um adapter local, mantendo routes responsáveis por HTTP/Multer e services responsáveis por regras de negócio. Validar entradas antes da gravação sempre que possível e garantir cleanup para falhas posteriores.

**Tech Stack:** Node.js CommonJS, Express, Multer, `node:test`, React, Vite.

**Spec:** `docs/specs/dms-spec.md`

## Global Constraints

- Preservar `POST /upload`, `GET /documents`, `GET /documents/:id/download` e `GET /health`.
- Manter storage exclusivamente local e metadados em memória.
- Manter `X-User-Id` como mecanismo de identificação do MVP; não simular autenticação.
- Não expor `storagePath` ou `storageName` na API.
- Rejeitar arquivo vazio e uploads acima de `MAX_FILE_SIZE`.

### Task 1: Backend regression tests

**Files:**
- Modify: `backend/test/app.test.js`

- [ ] **Step 1: Add tests for empty files, multiple files, invalid configuration behavior, and missing stored files.**
- [ ] **Step 2: Run `npm test` in `backend` and confirm new tests fail for the expected reasons.**

### Task 2: Local storage adapter

**Files:**
- Create: `backend/src/storage/localStorage.js`
- Modify: `backend/src/routes/documentRoutes.js`
- Modify: `backend/src/services/documentService.js`

- [ ] **Step 1: Implement adapter methods for safe filename generation, cleanup, and storage-root containment.**
- [ ] **Step 2: Inject adapter into service and keep route focused on Multer setup.**
- [ ] **Step 3: Run backend tests and repair only adapter/service failures.**

### Task 3: Input and filesystem error handling

**Files:**
- Modify: `backend/src/controllers/documentController.js`
- Modify: `backend/src/routes/documentRoutes.js`
- Modify: `backend/src/config.js`
- Modify: `backend/src/app.js`

- [ ] **Step 1: Validate owner, file presence, and nonzero size before document creation.**
- [ ] **Step 2: Validate numeric configuration at startup and map filesystem errors accurately.**
- [ ] **Step 3: Run the full backend test suite.**

### Task 4: Frontend download regression

**Files:**
- Modify: `frontend/src/components/DownloadButton.jsx`

- [ ] **Step 1: Rename the metadata prop to avoid shadowing the browser `document`.**
- [ ] **Step 2: Run `npm run build` in `frontend`.**

### Task 5: Final verification

**Files:**
- Modify: `docs/specs/dms-spec.md` only if behavior documentation needs correction.

- [ ] **Step 1: Run backend tests and frontend build from clean commands.**
- [ ] **Step 2: Inspect diff and confirm no endpoint or public response regression.**