Feature: Metrics Command

  Scenario: Get metrics of a function with function name and only lasting period provided
    Given I'm logged in
    When I run the metrics command and pass the function name and a 1h period
    Then It should call getMetrics
    Then It should display metrics

  Scenario: Get an error if lasting period flag incomplete
    Given I'm logged in
    When I run the metrics command and pass the function name and a 1 period
    Then It should throw an error that this is an incomplete period flag


  Scenario: Get metrics of a function with function with start and end provided
    Given I'm logged in
    When I run the metrics command and pass the function name and a start timestamp and an end timestamp
    Then It should call getMetrics
    Then It should display metrics

  Scenario: Get an error with start and end provided in a period of <15m
    Given I'm logged in
    When I run the metrics command and pass the function name and a start timestamp and an end timestamp
    Then It should throw an error that the minimum period is >15m

  Scenario: Get an error with a start timestamp that is after the end timestamp
    Given I'm logged in
    When I run the metrics command and pass the function name and a start timestamp and an end timestamp
    Then It should throw an error that start should come before end timestamp chronologically

  Scenario: Get an error with start and end provided in a period of >30d
    Given I'm logged in
    When I run the metrics command and pass the function name and a start timestamp and an end timestamp
    Then It should throw an error that the maximum period is <30d

  Scenario: Get an error when neither end nor last flag was defined
    Given I'm logged in
    When I run the metrics command and pass only the function name
    Then It should throw an error to either define end or last flag

  Scenario: Get an error when start or end flag is not a valid timestamp
    Given I'm logged in
    When I run the metrics command and pass the function name and an invalid timestamp
    Then It should throw an error for invalid timestamp

  Scenario: Get CSV when the output is selected as CSV
    Given I'm logged in
    When I run the metrics command and pass the function name and csv as output flag
    Then It should print out the data as csv

  Scenario: Get JSON when the output is selected as JSON
    Given I'm logged in
    When I run the metrics command and pass the function name and json as output flag
    Then It should print out the data as json


