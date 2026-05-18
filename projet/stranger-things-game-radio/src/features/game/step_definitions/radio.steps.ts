import {Given, When, Then} from '@cucumber/cucumber';
import { Radio } from '../radio/models/radio';
import { ConsoleLogger } from '../../../chore/tools/logger';
import type { Sound } from '../radio/models/sound';
import { expect } from 'chai';

const radio = new Radio(new ConsoleLogger());
let sound: Sound | undefined;

Given('I am the player', function () {

});

When('I use the radio', function () {
    sound = radio.ring();
});

Then('it should play the sound {string}', function (soundName: string) {
    sound?.play(soundName);
    expect(sound?.name).to.equal(soundName);
});