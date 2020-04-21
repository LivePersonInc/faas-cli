Feature: Init Command

  Scenario: Run the init command
    When I run the init command with lpf init
    Then It should print a success message
    And A folder with the appropirate files should be created on the root directory

  Scenario: Run the init command with name flag
    When I run the init command with lpf init "--name" "functionWithName"
    Then It should print a success message
    And A folder with the appropirate files and function name should be created on the root directory

  Scenario: Show an error message when something goes wrong during the execution
    When I run the init command with lpf init and an error occurs
    Then An error message should be displayed
