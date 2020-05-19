Feature: Invoke Command

  Scenario: Invoke a function remote
    Given I have done the local init
    Given I'm logged in
    Given The function is created on the platform and I have the same local with a config.json
    When I run the invoke command and pass the function name
    Then It should invoke the function and print the logs to the console

  Scenario: Invoke a function remote with no function created on the platform
    Given I have done the local init
    Given The function is not created on the platform
    When I run the invoke command and pass the function name
    Then It should print in error message which tells me that the function is not created on the platform

  Scenario: Invoke a function local
    Given I have done the local init
    Given I have a local function with the config.json
    When I run the invoke command and pass the function name and local flag
    Then It should set the passed env variables
    Then It invokes the command local and print the logs to the console

  Scenario: Invoke a function local with an console.error in it
    Given I have done the local init
    Given I have a local function with the config.json (console.error implemented)
    When I run the invoke command and pass the function name and local flag
    Then It invokes the command local and print the logs with error to the console

  Scenario: Invoke a function local which throws an error during invocation
    Given I have done the local init
    Given I have a local function with the config.json (throw error implemented)
    When I run the invoke command and pass the function name and local flag
    Then It invokes the command local and print the logs with error to the console

  Scenario: Invoke a function local which has an incorrect error format
    Given I have done the local init
    Given I have a local function with the config.json (incorrect error format implemented)
    When I run the invoke command and pass the function name and local flag
    Then It invokes the command local and print the logs with error to the console

  Scenario: Invoke a function local with a runtime longer than 60 seconds
    Given I have done the local init
    Given I have a local function with the config.json (runtime is longer than 60 seconds)
    When I run the invoke command and pass the function name and local flag
    Then It invokes the command local and print an error that the functions runs longer than 60 seconds


