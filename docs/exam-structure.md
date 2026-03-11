# Blueprint do Simulado AZ-204 (Edição 2026)

---

## 1. Especificações Gerais do Motor da Prova
* **Total de Questões:** Entre 40 e 60 perguntas por sessão.
* **Formato Prático:** Zero laboratórios de digitação livre (sem escrita de código do zero).
* **Foco da Avaliação:** Leitura de cenários arquiteturais e resolução de problemas via interações visuais (cliques, seleções e ordenações).

---

## 2. Distribuição de Domínios Técnicos (Pesos)
| Domínio Oficial | Temas Abordados | Peso Estimado | Prioridade no Banco de Dados |
| :--- | :--- | :--- | :--- |
| **Computação** | App Services, Functions, ACR, ACI, ACA | 25% a 30% | Altíssima |
| **Integração** | Service Bus, Event Grid/Hubs, APIM, MS Graph | 20% a 25% | Alta |
| **Segurança** | Entra ID, MSAL, Key Vault, Managed Identities | 15% a 20% | Alta |
| **Armazenamento** | Cosmos DB, Blob Storage, SDKs | 15% a 20% | Média-Alta |
| **Monitoramento** | App Insights, Cache for Redis, Azure CDN | 5% a 10% | Média |

---

## 3. Tipos de Questões Suportadas
| Formato | Descrição do Comportamento no Frontend | Frequência Esperada |
| :--- | :--- | :--- |
| **Múltipla Escolha / Seleção** | Seleção de uma ou mais opções corretas para resolver um cenário. | Base principal |
| **Estudos de Caso** | Cenário longo detalhado (arquitetura/requisitos) atrelado a um bloco de 5 a 8 questões exclusivas. | 1 a 2 por prova |
| **Drag and Drop** | Ordenação cronológica de trechos de código, comandos CLI/PowerShell ou etapas de fluxo. | Comum |
| **Hotspot (Lacunas)** | Menus suspensos (dropdowns) para completar classes, propriedades ou valores em um trecho de código/SDK. | Comum |
| **Série Sim / Não** | Cenário estático com uma proposta de solução única. O usuário avalia se a solução atende ao objetivo. | Comum |

---

## 4. Regras de Negócio para o Algoritmo de Sorteio
* O script de geração do simulado deve puxar obrigatoriamente pelo menos um bloco de **Estudo de Caso**, agrupando as perguntas sob o mesmo contexto sem misturá-las com o resto da prova.
* A maior parte das questões avulsas deve ser direcionada para **Computação** e **Integração**, garantindo a presença de validação de código e comandos de terminal (Hotspot e Drag and Drop).