@login
Feature: Login de Usuários na API ServeRest
  Como um usuário da API
  Quero fazer login e gerenciar meu acesso
  Para que eu possa acessar recursos protegidos e realizar operações autorizadas

  Scenario: Fazer login com sucesso
    Given que eu tenho um usuário válido com e-mail e senha
    When eu enviar uma requisição de login com as credenciais corretas
    Then o código de status da resposta deve ser 200
    And a resposta deve conter um token de autenticação

  Scenario: Tentar fazer login com senha incorreta
    Given que eu tenho um usuário cadastrado no sistema
    When eu enviar uma requisição de login com uma senha incorreta
    Then o código de status da resposta deve ser 401
    And a mensagem de erro de login deve ser "Email e/ou senha inválidos"

  Scenario: Tentar fazer login com e-mail não cadastrado
    Given que eu informo um e-mail que não existe na base
    When eu enviar uma requisição de login com esse e-mail
    Then o código de status da resposta deve ser 401
    And a mensagem de erro de login deve ser "Email e/ou senha inválidos"

@validacao
  Scenario: Tentar fazer login com formato de e-mail inválido
    When eu enviar uma requisição de login com um e-mail em formato inválido "email_sem_arroba.com"
    Then o código de status da resposta deve ser 400
    And a mensagem de validação do e-mail deve ser "email deve ser um email válido"

  @seguranca
  Scenario: Realizar login com e-mail contendo letras maiúsculas (Case Sensitivity)
    Given que eu tenho um usuário cadastrado com o e-mail "teste_case@qa.com"
    When eu enviar uma requisição de login com o e-mail totalmente em maiúsculo
    Then o código de status da resposta deve ser 401
    And a mensagem de erro de login deve ser "Email e/ou senha inválidos"

  @integracao
  Scenario: Validar que o token gerado no login funciona em uma rota protegida
    Given que eu faço login com um usuário administrador válido
    When eu utilizo o token obtido para cadastrar um novo produto
    Then o código de status da resposta de produto deve ser 201