@regressao @usuarios
Feature: Gestão de Usuários na API ServeRest
  Como um administrador da API
  Quero cadastrar e gerenciar usuários
  Para controlar o acesso ao sistema

  @smoke @jornada-usuario
  Scenario: Cadastrar um novo usuário com sucesso
    Given que eu tenho os dados de um novo usuário
    When eu enviar uma requisição para cadastrar o usuário
    Then o código de status da resposta deve ser 201
    And a mensagem deve ser "Cadastro realizado com sucesso"
    And o usuário cadastrado deve ser recuperável com os dados enviados

  @validacao @negativo
  Scenario: Não permitir cadastrar usuário sem e-mail
    Given que eu tenho os dados de um novo usuário sem e-mail
    When eu enviar uma requisição para cadastrar o usuário
    Then o código de status da resposta deve ser 400
    And a mensagem deve ser "email é obrigatório"

  @validacao @negativo
  Scenario: Não permitir cadastrar usuário com o campo e-mail em branco
    Given que eu tenho os dados de um novo usuário com e-mail em branco
    When eu enviar uma requisição para cadastrar o usuário
    Then o código de status da resposta deve ser 400
    And a mensagem deve ser "email não pode ficar em branco"

  @validacao @negativo
  Scenario: Não permitir cadastrar usuário sem senha
    Given que eu tenho os dados de um novo usuário sem senha
    When eu enviar uma requisição para cadastrar o usuário
    Then o código de status da resposta deve ser 400
    And a mensagem deve ser "password é obrigatório"
  
  @validacao @negativo
  Scenario: Não permitir cadastrar usuário com o campo senha em branco
    Given que eu tenho os dados de um novo usuário com senha em branco
    When eu enviar uma requisição para cadastrar o usuário
    Then o código de status da resposta deve ser 400
    And a mensagem deve ser "password não pode ficar em branco"

  @validacao @regra-negocio
  Scenario: Não permitir cadastrar usuário com e-mail duplicado
    Given que existe um usuário previamente cadastrado
    When eu tentar cadastrar outro usuário com o mesmo e-mail
    Then o código de status da resposta deve ser 400
    And a mensagem deve ser "Este email já está sendo usado"

  @contrato
  Scenario: Listar todos os usuários cadastrados
    Given que existe um usuário para localizar na listagem
    When eu envio uma requisição para listar os usuários
    Then o código de status da resposta deve ser 200
    And a listagem deve retornar os usuários cadastrados

  @crud
  Scenario: Atualizar um usuário existente
    Given que eu tenho um usuário cadastrado para atualização
    When eu envio uma requisição para atualizar os dados desse usuário
    Then o código de status da resposta deve ser 200
    And a mensagem de atualização deve ser "Registro alterado com sucesso"
    And os dados do usuário devem refletir a atualização

  @bug @contrato
  Scenario: Tentar alterar um usuário que não existe registra um novo usuário
    Given que eu tenho os dados de um novo usuário
    And eu envio uma requisição para atualizar os dados desse usuário
    Then o código de status da resposta deve ser 201
    And a mensagem deve ser "Cadastro realizado com sucesso"

  @crud
  Scenario: Deletar um usuário existente
    Given que eu tenho um usuário cadastrado para exclusão
    When eu envio uma requisição para deletar esse usuário
    Then o código de status da resposta deve ser 200
    And a mensagem de exclusão deve ser "Registro excluído com sucesso"
    And o usuário excluído não deve mais ser encontrado

  @regra-negocio @integracao
  Scenario: Impedir exclusão de usuário com carrinho cadastrado
    Given que eu tenho um usuário com um carrinho cadastrado
    When eu envio uma requisição para deletar esse usuário
    Then o código de status da resposta deve ser 400
    And a mensagem de exclusão deve ser "Não é permitido excluir usuário com carrinho cadastrado"
    And o usuário deve permanecer cadastrado
    And o carrinho vinculado ao usuário deve permanecer cadastrado