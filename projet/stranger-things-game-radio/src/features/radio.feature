Feature: Radio
  Scenario: Play sound
    Given I am the player
    When I use the radio
    Then it should play the sound "ringing"