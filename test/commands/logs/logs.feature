Feature: Logs Command

  Scenario: Get logs of a function with function name and only start timestamp as flag provided
    Given I have done the local init
    Given I'm logged in
    When I run the logs command and pass the function name and a start timestamp
    Then It should call getLogs with the uuid of the function and the provided start timestamp

  Scenario: Get logs of a function with function name and all flags provided
    Given I have done the local init
    Given I'm logged in
    When I run the logs command and pass the function name and all flags
    Then It should call getLogs with the uuid of the function and all provided flags

  Scenario: Get logs of a function returning an error on the API should return error
    Given I have done the local init
    Given I'm logged in
    When I run the logs command
    Then It should display an error
