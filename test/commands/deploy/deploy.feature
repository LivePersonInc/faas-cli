Feature: Deploy Command

  Scenario: Run the deploy command (with passed function names)
    Given I have a valid token
    Given I have a function available on the LivePerson Functions platform
    When I run the deploy command and pass a functions folder name
    Then I will be asked if I want to approve the deployment and I approve it
    And The deployment process will start and will indicate if it's finished

  Scenario: Run the deploy command (with passed function names), don't want to watch the process and approve all with the yes flag
    Given I have a valid token
    Given I have a function available on the LivePerson Functions platform
    When I run the deploy command, pass a functions folder name and the --no-watch and yes flag
    Then Nothing should be displayed

  Scenario: Run the deploy command (from the function names) and approve all with the yes flag
    Given I have a valid token
    Given I have a function available on the LivePerson Functions platform
    When I run the deploy command from inside the function folder and pass the the yes flag
    And The deployment process will start and will indicate if it's finished

  Scenario: It should throw an error if I run the deploy command with a function which is not on my logged in account
    Given I have a valid token
    Given This function is not available on the logged in account on the platform
    When I run the deploy command and pass this function
    Then It should throw an error and tell me that this function is not available on the platform

  Scenario: It should skip a deployment if the function is currently under deployment
    Given I have a valid token
    Given A function is already under deployment
    When I run the deploy command and pass the same function again
    Then It should show me that the functions is still deploying

  Scenario: It should skip the deployment if I decline the confirmation
    Given I have a valid token
    Given I have a function available on the LivePerson Functions platform
    When I run the deploy command, pass a functions folder name and decline the confirmation
    Then Nothing should be displayed
    And No function should be deployed
