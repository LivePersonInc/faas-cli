Feature: Undeploy Command

  Scenario: Run the undeploy command (with passed function names)
    Given I have a valid token
    Given I have a function available on the LivePerson Functions platform
    When I run the undeploy command and pass a function name
    Then I will be asked if I want to approve the undeployment and I approve it
    And The undeployment process will start and will indicate if it's finished

  Scenario: Run the undeploy command (with passed function names), don't want to watch the process and approve all with the yes flag
    Given I have a valid token
    Given I have a function available on the LivePerson Functions platform
    When I run the undeploy command, pass a function name and the --no-watch and yes flag
    Then Nothing should be displayed

  Scenario: Run the undeploy command (from the functions folder) and approve all with the yes flag
    Given I have a valid token
    Given I have a function available on the LivePerson Functions platform
    When I run the undeploy command from inside the function folder and pass the the yes flag
    Then The undeployment process will start and will indicate if it's finished

  Scenario: It should throw an error if I run the undeploy command with a function which is not on my logged in account
    Given I have a valid token
    Given This function is not available on the logged in account on the platform
    When I run the undeploy command and pass this function
    Then It should throw an error and tell me that this function is not available on the platform

  Scenario: It should skip the undeployment if I decline the confirmation
    Given I have a valid token
    Given I have a function available on the LivePerson Functions platform
    When I run the undeploy command, pass a functions folder name and decline the confirmation
    Then Nothing should be displayed
    And No function should be undeployed
