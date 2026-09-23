# Especificação do Document Management System

**Versão:** 1.0  
**Status:** pronta para execução  
**Data:** 2026-09-23

## 1. Objetivo

Entregar um sistema web mínimo para usuários enviarem, consultarem e baixarem documentos armazenados exclusivamente no filesystem local da aplicação, com metadados mantidos em memória.

## 2. Escopo

### 2.1 Dentro do escopo

- Upload de um documento por requisição.
- Listagem dos documentos do usuário identificado na requisição.
- Download de documento pelo identificador.
- Gestão simples por usuário usando o header `X-User-Id`.
- Interface web React para upload, listagem e download.
- Endpoint de saúde da API.
- Tratamento consistente de validações, erros de upload e falhas de filesystem.

### 2.2 Fora do escopo

- Autenticação, autorização baseada em sessão, JWT ou provedor de identidade.
- Armazenamento externo, banco de dados, nuvem ou serviço de upload de terceiros.
- Persistência dos metadados após reinício do processo.
- Versionamento, edição, exclusão, compartilhamento ou renomeação de documentos.
- Upload múltiplo na mesma requisição.
- Busca textual no conteúdo do documento.
- Allowlist de tipos MIME no MVP.
- Paginação e filtros avançados.

### 2.3 Premissas

- O cliente envia um identificador de usuário confiável no header `X-User-Id`. Como não há autenticação nesta fase, esse mecanismo é adequado apenas para ambiente controlado ou desenvolvimento.
- A pasta `backend/storage` existe ou é criada pela aplicação antes de gravar arquivos.
- O frontend de desenvolvimento usa o proxy Vite `/api`, que remove o prefixo antes de encaminhar a requisição para o backend.
- Os campos públicos do documento não expõem caminho físico nem nome interno do arquivo.

## 3. Atores e termos

| Termo | Definição |
| --- | --- |
| Usuário | Cliente identificado por `X-User-Id`. Não representa uma identidade autenticada nesta versão. |
| Documento | Metadado associado a um arquivo gravado no storage local. |
| Storage | Diretório local configurado para arquivos enviados; padrão `backend/storage`. |
| Metadado | Registro em memória com informações do documento e sua localização interna. |
| ID | UUID v4 usado para identificar o documento e nomear o arquivo físico com segurança. |

## 4. Requisitos funcionais

### RF-01 - Enviar documento

O usuário deve conseguir enviar exatamente um arquivo por requisição `multipart/form-data`.

**Pré-condições:**

- Header `X-User-Id` presente, não vazio e com no máximo 100 caracteres.
- Campo multipart chamado `file` presente.
- Arquivo com tamanho maior que zero e até 10 MiB (`10 * 1024 * 1024` bytes).

**Fluxo principal:**

1. Cliente envia o arquivo e `X-User-Id`.
2. Middleware `multer` recebe um único campo `file` e grava o conteúdo no storage local.
3. Serviço gera o ID do documento, valida o resultado do upload e cria o metadado.
4. Repositório armazena o metadado em memória.
5. API retorna o metadado público criado.

**Regras:**

- O nome original é preservado somente como metadado e não é usado diretamente como nome físico.
- O nome físico deve ser derivado do UUID e manter a extensão segura, quando aplicável.
- O proprietário do documento é o valor de `X-User-Id`.
- Falha ao persistir o metadado após a gravação deve remover o arquivo recém-gravado, quando possível, para evitar órfão.

### RF-02 - Listar documentos

O usuário deve conseguir listar seus documentos por `GET /documents`.

**Regras:**

- `X-User-Id` é obrigatório.
- Retornar somente documentos cujo `owner` seja igual ao usuário da requisição.
- Ordenar por `uploadedAt` decrescente; em empate, ordenar por `id` crescente.
- Retornar array vazio quando não houver documentos.
- Não incluir caminho físico ou outros detalhes internos.

### RF-03 - Baixar documento

O usuário deve conseguir baixar um documento seu por `GET /documents/:id/download`.

**Regras:**

- `X-User-Id` é obrigatório.
- O ID deve identificar um documento pertencente ao usuário informado.
- Documento inexistente ou pertencente a outro usuário responde `404`, sem revelar se o ID existe para outro proprietário.
- O conteúdo é retornado como binário.
- O nome sugerido ao cliente é `originalName`.
- O caminho de leitura é obtido do metadado interno; nunca é montado diretamente a partir de entrada do cliente.

### RF-04 - Verificar saúde da API

`GET /health` deve responder `200` com `{ "status": "ok" }`, sem exigir identificação de usuário. O endpoint serve para verificar disponibilidade básica do processo HTTP.

## 5. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Arquivos devem ser gravados localmente em diretório configurável, usando `multer` com `diskStorage`. Não usar armazenamento externo. |
| RNF-02 | Metadados devem ser mantidos em memória nesta fase. Reiniciar o backend perde os registros, mesmo que arquivos físicos permaneçam no diretório. |
| RNF-03 | Configurações devem usar variáveis de ambiente, com `PORT=3000`, `STORAGE_DIR=backend/storage` e `MAX_FILE_SIZE=10485760` como valores padrão. |
| RNF-04 | O backend deve usar Node.js, Express e CommonJS; o frontend deve usar React, Vite, ESM e `fetch`. |
| RNF-05 | Dependências devem seguir `routes -> controllers -> services -> repositories`. Camadas internas não devem depender de Express, Multer ou detalhes de HTTP. |
| RNF-06 | Nomes físicos não podem permitir path traversal, colisão baseada em nome original ou escrita fora do storage configurado. |
| RNF-07 | O limite de upload deve ser aplicado pelo middleware e tratado como erro `413`. |
| RNF-08 | Respostas de erro da API devem usar formato JSON uniforme, exceto quando uma falha ocorrer antes de a aplicação conseguir produzir uma resposta HTTP válida. |
| RNF-09 | O frontend deve exibir estado vazio, carregamento, sucesso de upload e erro de comunicação sem bloquear o restante da página. |
| RNF-10 | Testes backend devem usar o runner nativo `node:test`, cobrindo casos de sucesso e falha dos endpoints e regras de serviço/repositório. |

## 6. Modelo de dados

### 6.1 Documento público

| Campo | Tipo | Obrigatório | Descrição e invariantes |
| --- | --- | --- | --- |
| `id` | string | Sim | UUID v4 único, imutável. |
| `originalName` | string | Sim | Nome original enviado pelo cliente; não vazio; devolvido como nome de download. |
| `size` | number | Sim | Tamanho em bytes; inteiro maior que zero e menor ou igual a 10 MiB. |
| `uploadedAt` | string | Sim | Data/hora do upload em ISO 8601 UTC. |
| `owner` | string | Sim | Valor validado de `X-User-Id`; máximo de 100 caracteres. |

Exemplo:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-09-23T14:30:00.000Z",
  "owner": "user-123"
}
```

### 6.2 Representação interna

A persistência em memória deve associar o documento público a um campo interno não exposto:

| Campo interno | Tipo | Descrição |
| --- | --- | --- |
| `storageName` | string | Nome físico seguro usado dentro do storage, derivado do UUID e sem aceitar caminho fornecido pelo cliente. |
| `storagePath` | string | Caminho resolvido pelo adaptador de filesystem; não deve ser retornado pela API. |
|
O repositório pode armazenar o registro público junto dos campos internos ou manter estruturas separadas, desde que controllers nunca exponham esses campos.

### 6.3 Ciclo de vida

1. O arquivo físico é gravado.
2. O registro é criado no repositório em memória.
3. O registro pode ser consultado até o processo reiniciar.
4. Após reinício, não há reconstrução automática dos metadados.
5. Arquivo físico sem registro não fica acessível pelas APIs; rotina de limpeza automática está fora do escopo.

## 7. Contratos de API

### 7.1 Convenções de erro

Respostas de erro usam:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

`code` é estável para consumidores; `message` é legível e pode ser exibida ao usuário. A API não deve incluir stack trace, caminho local ou detalhes de filesystem.

Códigos mínimos:

| HTTP | `code` | Uso |
| --- | --- | --- |
| `400` | `INVALID_REQUEST` | Header, campo, ID ou entrada inválida. |
| `404` | `DOCUMENT_NOT_FOUND` | Documento inexistente, inacessível ao usuário ou arquivo ausente. |
| `413` | `FILE_TOO_LARGE` | Arquivo excede o limite configurado. |
| `415` | `UNSUPPORTED_MEDIA_TYPE` | Requisição não é `multipart/form-data` no upload. |
| `500` | `INTERNAL_ERROR` | Falha inesperada sem detalhe interno. |

### 7.2 `POST /upload`

**Requisição**

- Content-Type: `multipart/form-data`.
- Header obrigatório: `X-User-Id: user-123`.
- Campo obrigatório: `file`.
- Apenas um arquivo deve ser aceito.
- Limite padrão: 10 MiB.

O frontend deve chamar `/api/upload`; o proxy remove `/api` em desenvolvimento.

**Sucesso**

- Status: `201 Created`.
- Content-Type: `application/json`.
- Corpo: objeto `Document` público.

**Falhas**

- `400 INVALID_REQUEST`: header ausente/vazio, arquivo ausente, arquivo vazio, mais de um arquivo ou nome original inválido.
- `413 FILE_TOO_LARGE`: tamanho acima do limite.
- `415 UNSUPPORTED_MEDIA_TYPE`: Content-Type incompatível.
- `500 INTERNAL_ERROR`: falha de gravação ou registro que não possa ser recuperada.

### 7.3 `GET /documents`

**Requisição**

- Header obrigatório: `X-User-Id: user-123`.
- Sem corpo.

**Sucesso**

- Status: `200 OK`.
- Content-Type: `application/json`.
- Corpo: array ordenado de `Document` públicos.

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "relatorio.pdf",
    "size": 24576,
    "uploadedAt": "2026-09-23T14:30:00.000Z",
    "owner": "user-123"
  }
]
```

**Falhas**

- `400 INVALID_REQUEST`: header ausente, vazio ou acima do tamanho permitido.
- `500 INTERNAL_ERROR`: falha inesperada ao consultar o repositório.

### 7.4 `GET /documents/:id/download`

**Requisição**

- Header obrigatório: `X-User-Id: user-123`.
- Parâmetro `id`: UUID do documento.
- Sem corpo.

**Sucesso**

- Status: `200 OK`.
- Corpo: bytes do arquivo original.
- `Content-Disposition: attachment; filename="<nome-sanitizado>"`.
- `Content-Type`: tipo detectado pelo arquivo ou `application/octet-stream` como fallback.
- `Content-Length`: tamanho conhecido do arquivo, quando disponível.

O nome usado no header deve ser sanitizado para impedir injeção de header; o conteúdo do arquivo não deve ser carregado inteiro em memória sem necessidade.

**Falhas**

- `400 INVALID_REQUEST`: ID ausente ou em formato inválido.
- `404 DOCUMENT_NOT_FOUND`: documento não existe para o usuário ou arquivo físico não está disponível.
- `500 INTERNAL_ERROR`: erro inesperado ao abrir/transmitir o arquivo.

### 7.5 `GET /health`

- Sem autenticação ou headers obrigatórios.
- Status: `200 OK`.
- Corpo: `{ "status": "ok" }`.

## 8. Arquitetura e responsabilidades

### 8.1 Fluxo de dependência

```text
routes -> controllers -> services -> repositories
             |              |
       HTTP/Multer      regras de negócio
                            |
                     adaptadores locais
```

- `routes/`: registra caminhos, métodos, middleware de upload e encaminha para controllers.
- `controllers/`: lê parâmetros, headers e arquivos; chama services; traduz resultados e erros para HTTP.
- `services/`: valida regras de negócio, ownership, limites, criação de ID/timestamp e coordena repositório com armazenamento.
- `repositories/`: mantém metadados em memória e fornece operações de criar, buscar por ID e listar por owner.
- Adaptador de storage local: encapsula filesystem e `diskStorage`; nunca permite que entrada HTTP escolha caminho arbitrário.
- `app.js`: configura Express, middleware global, rotas, tratamento de erros e endpoint `/health`.

### 8.2 Regras de isolamento

- Service não recebe `req` ou `res`.
- Repository não conhece Express, status HTTP ou headers.
- Controller não implementa regra de ownership nem manipula caminhos diretamente.
- Frontend conhece apenas endpoints e modelos públicos.
- Rotas públicas devem ser preservadas sem prefixo `/api` no backend; `/api` pertence ao proxy de desenvolvimento.

## 9. Requisitos do frontend

- Exibir controle de seleção de arquivo e ação de upload.
- Enviar `X-User-Id` e `FormData` sem definir manualmente o boundary de multipart.
- Carregar a lista inicial e atualizá-la após upload bem-sucedido.
- Exibir nome, tamanho, data e ação de download de cada documento.
- Usar `/api/documents` e `/api/upload` no ambiente Vite.
- Tratar respostas não-2xx, backend indisponível, lista vazia e upload em andamento.
- Não exibir campos internos como `storageName` ou `storagePath`.

## 10. Critérios de aceitação

- [ ] Upload válido retorna `201`, cria metadado e grava bytes em `backend/storage`.
- [ ] Upload sem `X-User-Id` retorna `400` e não cria documento acessível.
- [ ] Upload sem `file`, vazio, múltiplo ou acima de 10 MiB retorna erro documentado.
- [ ] Listagem retorna somente documentos do owner informado e respeita ordenação.
- [ ] Listagem sem documentos retorna `200` com array vazio.
- [ ] Download do próprio documento retorna bytes e headers de arquivo corretos.
- [ ] Download de ID inexistente ou de outro owner retorna `404` uniforme.
- [ ] ID recebido não permite traversal nem acesso fora do storage.
- [ ] Reinício do processo perde metadados conforme definido, sem introduzir banco ou storage externo.
- [ ] `/health` responde conforme contrato.
- [ ] Frontend suporta upload, listagem, download, estado vazio, carregamento e erros.
- [ ] Testes backend cobrem casos positivos, validações, ownership, limite e falhas de arquivo.

## 11. Plano de execução em etapas

O plano abaixo define a ordem futura de implementação. A execução deste documento não inclui alterações nos arquivos de backend ou frontend.

### Etapa 1 - Fundação e configuração

- Confirmar scripts existentes e dependências necessárias, adicionando apenas dependências aprovadas pelo projeto.
- Centralizar `PORT`, `STORAGE_DIR` e `MAX_FILE_SIZE` em configuração orientada por ambiente.
- Garantir criação/verificação segura do diretório de storage.
- Preservar `/health` e o export do app para testes.

**Saída:** aplicação inicia com configuração explícita e storage local disponível.

### Etapa 2 - Repositório e adaptador de storage

- Implementar repositório em memória para criar, buscar por ID e listar por owner.
- Implementar adaptador de filesystem com nomes derivados de UUID.
- Definir erros de domínio para documento ausente, owner inválido e falha de storage.

**Saída:** regras de persistência testáveis sem depender de controllers.

### Etapa 3 - Upload

- Configurar `multer.diskStorage` no diretório local.
- Adicionar rota e controller de `POST /upload`.
- Implementar validação de header, campo `file`, tamanho e consistência do registro.
- Remover arquivo se a criação do metadado falhar.

**Saída:** upload válido e erros de entrada cobertos por testes.

### Etapa 4 - Listagem e download

- Adicionar `GET /documents` com filtro por owner e ordenação determinística.
- Adicionar `GET /documents/:id/download` com autorização por owner, stream e headers seguros.
- Mapear falha de arquivo ausente para `404` sem revelar detalhes internos.

**Saída:** ciclo completo de consulta e download disponível na API.

### Etapa 5 - Frontend

- Substituir tela seed por página de documentos.
- Criar componentes de upload, lista e item de documento.
- Centralizar chamadas `fetch` em `frontend/src/services`.
- Implementar loading, estado vazio, sucesso, erro e download.
- Usar prefixo `/api` conforme proxy existente.

**Saída:** usuário consegue executar o fluxo completo pelo navegador.

### Etapa 6 - Testes e validação integrada

- Expandir testes backend com `node:test` para rotas, services, repositório, upload, ownership, limite, download e falhas.
- Executar build do frontend.
- Executar backend e frontend localmente, validar upload de arquivo real, listagem, isolamento entre owners e download.
- Verificar que arquivos e metadados respeitam o ciclo de vida documentado.

**Saída:** critérios de aceitação verificados e documentação de execução atualizada, se necessário.

## 12. Comandos de referência

Backend:

```bash
cd backend
npm test
npm start
```

Frontend:

```bash
cd frontend
npm run build
npm run dev
```

Execução local integrada: iniciar backend em `http://localhost:3000` e frontend em `http://localhost:5173`. O navegador deve acessar o frontend; as chamadas `/api/*` serão encaminhadas pelo proxy Vite.
