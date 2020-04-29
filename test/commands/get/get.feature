Feature: Get Command

  Scenario: Run the Get command for all resources
    Given I am authorized
    When I run the get command with functions/deployments/account/events parameter
    Then It should display information about functions/deployments/account/events

  Scenario: Run the Get command for a non existing resource
    Given I am authorized
    When I run the get command with an incorrect parameter
    Then It should display an error

  Scenario: Run the Get command with no domain provided
    Given I am authorized
    When I run the get command with no domain provided
    Then It should display an error

  Scenario: Run the Get command for all resources for an account without lambdas
    Given I am authorized
    Given I have no lambdas in my account
    When I run the get command with functions/deployments/account/events parameter
    Then It should display an error
