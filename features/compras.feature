@compras
Feature: Fluxo de Autenticação, Produtos e Carrinho na ServeRest
  Como um cliente da loja
  Quero gerenciar produtos e o carrinho de compras
  Para validar o fluxo completo de transação

  Scenario: Realizar login com sucesso para obter token
    Given que eu tenho credenciais de um usuário administrador válido
    When eu envio uma requisição para a rota de login
    Then o código de status da resposta de login deve ser 200
    And o token de autenticação deve ser retornado

  Scenario: Cadastrar um novo produto com sucesso
    Given que eu estou autenticado como administrador
    And que eu tenho os dados de um novo produto
    When eu envio uma requisição para cadastrar o produto
    Then o código de status da resposta de produto deve ser 201
    And a mensagem de produto deve ser "Cadastro realizado com sucesso"
    And o produto cadastrado deve ser recuperável com os dados enviados

  Scenario: Impedir cadastro de produto sem autenticação
    Given que eu tenho os dados de um novo produto
    When eu tento cadastrar um produto sem autenticação
    Then o código de status da resposta de produto deve ser 401
    And a resposta deve indicar que a operação não foi autorizada

  Scenario: Realizar o fluxo completo do carrinho de compras
    Given que eu estou autenticado como administrador e possuo um produto cadastrado
    When eu adiciono o produto ao carrinho
    Then o código de status da criação do carrinho deve ser 201
    And eu consigo listar os carrinhos cadastrados
    And eu consigo deletar o carrinho concluindo a compra
    And o carrinho não deve mais estar listado
    Then o estoque do produto deve ser atualizado depois da compra

  Scenario: Cancelar a compra de um carrinho e reabastecer o estoque
    Given que eu estou autenticado como administrador e possuo um produto cadastrado com estoque inicial
    When eu adiciono o produto ao carrinho
    And eu envio uma requisição para cancelar a compra do carrinho
    Then o código de status do cancelamento deve ser 200
    And a mensagem de cancelamento do carrinho deve ser "Registro excluído com sucesso. Estoque dos produtos reabastecido"
    And o carrinho não deve mais estar listado
    Then o estoque do produto deve permanecer inalterado após o cancelamento

  Scenario: Rejeitar produto inexistente no carrinho
    Given que eu estou autenticado como administrador e possuo um produto cadastrado com estoque inicial
    When eu tento adicionar um produto inexistente ao carrinho
    Then a resposta deve indicar que o produto não foi encontrado
    And o estoque do produto deve continuar inalterado

  Scenario: Rejeitar quantidade superior ao estoque
    Given que eu estou autenticado como administrador e possuo um produto cadastrado com estoque inicial
    When eu tento adicionar uma quantidade maior que o estoque ao carrinho
    Then a resposta deve indicar que o estoque é insuficiente
    And o estoque do produto deve continuar inalterado

  Scenario: Rejeitar quantidade zero no carrinho
    Given que eu estou autenticado como administrador e possuo um produto cadastrado com estoque inicial
    When eu tento adicionar uma quantidade zero ao carrinho
    Then a quantidade do carrinho deve ser rejeitada pela validação
    And o estoque do produto deve continuar inalterado
