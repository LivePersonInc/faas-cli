Feature: Feature name

  Scenario: Run the debug command with provided function
    Given I have a function locally
    When I run the debug command and pass this function
    Then A debugger should run with the passed function

  Scenario: Run the debug command with no provided function
    Given I have no function locally
    When I run the debug command and pass no function
    Then An error message should tell me that there is no function
