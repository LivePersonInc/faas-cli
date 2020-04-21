Feature: Logout Command

  Scenario: Run the logout command
    Given I have an accountId saved
    When I run the logout command and select my desired accountId
    Then The token of the selected accoundId is set to null
    And I see a success message

  Scenario: Run the logout command with the accoundId flag
    Given I have an accountId saved
    When I run the logout command and pass an accoundId as flag
    Then The token of the selected accoundId is set to null
    And I see a success message

  Scenario: Run the logout command with the delete flag
    Given I have an accountId saved
    When I run the logout command with the delete flag and select my desired accountId
    Then The selected account is deleted from the temp file
    And I see a success message

  Scenario: Run the logout command with the delete flag and delete all accounts
    Given I have an accountId saved
    When I run the logout command with the delete flag and delete all accounts
    Then All accounts are deleted
    Then The temp file is deleted
    And I see a success message

  Scenario: Run the logout command without having a temp file
    Given I have no account saved
    When I run the logout command
    Then I see a warn message that no account were found
