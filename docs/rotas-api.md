# Documentacao das rotas da API

Este documento descreve as rotas JSON registradas no projeto pelo arquivo
`config/routes.php`, no bloco `ROTAS API`.

Base local:

```txt
http://cidadeinteligente.online/conecta_boaesperanca/api
```

Em producao, troque apenas o host e mantenha o prefixo `/conecta_boaesperanca/api`, caso o
projeto continue instalado nessa pasta.

## Padrao geral

Todas as respostas da API sao JSON.

Rotas publicas:

```txt
POST /api/login
GET  /api/setores
GET  /api/servicos
```

Rotas protegidas exigem o cabecalho:

```txt
Authorization: Bearer SEU_TOKEN
```

O token e gerado no login e assinado com `API_SECRET`, definido em
`config/config.php`. A validade atual do token e de 7 dias.

## Resumo das rotas

| Metodo | Rota | Autenticacao | Finalidade |
| --- | --- | --- | --- |
| `OPTIONS` | `/api/login` | Nao | Pre-flight CORS do login |
| `POST` | `/api/login` | Nao | Autenticar usuario e gerar token |
| `OPTIONS` | `/api/me` | Nao | Pre-flight CORS |
| `GET` | `/api/me` | Sim | Buscar dados do usuario autenticado |
| `OPTIONS` | `/api/setores` | Nao | Pre-flight CORS |
| `GET` | `/api/setores` | Nao | Listar setores/secretarias |
| `OPTIONS` | `/api/servicos` | Nao | Pre-flight CORS |
| `GET` | `/api/servicos` | Nao | Listar servicos, com filtro opcional por setor |
| `OPTIONS` | `/api/solicitacoes` | Nao | Pre-flight CORS |
| `GET` | `/api/solicitacoes` | Sim | Listar solicitacoes do usuario autenticado |
| `POST` | `/api/solicitacoes` | Sim | Criar uma nova solicitacao |
| `OPTIONS` | `/api/solicitacoes/{id}` | Nao | Pre-flight CORS |
| `GET` | `/api/solicitacoes/{id}` | Sim | Detalhar uma solicitacao |
| `OPTIONS` | `/api/solicitacoes/{id}/status` | Nao | Pre-flight CORS |
| `POST` | `/api/solicitacoes/{id}/status` | Sim | Alterar status de uma solicitacao |
| `OPTIONS` | `/api/tecnico/localizacao` | Nao | Pre-flight CORS |
| `POST` | `/api/tecnico/localizacao` | Sim | Registrar localizacao atual do tecnico |

## CORS e OPTIONS

As rotas `OPTIONS` existem para atender requisicoes pre-flight feitas por
aplicativos mobile, navegadores ou clientes que enviam `Authorization` e
`Content-Type`.

Resposta esperada:

```txt
HTTP 204 No Content
```

Cabecalhos aplicados:

```txt
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Methods: GET, POST, OPTIONS
Content-Type: application/json; charset=utf-8
```

No login, o metodo `OPTIONS /api/login` tambem aceita pre-flight e pode retornar
`204`.

## POST /api/login

Autentica um usuario por email e senha. Se as credenciais forem validas, retorna
um token para acessar as rotas protegidas.

Controller:

```txt
LoginController@apiLogar
```

Autenticacao:

```txt
Nao exige token.
```

Content-Type aceito:

```txt
application/json
application/x-www-form-urlencoded
```

Body JSON:

```json
{
  "email": "usuario@email.com",
  "senha": "123456"
}
```

Resposta `200`:

```json
{
  "ok": true,
  "token": "TOKEN_GERADO",
  "expires_in": 604800,
  "usuario": {
    "id": 17,
    "nome": "Maria",
    "email": "usuario@email.com",
    "tipo": "cidadao",
    "id_setor": null,
    "imagem": null
  }
}
```

Campos importantes:

| Campo | Descricao |
| --- | --- |
| `token` | Token Bearer usado nas proximas requisicoes |
| `expires_in` | Validade em segundos; hoje e `604800`, equivalente a 7 dias |
| `usuario.tipo` | Perfil do usuario, como `admin`, `setor`, `tecnico`, `cidadao` ou `entrevistador` |
| `usuario.id_setor` | Setor vinculado ao usuario, quando existir |
| `usuario.imagem` | URL completa da imagem do usuario, quando existir |

Erros possiveis:

```json
{ "ok": false, "erro": "email_e_senha_obrigatorios" }
```

```json
{ "ok": false, "erro": "email_ou_senha_invalidos" }
```

```json
{ "ok": false, "erro": "email_nao_confirmado" }
```

Exemplo com curl:

```bash
curl -X POST "http://cidadeinteligente.online/conecta_boaesperanca/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"usuario@email.com\",\"senha\":\"123456\"}"
```

## GET /api/me

Retorna os dados seguros do usuario autenticado.

Controller:

```txt
ApiController@me
```

Autenticacao:

```txt
Obrigatoria.
```

Cabecalho:

```txt
Authorization: Bearer TOKEN_GERADO
```

Resposta `200`:

```json
{
  "ok": true,
  "usuario": {
    "id": 17,
    "nome": "Maria",
    "email": "usuario@email.com",
    "tipo": "cidadao",
    "id_setor": null,
    "imagem": null
  }
}
```

Erros possiveis:

```json
{ "ok": false, "erro": "token_invalido" }
```

```json
{ "ok": false, "erro": "usuario_nao_encontrado" }
```

## GET /api/setores

Lista todos os setores/secretarias cadastrados.

Controller:

```txt
ApiController@setores
```

Autenticacao:

```txt
Nao exige token.
```

Resposta `200`:

```json
{
  "ok": true,
  "dados": [
    {
      "id_setor": 1,
      "nome": "Infraestrutura",
      "sigla": "INFRA",
      "total_servicos": 5
    }
  ]
}
```

Observacao: os campos retornados dependem das colunas da tabela `setor`. A API
acrescenta `total_servicos`, calculado pela quantidade de servicos ligados ao
setor.

## GET /api/servicos

Lista servicos cadastrados. Pode retornar todos os servicos ou apenas os
servicos de um setor especifico.

Controller:

```txt
ApiController@servicos
```

Autenticacao:

```txt
Nao exige token.
```

Query params:

| Parametro | Obrigatorio | Descricao |
| --- | --- | --- |
| `id_setor` | Nao | Quando informado, filtra servicos pelo setor |

Exemplos:

```txt
GET /api/servicos
GET /api/servicos?id_setor=1
```

Resposta `200` sem filtro:

```json
{
  "ok": true,
  "dados": [
    {
      "id_servico": 1,
      "id_setor": 1,
      "nome": "Iluminacao publica",
      "nome_setor": "Infraestrutura"
    }
  ]
}
```

Resposta `200` com `id_setor`:

```json
{
  "ok": true,
  "dados": [
    {
      "id_servico": 1,
      "id_setor": 1,
      "nome": "Iluminacao publica",
      "nome_setor": "Infraestrutura",
      "sigla": "INFRA"
    }
  ]
}
```

Observacao: os campos retornados dependem das colunas da tabela `servico` e dos
dados unidos da tabela `setor`.

## GET /api/solicitacoes

Lista as solicitacoes criadas pelo usuario autenticado.

Controller:

```txt
ApiController@solicitacoes
```

Autenticacao:

```txt
Obrigatoria.
```

Query params:

| Parametro | Obrigatorio | Padrao | Descricao |
| --- | --- | --- | --- |
| `page` | Nao | `1` | Pagina atual |
| `per_page` | Nao | `10` | Itens por pagina; maximo `50` |
| `status` | Nao | Nenhum | Filtra por status |
| `data_inicio` | Nao | Nenhum | Data inicial no formato `YYYY-MM-DD` |
| `data_fim` | Nao | Nenhum | Data final no formato `YYYY-MM-DD` |

Status usados pelo projeto:

```txt
aberto
em_analise
em_andamento
resolvido
fechado
cancelado
```

Exemplos:

```txt
GET /api/solicitacoes
GET /api/solicitacoes?page=1&per_page=10
GET /api/solicitacoes?status=aberto&data_inicio=2026-05-01&data_fim=2026-05-31
```

Resposta `200`:

```json
{
  "ok": true,
  "dados": [
    {
      "id_solicitacao": 75,
      "id_usuario": 17,
      "id_servico": 1,
      "descricao": "Buraco grande na avenida",
      "status": "aberto",
      "status_nome": "Aberta",
      "nome_servico": "Tapa-buraco",
      "criado_em": "2026-05-08 10:00:00"
    }
  ],
  "paginacao": {
    "page": 1,
    "per_page": 10,
    "total": 1,
    "total_pages": 1
  }
}
```

Regras:

```txt
page sempre fica no minimo em 1.
per_page sempre fica entre 1 e 50.
A listagem mostra apenas solicitacoes em que id_usuario e o usuario autenticado.
```

Erros possiveis:

```json
{ "ok": false, "erro": "token_invalido" }
```

## POST /api/solicitacoes

Cria uma nova solicitacao para o usuario autenticado.

Controller:

```txt
ApiController@criarSolicitacao
```

Autenticacao:

```txt
Obrigatoria.
```

Content-Type aceito:

```txt
application/json
multipart/form-data
```

Campos:

| Campo | Obrigatorio | Descricao |
| --- | --- | --- |
| `id_servico` | Sim | ID do servico solicitado |
| `descricao` | Sim | Descricao do problema ou pedido |
| `endereco` | Nao | Endereco informado pelo usuario |
| `bairro` | Nao | Bairro |
| `numero` | Nao | Numero do endereco |
| `latitude` | Nao | Latitude do ponto informado |
| `longitude` | Nao | Longitude do ponto informado |
| `prioridade` | Nao | Padrao `media`; aceita `baixa`, `media`, `alta`, `critica` |
| `fotos[]` | Nao | Ate 5 imagens, apenas em `multipart/form-data` |

Body JSON sem fotos:

```json
{
  "id_servico": 1,
  "descricao": "Buraco grande na avenida",
  "endereco": "Av. Principal, 123",
  "bairro": "Centro",
  "numero": "123",
  "latitude": "-12.54480100",
  "longitude": "-55.72750900",
  "prioridade": "media"
}
```

Resposta `201`:

```json
{
  "ok": true,
  "id_solicitacao": 75,
  "fotos": []
}
```

Regras das fotos:

| Regra | Valor |
| --- | --- |
| Quantidade maxima | 5 fotos |
| Tamanho maximo | Usa `config_upload["tamanho"]`; atualmente `2097152` bytes, ou 2 MB |
| Extensoes aceitas | `jpg`, `jpeg`, `png`, `gif`, `bmp`, `webp` |
| Validacao extra | O arquivo precisa ser reconhecido por `getimagesize` |
| Tipo salvo | `problema` |

Exemplo com fotos:

```bash
curl -X POST "http://cidadeinteligente.online/conecta_boaesperanca/api/solicitacoes" \
  -H "Authorization: Bearer TOKEN_GERADO" \
  -F "id_servico=1" \
  -F "descricao=Buraco grande na avenida" \
  -F "endereco=Av. Principal, 123" \
  -F "bairro=Centro" \
  -F "numero=123" \
  -F "latitude=-12.54480100" \
  -F "longitude=-55.72750900" \
  -F "prioridade=media" \
  -F "fotos[]=@C:/caminho/foto1.jpg" \
  -F "fotos[]=@C:/caminho/foto2.png"
```

Resposta `201` com fotos:

```json
{
  "ok": true,
  "id_solicitacao": 75,
  "fotos": [
    {
      "id_foto": 101,
      "caminho": "a1b2c3.jpg",
      "url": "http://cidadeinteligente.online/conecta_boaesperanca/app/upload/a1b2c3.jpg",
      "tipo": "problema",
      "metadata": {
        "original_name": "foto1.jpg",
        "size": 123456,
        "mime": "image/jpeg",
        "upload_date": "2026-05-08 10:00:00",
        "source": "mobile_api"
      }
    }
  ]
}
```

O que a rota faz internamente:

```txt
1. Valida o token.
2. Valida id_servico, descricao e prioridade.
3. Valida as fotos, quando enviadas.
4. Insere a solicitacao na tabela solicitacao com status aberto.
5. Salva as fotos na pasta app/upload/.
6. Insere o historico inicial na tabela historico_status.
```

Erros possiveis:

```json
{ "ok": false, "erro": "id_servico_e_descricao_obrigatorios" }
```

```json
{ "ok": false, "erro": "prioridade_invalida" }
```

```json
{
  "ok": false,
  "erro": "fotos_invalidas",
  "detalhes": ["maximo_5_fotos"]
}
```

```json
{ "ok": false, "erro": "erro_ao_criar_solicitacao" }
```

## GET /api/solicitacoes/{id}

Detalha uma solicitacao especifica.

Controller:

```txt
ApiController@solicitacao
```

Autenticacao:

```txt
Obrigatoria.
```

Parametro de rota:

| Parametro | Descricao |
| --- | --- |
| `id` | ID da solicitacao |

Exemplo:

```txt
GET /api/solicitacoes/75
```

Resposta `200`:

```json
{
  "ok": true,
  "dados": {
    "id_solicitacao": 75,
    "id_usuario": 17,
    "id_servico": 1,
    "nome_servico": "Tapa-buraco",
    "id_setor": 1,
    "descricao": "Buraco grande na avenida",
    "status": "aberto",
    "fotos": [],
    "localizacao_tecnico": null
  }
}
```

Permissao de visualizacao:

| Perfil | Pode ver quando |
| --- | --- |
| `admin` | Sempre |
| Cidadao/usuario comum | A solicitacao pertence ao proprio usuario |
| `setor` | O setor do usuario e igual ao setor do servico da solicitacao |
| `tecnico` | Sempre, conforme regra atual do controller |

Erros possiveis:

```json
{ "ok": false, "erro": "solicitacao_nao_encontrada" }
```

```json
{ "ok": false, "erro": "acesso_negado" }
```

```json
{ "ok": false, "erro": "token_invalido" }
```

## POST /api/solicitacoes/{id}/status

Altera o status de uma solicitacao e registra historico.

Controller:

```txt
ApiController@alterarStatus
```

Autenticacao:

```txt
Obrigatoria.
```

Perfis permitidos:

```txt
admin
setor
tecnico
```

Parametro de rota:

| Parametro | Descricao |
| --- | --- |
| `id` | ID da solicitacao |

Body JSON:

```json
{
  "status": "em_andamento",
  "comentario": "Atendimento iniciado pelo tecnico"
}
```

Status aceitos:

```txt
aberto
em_analise
em_andamento
resolvido
fechado
cancelado
```

Resposta `200`:

```json
{ "ok": true }
```

O que a rota faz internamente:

```txt
1. Valida o token.
2. Confere se o perfil e admin, setor ou tecnico.
3. Valida o status.
4. Busca a solicitacao.
5. Confere se o usuario pode visualizar/alterar aquela solicitacao.
6. Atualiza o campo status da solicitacao.
7. Insere registro na tabela historico_status.
```

Erros possiveis:

```json
{ "ok": false, "erro": "acesso_negado" }
```

```json
{ "ok": false, "erro": "status_invalido" }
```

```json
{ "ok": false, "erro": "solicitacao_nao_encontrada" }
```

## POST /api/tecnico/localizacao

Registra a localizacao atual de um tecnico vinculada a uma solicitacao.

Controller:

```txt
ApiController@registrarLocalizacao
```

Autenticacao:

```txt
Obrigatoria.
```

Perfil permitido:

```txt
tecnico
```

Body JSON:

```json
{
  "id_solicitacao": 75,
  "latitude": "-12.54480100",
  "longitude": "-55.72750900"
}
```

Campos:

| Campo | Obrigatorio | Descricao |
| --- | --- | --- |
| `id_solicitacao` | Sim | Solicitacao relacionada a localizacao |
| `latitude` | Sim | Latitude atual do tecnico |
| `longitude` | Sim | Longitude atual do tecnico |

Resposta `200`:

```json
{ "ok": true }
```

Resposta `400`, quando o DAO nao consegue registrar:

```json
{ "ok": false }
```

O que a rota faz internamente:

```txt
1. Valida o token.
2. Confere se o usuario autenticado e tecnico.
3. Valida id_solicitacao, latitude e longitude.
4. Insere a localizacao na tabela tecnico_localizacao.
```

Erros possiveis:

```json
{ "ok": false, "erro": "apenas_tecnico" }
```

```json
{ "ok": false, "erro": "dados_obrigatorios" }
```

## Erros de autenticacao

Rotas protegidas usam a mesma validacao de token.

Quando nao ha token, o token esta malformado, a assinatura nao confere ou o
token expirou:

```json
{ "ok": false, "erro": "token_invalido" }
```

Quando o token e valido, mas o usuario do `sub` nao existe mais na tabela
`contato`:

```json
{ "ok": false, "erro": "usuario_nao_encontrado" }
```

## Exemplo de fluxo completo

1. Fazer login.

```bash
curl -X POST "http://cidadeinteligente.online/conecta_boaesperanca/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"usuario@email.com\",\"senha\":\"123456\"}"
```

2. Copiar o `token` da resposta.

3. Listar servicos.

```bash
curl "http://cidadeinteligente.online/conecta_boaesperanca/api/servicos"
```

4. Criar solicitacao.

```bash
curl -X POST "http://cidadeinteligente.online/conecta_boaesperanca/api/solicitacoes" \
  -H "Authorization: Bearer TOKEN_GERADO" \
  -H "Content-Type: application/json" \
  -d "{\"id_servico\":1,\"descricao\":\"Buraco grande na avenida\",\"prioridade\":\"media\"}"
```

5. Consultar minhas solicitacoes.

```bash
curl "http://cidadeinteligente.online/conecta_boaesperanca/api/solicitacoes?page=1&per_page=10" \
  -H "Authorization: Bearer TOKEN_GERADO"
```

## Observacoes para manutencao

As rotas descritas aqui estao registradas em `config/routes.php`.

Os principais controllers envolvidos sao:

```txt
app/controllers/LoginController.php
app/controllers/ApiController.php
```

Os principais DAOs envolvidos sao:

```txt
app/models/dao/ServicoDao.php
app/models/dao/SolicitacaoDao.php
app/models/dao/Dao.php
```

Se uma nova rota for adicionada ao bloco `ROTAS API`, este documento tambem
deve ser atualizado.
