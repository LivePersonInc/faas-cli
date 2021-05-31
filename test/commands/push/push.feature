Feature: Push Command
# 1.1 Pushing a single function successfully
#   Different test cases according to flags set

  # !noWatch && !yes
  Scenario: Pushing a single lambda without a description
   Given I am authorized
    When I run the push command for a lambda without a description
    Then I expect an error message

  # !noWatch && !yes
  Scenario: Initiating Push of a function without confirming it
   Given I am authorized
    When I run the push command for a function and do not confirm the push
    Then I expect nothing to happen

  # !noWatch && !yes
  Scenario: Pushing a single function successfully
    Given I am located in the respective function folder
    Given I am authorized
    When I run the push command
    Then I see the confirmation prompt and confirm
    And I expect to see a progress indicator
    And I expect a success message

  # noWatch && yes
  Scenario: Pushing a single function successfully with no-watch and yes flag
    Given I am located in the respective function folder
    Given I am authorized
    When I run the push command
    When The no-watch flag is set
    When the yes flag is set
    Then I expect no output on the cli

# 1.2 Updating a single function successfully
#   Different test cases according to flags set

  # !noWatch && !yes
  Scenario: Updating a single function successfully
    Given I am located in the respective function folder
    Given I am authorized
    Given an earlier version of my function already is available on the faas platform
    When I run the push command
    Then I see the confirmation prompt and confirm
    And I expect to see a progress indicator
    And I expect a success message

# 1.2 Updating a single function unsuccessfully due to no changes

  # !noWatch && !yes
  Scenario: Updating a single function unsuccessfully due to no changes
    Given I am located in the respective function folder
    Given I am authorized
    Given the same version of my function already is available on the faas platform
    When I run the push command
    Then I see the confirmation prompt and confirm
    And I expect to see a progress indicator
    And I expect a skip message

# 2.1 Pushing multiple lambdas successfully
#   Different test cases according to flags set

  # !noWatch && !yes
  Scenario: Pushing multiple lambdas successfully
    Given I am authorized
    When I run the push command naming multiple folders/lambdas
    When I see the confirmation prompts and confirm
    Then I expect to see a progress indicator
    And I expect a success message

# 2.2 Pushing multiple lambdas with one failing
#   Different test cases according to flags set

  # !noWatch && !yes
  Scenario: Pushing multiple lambdas with one failing
    Given I am authorized
    When I run the push command naming multiple folders/lambdas
    When I see the confirmation prompts and confirm
    Then I expect to see a progress indicator
    And I expect an error message for the failing lambda
    And I expect the other lambdas to succeed

# 3.1 Pushing all lambdas successfully
#   Different test cases according to flags set

  # !noWatch && !yes
  Scenario: Pushing all lambdas successfully
    Given I am authorized
    When I run the push command with 'all' flag set
    When I see the confirmation prompts and confirm
    Then I expect to see a progress indicator
    And I expect a success message

# 3.2 Pushing all lambdas with one failing
#   Different test cases according to flags set

  # !noWatch && !yes
  Scenario: Pushing all lambdas with one failing
    Given I am authorized
    When I run the push command with 'all' flag set
    When I see the confirmation prompt and confirm
    Then I expect to see a progress indicator
    And I expect an error message for the failing lambda
    And I expect the other lambdas to succeed

  Scenario: Pushing all lambdas with all failing
    Given I am authorized
    When I call the push command and all lambdas are failing
    Then I expect an error message
