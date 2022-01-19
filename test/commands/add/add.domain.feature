Feature: Add Domain Command

  Scenario: Run the add:domain command not logged in
    Given I am not authenticated
    When I run the add:domain command with lpf add:domain "*.liveperson.com" sample.co.uk
    Then It should tell me to login
    Then It should tell me that the domains have been added to the account

  Scenario: Run the add:domain with no parameters
    Given I am authenticated
    When I run the add:domain command with lpf add:domain
    Then It should tell me to add domains

  Scenario: Run the add:domain with malformed url
    Given I am authenticated
    When I run the add:domain command with lpf add:domain "¶¢["
    Then It should tell me to change the url