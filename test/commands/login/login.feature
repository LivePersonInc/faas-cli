Feature: Login Command

  Scenario: Run the login command for the first time
    Given I have no saved accountId
    When I run the login command and enter an accountId
    When I provide a valid password and username
    Then It should print the welcome message
    And Token, accoundId and username will be saved in the temp file

  Scenario: Run the login command after the first successful time and token is still valid
    Given I have an accountId set up
    Given Token is still valid
    When I run the login command and select an accountId
    Then It should print the welcome message

  Scenario: Run the login command after the first successful time and token is invalid
    Given I have an accountId set up
    Given Token is invalid
    When I run the login command and select an accountId
    When I provide a valid password and username
    Then It should print the welcome message
    And Token and username will be updated in the temp file

  Scenario: Run the login command with the password flag and token is invalid
    Given I have an accountId set up
    Given Token is invalid
    When I run the login command and select an accountId
    When I provide a valid username
    Then It should print the welcome message
    And Token and username will be updated in the temp file

  Scenario: Run the login command with the accountId, password and username flag and token is invalid
    Given I have an accountId set up
    Given Token is invalid
    When I run the login command
    Then It should print the welcome message
    And Token and username will be updated in the temp file

  Scenario: Run the login command with invalid credentials
    Given I have an accountId set up
    Given Token is invalid
    When I run the login command and select an accountId
    When I provide a wrong password and username
    Then It should print the error message and exit with code 1

  Scenario: Run the login command with SSO workflow
    Given I have fetched the token and userId following the instructions
    When I run the login command with the flags from the instructions
    Then It should print the welcome message
    And Token and username will be updated in the temp file
    And I run any desired command and it will perform the normal action
