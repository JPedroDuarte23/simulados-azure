# Guia de Ingestão de Questões para o Simulado

Este documento detalha o formato JSON necessário para cada tipo de questão suportada pelo sistema de simulados. Cada arquivo JSON de questões deve conter uma array de objetos, onde cada objeto representa uma única questão.

## Estrutura Base da Questão

Toda questão, independentemente do tipo, deve compartilhar a seguinte estrutura base:

```json
{
  "id": "Q-101",
  "type": "tipo_da_questao",
  "category": "Nome da Categoria (ex: Azure App Service)",
  "difficulty": "Fácil / Média / Difícil",
  "explanation": "A explicação detalhada que aparece após o usuário responder à questão.",
  "official_doc_link": "https://url_para_documentacao_oficial.com",
  "content": {
    "...": "..."
  },
  "correct_answer": []
}
```

- **`id`**: Um identificador único para a questão (string).
- **`type`**: O tipo da questão. Os valores válidos são: `multiple_choice`, `case_study`, `drag_and_drop`, `no_return_series`, `dropdown_fill_in_blank`.
- **`category`**: A categoria tecnológica a que a questão pertence.
- **`difficulty`**: O nível de dificuldade.
- **`explanation`**: O texto que será exibido para o aluno após a resposta, explicando a lógica da resposta correta.
- **`official_doc_link`**: (Opcional) Um link para a documentação oficial da Microsoft sobre o assunto.
- **`content`**: Um objeto que contém os textos e elementos específicos da questão. A estrutura deste objeto varia conforme o `type`.
- **`correct_answer`**: Uma array contendo o(s) `id`(s) da(s) resposta(s) correta(s).

---

## Tipos de Questão

### 1. Múltipla Escolha (`multiple_choice`)

Questões de múltipla escolha, que podem ter uma ou várias respostas corretas.

- **Seleção Única:** Se a array `correct_answer` contiver apenas um elemento, as opções serão renderizadas como `radio buttons`.
- **Seleção Múltipla:** Se `correct_answer` contiver mais de um elemento, as opções serão renderizadas como `checkboxes` e o sistema informará quantas opções devem ser selecionadas.

**Estrutura do `content`:**
- `statement`: A pergunta principal.
- `options`: Uma array de objetos, onde cada objeto é uma opção de resposta com `id` e `text`.

**Exemplo:**
```json
{
  "id": "Q-MC-01",
  "type": "multiple_choice",
  "category": "Azure App Service",
  "difficulty": "Média",
  "explanation": "O slot de produção é o padrão e não pode ser excluído.",
  "content": {
    "statement": "Qual slot de implantação não pode ser excluído em um Azure App Service?",
    "options": [
      { "id": "A", "text": "Staging" },
      { "id": "B", "text": "Production" },
      { "id": "C", "text": "Development" }
    ]
  },
  "correct_answer": ["B"]
}
```

### 2. Estudo de Caso (`case_study`)

Questões complexas que apresentam um cenário dividido em abas, seguido por uma pergunta de múltipla escolha.

**Estrutura do `content`:**
- `tabs`: Uma array de objetos, onde cada objeto representa uma aba com informações.
  - `id`: um identificador único para a aba (ex: `tab-req`).
  - `title`: O título que aparecerá no botão da aba (ex: `Requisitos`).
  - `content`: O texto (suporta HTML básico como quebras de linha `\n`) da aba.
- `statement`: A pergunta principal, relacionada ao estudo de caso.
- `options`: Idêntico ao tipo `multiple_choice`.

**Exemplo:**
```json
{
  "id": "Q-CS-01",
  "type": "case_study",
  "category": "Contoso Case Study",
  "difficulty": "Difícil",
  "explanation": "A explicação para a pergunta do estudo de caso.",
  "content": {
    "tabs": [
      {
        "id": "tab-overview",
        "title": "Visão Geral",
        "content": "A Contoso é uma empresa de varejo com presença global..."
      },
      {
        "id": "tab-reqs",
        "title": "Requisitos Técnicos",
        "content": "A nova aplicação web deve suportar autenticação via Microsoft Entra ID..."
      }
    ],
    "statement": "Com base nos requisitos, qual serviço é o mais indicado para a autenticação?",
    "options": [
      { "id": "A", "text": "Azure AD B2C" },
      { "id": "B", "text": "Microsoft Entra ID" }
    ]
  },
  "correct_answer": ["B"]
}
```

### 3. Arrastar e Soltar (`drag_and_drop`)

Questões onde o usuário precisa ordenar uma lista de itens na sequência correta.

**Estrutura do `content`:**
- `statement`: A instrução para a tarefa (ex: "Ordene os passos...").
- `items_to_drag`: Uma array de objetos, onde cada objeto é um item arrastável com `id` e `text`. A ordem dos itens nesta array não importa, pois eles serão embaralhados na tela.

**`correct_answer`**: Uma array de strings contendo os `id`s dos itens na **ordem correta**.

**Exemplo:**
```json
{
  "id": "Q-DND-01",
  "type": "drag_and_drop",
  "category": "Azure CLI / Docker",
  "difficulty": "Difícil",
  "explanation": "Primeiro você faz o login, depois tagueia a imagem e finalmente faz o push.",
  "content": {
    "statement": "Ordene os comandos para enviar uma imagem ao Azure Container Registry (ACR).",
    "items_to_drag": [
      { "id": "1", "text": "az acr login" },
      { "id": "2", "text": "docker push" },
      { "id": "3", "text": "docker tag" }
    ]
  },
  "correct_answer": ["1", "3", "2"]
}
```

### 4. Série Sem Retorno (`no_return_series`)

Um tipo especial de questão de múltipla escolha (apenas uma resposta correta) que apresenta um "Cenário" separado da pergunta. Uma vez respondida, o usuário não pode voltar atrás (a lógica de "não poder voltar" é controlada pelo fluxo geral do quiz).

**Estrutura do `content`:**
- `scenario`: O contexto ou cenário da questão.
- `statement`: A pergunta específica sobre o cenário.
- `options`: Idêntico ao tipo `multiple_choice`, mas sempre com apenas uma resposta correta.

**Exemplo:**
```json
{
  "id": "Q-NRS-01",
  "type": "no_return_series",
  "category": "Azure Functions",
  "difficulty": "Média",
  "explanation": "O gatilho HTTP é usado para iniciar uma função com uma requisição web.",
  "content": {
    "scenario": "Você está desenvolvendo uma API serverless para processar uploads de imagens.",
    "statement": "Qual tipo de gatilho (trigger) do Azure Functions é o mais adequado para iniciar o processamento quando uma nova imagem é enviada via POST request?",
    "options": [
      { "id": "A", "text": "Blob Trigger" },
      { "id": "B", "text": "HTTP Trigger" },
      { "id": "C", "text": "Queue Trigger" }
    ]
  },
  "correct_answer": ["B"]
}
```

### 5. Preencher Lacunas (`dropdown_fill_in_blank`)

Questões que apresentam um texto com lacunas que devem ser preenchidas pelo usuário selecionando opções em caixas de seleção (dropdowns).

**Estrutura do `content`:**
- `statement`: (Opcional) Uma introdução ou pergunta geral.
- `text`: O texto principal contendo as lacunas. Cada lacuna deve ser representada por `{{index}}`, onde `index` é um número inteiro começando em 0.
- `dropdowns`: Uma array de objetos, onde cada objeto define as opções para uma lacuna.
  - `index`: O número que corresponde à lacuna no `text`.
  - `options`: A array de opções para aquele dropdown específico.

**`correct_answer`**: Uma array de strings contendo os `id`s das opções corretas, na mesma ordem das lacunas (índice 0, 1, 2...).

**Exemplo:**
```json
{
  "id": "Q-DDFIB-01",
  "type": "dropdown_fill_in_blank",
  "category": "Azure Kubernetes Service",
  "difficulty": "Difícil",
  "explanation": "O comando `az aks get-credentials` é usado para configurar o kubectl.",
  "content": {
    "statement": "Complete o comando da Azure CLI para obter as credenciais de um cluster AKS.",
    "text": "az aks {{0}} --resource-group MyResourceGroup --name MyAKSCluster",
    "dropdowns": [
      {
        "index": 0,
        "options": [
          { "id": "A", "text": "get-credentials" },
          { "id": "B", "text": "show" },
          { "id": "C", "text": "browse" }
        ]
      }
    ]
  },
  "correct_answer": ["A"]
}
```
