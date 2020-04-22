Feature: Pull Command
  Scenario: Pull a new function
  Given I am authorized
  When I run the pull command and pass a function name that is available on the platform
  When I see the confirmation prompt and confirm
  Then I expect the lambda to be available locally

  Scenario: Pull a new function without confirming
  Given I am authorized
  When I run the pull command and do not confirm
  Then I expect nothing to happen

  Scenario: Pull an existing function
  Given I am authorized
  Given I have a lambda available locally
  When I run the pull command and pass the function name that is available on the platform and locally
  When I see the confirmation prompt and confirm
  Then I expect a warning that the local lambda will be overwritten
  Then I expect the lambda to be available locally

  Scenario: Pull all functions
  Given I am authorized
  When I run the pull command with all/no-watch/confirm flag
  Then I expect a warning that the local lambdas will be overwritten
  Then I expect the lambdas to be available locally

  Scenario: Pull all functions with one failing
  Given I am authorized
  Given One lambda I want to pull causes an error
  When I run the pull command with all/no-watch/confirm flag
  Then I expect a warning that the local lambdas will be overwritten
  Then I expect an error message for the failing lambda
  Then I expect the other lambdas to be available locally
