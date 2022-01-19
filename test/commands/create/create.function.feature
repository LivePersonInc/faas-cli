Feature: Create Function Command

  Scenario: Run the create:function command not logged in
    Given I am not authenticated
    When I run the create:function command with lpf create:function
    Then It should prompt me to input the name of the function
    Then It should prompt me to input the description of the function
    Then It should prompt me to input the event ID of the function
    Then It should tell me the function was created
    Then A folder with the appropriate files should be created on the root directory

  Scenario: Run the create:function command logged in
    Given I am authenticated
    When I run the create:function command with lpf create:function
    Then It should prompt me to input the name of the function
    Then It should prompt me to input the description of the function
    Then It should prompt me to list of event IDs of the function
    Then It should tell me the function was created
    Then A folder with the appropriate files should be created on the root directory

  Scenario: Run the create:function and it throws an error
    Given I am not authenticated and a specific function already exists
    When I run the create:function command with lpf create:function -name ...
    Then An error message is displayed
    Then No additional files were created