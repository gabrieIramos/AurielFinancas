# Guia de Upload de Arquivos - Backend

## Dependências Necessárias

Instale o pacote para suporte a upload:

```bash
npm install @nestjs/platform-express
```

## Implementação do Backend - Resumo

### 1. **CSV Parser** (`csv-parser.service.ts`)
Suporta múltiplos formatos:
- **Formato 1**: `data,descricao,valor` (com sinal indicando tipo)
- **Formato 2**: `data,descricao,debito,credito`
- **Formato 3**: `data,descricao,tipo,valor`

Exemplo de CSV:
```csv
data,descricao,valor
12/01/2024,SUPERMERCADO ABC,-150.50
12/01/2024,SALÁRIO,5000.00
```

### 2. **OFX Parser** (`ofx-parser.service.ts`)
Parse de arquivo OFX 1.x
- Extrai bloco `<STMTTRN>`
- Detecta tipo (DEBIT/CREDIT)
- Formata data de `YYYYMMDD` para `YYYY-MM-DD`

Exemplo de OFX:
```
OFXHEADER:100
...
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20240112
<TRNAMT>-150.50
<FITID>0001
<NAME>SUPERMERCADO ABC
</STMTTRN>
```

### 3. **Endpoint** (`POST /transactions/import`)

**Request:**
```
POST /transactions/import
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <arquivo.csv ou arquivo.ofx>
accountId: <opcional - ID da conta, se não especificado usa a primeira>
```

**Response:**
```json
{
  "message": "Importação concluída: 15 transação(ões) adicionada(s)",
  "imported": 15,
  "errors": [],
  "file": "extrato.csv"
}
```

### 4. **Fluxo de Processamento**

1. **Validação de arquivo**
   - Verifica extensão (.csv ou .ofx)
   - Valida conteúdo

2. **Parse**
   - CSV: detecta formato automaticamente
   - OFX: extrai transações dos blocos STMTTRN

3. **Processamento**
   - Para cada transação:
     - Valida data
     - Valida valor
     - Gera hash para deduplicação
     - Categoriza com IA
     - Salva no banco

4. **Retorno**
   - Quantidade importada
   - Lista de erros (se houver)
   - Não interrompe para erros individuais

## Teste Manual

### Com CURL:

**CSV:**
```bash
curl -X POST http://localhost:3000/transactions/import \
  -H "Authorization: Bearer <token>" \
  -F "file=@extrato.csv"
```

**OFX:**
```bash
curl -X POST http://localhost:3000/transactions/import \
  -H "Authorization: Bearer <token>" \
  -F "file=@extrato.ofx"
```

### Com Thunder Client / Postman:

1. POST `http://localhost:3000/transactions/import`
2. Headers: `Authorization: Bearer <token>`
3. Body: form-data
   - `file`: selecionar arquivo
   - `accountId`: (opcional)

## Tratamento de Erros

Se um arquivo tiver erros:

```json
{
  "message": "Importação concluída: 10 transação(ões) adicionada(s)",
  "imported": 10,
  "errors": [
    "Linha 5: Data inválida",
    "Linha 8: Valor não reconhecido"
  ],
  "file": "extrato.csv"
}
```

O sistema continua processando mesmo com erros em linhas individuais.

## Formatos Aceitos

### CSV Suportados:
```
# Formato 1
data,descricao,valor
12/01/2024,Compra,-150.50
12/01/2024,Salário,5000

# Formato 2  
data,descricao,debito,credito
12/01/2024,Compra,150.50,
12/01/2024,Salário,,5000

# Formato 3
data,descricao,tipo,valor
12/01/2024,Compra,D,150.50
12/01/2024,Salário,C,5000
```

### Formatos de Data:
- `DD/MM/YYYY`
- `DD-MM-YYYY`
- `YYYY-MM-DD`

### Valores Suportados:
- `150.50` (ponto decimal)
- `150,50` (vírgula decimal)
- `-150.50` (negativo)
- `(150.50)` (entre parênteses = negativo)

## Deduplicação

O sistema gera hash baseado em:
- ID da conta
- Valor
- Data
- Descrição

Não importa a mesma transação duas vezes.

## Categorização Automática

Após importar, cada transação é:
1. Categori ¿zada com IA
2. Marcada se precisar revisão (confiança < 80%)
3. Salva com categoria automática
