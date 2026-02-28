1. Múltipla Escolha Simples e Composta
Este é o formato tradicional, mas com variações de rigor:

Single Choice: Uma única resposta correta entre quatro ou cinco opções.

Multiple Response: O enunciado especifica: "Selecione duas opções" ou "Cada resposta correta faz parte da solução".

Interatividade: Botões de rádio ou checkboxes simples.

Desafio de Desenvolvimento: Criar um algoritmo que valide se o usuário selecionou o número exato de opções exigidas.

2. Arrastar e Soltar (Drag and Drop)
Muito comum para testar sequenciamento de implementação (ex: passos para configurar um Azure Key Vault ou um deploy via Azure CLI).

Mecânica: Duas colunas. À esquerda, uma lista de ações desordenadas; à direita, uma área vazia para o usuário arrastar as ações na ordem correta.

Interatividade: Requer uma biblioteca de drag-and-drop (como React Beautiful DND ou SortableJS). É necessário validar tanto a seleção das ações quanto a ordem delas.

3. Listas Drop-down (Hot Area / Case Study)
Geralmente inseridas dentro de um bloco de código ou uma explicação de arquitetura.

Mecânica: O usuário lê um trecho de código (C# ou Python) ou um comando de terminal com lacunas. Ao clicar na lacuna, um menu suspenso aparece com opções de métodos, propriedades ou parâmetros.

Interatividade: Componentes de <select> customizados que se integram visualmente ao bloco de código.

4. Estudos de Caso (Case Studies)
Este é o formato mais complexo da prova.

Mecânica: O usuário recebe várias abas (Business Requirements, Technical Requirements, Security, Current Environment). Após ler tudo, ele deve responder a uma série de questões baseadas nesse cenário.

Restrição Crítica: Uma vez que o usuário encerra o Estudo de Caso e avança para a próxima seção, ele não pode voltar para revisar essas questões.

Interatividade: Navegação por abas (tabs) e um sistema de bloqueio de navegação retroativa.

5. Questões de "Sim/Não" Sem Retorno
Aparecem em blocos de 3 a 4 questões que descrevem o mesmo cenário com soluções diferentes.

Mecânica: "Cenário X. Solução Y. Isso atende ao objetivo?".

Restrição: Você não pode voltar para a questão anterior após responder. Isso impede que o usuário descubra a resposta correta na questão 2 e tente corrigir a 1.

Interatividade: Modais de confirmação ou desabilitação do botão "Back".

6. Hot Area (Seleção em Imagem)
Menos frequente na AZ-204 que na AZ-900, mas pode aparecer em diagramas de arquitetura.

Mecânica: Uma imagem de um portal Azure ou um diagrama. O usuário deve clicar na área específica (ex: qual botão no portal configura o CORS).

Interatividade: Mapeamento de coordenadas de clique sobre uma imagem estática.