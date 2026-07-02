# API Mobile - Conecta Boa Esperanca

Base local:

```txt
http://cidadeinteligente.online/conecta_boaesperanca/api
```

Em producao, troque o host e mantenha o prefixo `/api`.

## Autenticacao

### Login

```txt
POST /login
Content-Type: application/json
```

Body:

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
  "token": "JWT_AQUI",
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

Use o token nas rotas protegidas:

```txt
Authorization: Bearer JWT_AQUI
```

## Perfil

### Usuario autenticado

```txt
GET /me
Authorization: Bearer JWT_AQUI
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

## Catalogos

### Listar setores

```txt
GET /setores
```

### Listar servicos

```txt
GET /servicos
GET /servicos?id_setor=1
```

## Solicitacoes

### Listar minhas solicitacoes

```txt
GET /solicitacoes?page=1&per_page=10
GET /solicitacoes?status=aberto&page=1&per_page=10
Authorization: Bearer JWT_AQUI
```

Filtros aceitos:

```txt
status
data_inicio  YYYY-MM-DD
data_fim     YYYY-MM-DD
page
per_page     maximo 50
```

### Detalhar solicitacao

```txt
GET /solicitacoes/{id}
Authorization: Bearer JWT_AQUI
```

Resposta inclui dados da solicitacao, fotos e ultima localizacao do tecnico quando existir.

### Criar solicitacao sem fotos

```txt
POST /solicitacoes
Authorization: Bearer JWT_AQUI
Content-Type: application/json
```

Body:

```json
{
  "id_servico": 1,
  "descricao": "Buraco grande na avenida",
  "endereco": "Av. Principal, 123",
  "bairro": "Centro",
  "numero": 123,
  "latitude": "-12.54480100",
  "longitude": "-55.72750900",
  "prioridade": "media"
}
```

Prioridades aceitas:

```txt
baixa, media, alta, critica
```

Resposta `201`:

```json
{
  "ok": true,
  "id_solicitacao": 75,
  "fotos": []
}
```

### Criar solicitacao com fotos

```txt
POST /solicitacoes
Authorization: Bearer JWT_AQUI
Content-Type: multipart/form-data
```

Campos:

```txt
id_servico    obrigatorio
descricao     obrigatorio
endereco
bairro
numero
latitude
longitude
prioridade    baixa|media|alta|critica
fotos[]       ate 5 imagens
```

Regras das fotos:

```txt
Maximo: 5 fotos
Tamanho: 2 MB por foto
Formatos: jpg, jpeg, png, gif, bmp, webp
Tipo salvo: problema
```

Exemplo com curl:

```bash
curl -X POST "http://cidadeinteligente.online/conecta_boaesperanca/api/solicitacoes" \
  -H "Authorization: Bearer JWT_AQUI" \
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

Resposta `201`:

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
        "upload_date": "2026-05-07 16:40:00",
        "source": "mobile_api"
      }
    }
  ]
}
```

### Alterar status

```txt
POST /solicitacoes/{id}/status
Authorization: Bearer JWT_AQUI
Content-Type: application/json
```

Somente `admin`, `setor` e `tecnico`.

Body:

```json
{
  "status": "em_andamento",
  "comentario": "Atendimento iniciado pelo tecnico"
}
```

Status aceitos:

```txt
aberto, em_analise, em_andamento, resolvido, fechado, cancelado
```

## Tecnico

### Registrar localizacao

```txt
POST /tecnico/localizacao
Authorization: Bearer JWT_AQUI
Content-Type: application/json
```

Somente usuario do tipo `tecnico`.

Body:

```json
{
  "id_solicitacao": 75,
  "latitude": "-12.54480100",
  "longitude": "-55.72750900"
}
```

## Erros comuns

```json
{ "ok": false, "erro": "token_invalido" }
```

```json
{ "ok": false, "erro": "fotos_invalidas", "detalhes": ["maximo_5_fotos"] }
```

```json
{ "ok": false, "erro": "id_servico_e_descricao_obrigatorios" }
```
