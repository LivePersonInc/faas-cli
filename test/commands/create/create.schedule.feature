Feature: Create Schedule Command

  Scenario: Run the create:schedule command logged in
    Given I am authenticated
    When I run the create:schedule command with lpf create:schedule
    Then It should prompt me a list of deployed functions from which to schedule
    Then It should prompt me to input a cron expression
    Then It should display that the schedule was created

  Scenario: Run the create:schedule command not logged in
    Given I am not authenticated
    Then It should prompt me a list of deployed functions from which to schedule
    Then It should prompt me to input a cron expression
    Then It should have created schedule after logging in

  Scenario: Run the create:schedule command with create:schedule -n deployedFunction -c "* * * * *"
    Given I am authenticated
    Then It should display that the schedule was created

  Scenario: Run the create:schedule command with create:schedule -n notDeployedFunction -c "* * * * *"
    Given I am authenticated
    Then I try to create an schedule undeployed function with create:schedule -n notDeployedFunction -c "* * * * *"
    Then It should display that it failed to create the schedule
    Then It should prompt me a list of deployed functions from which to schedule
    Then It should display that the schedule was created

  Scenario: Run the create:schedule command with create:schedule -n dep... and an unforseen error occurs
    Given I am authenticated
    Then I try to create an schedule with create:schedule -n deployedFunction -c "* * * * *" and receive unexpected error

