import {expect, test, vi} from 'vitest';
import {Radio} from '../models/radio';
import type { Logger } from '../../../../chore/tools/logger';
import { Sound } from '../models/sound';
import * as fc from 'fast-check';

const logger: Logger = {
        log(message: string, type: 'info' | 'error' | 'warn'): void {
            
        }
    }

test('Radio should turn to a station', () => {
    const radio = new Radio(logger);
    const spy = vi.spyOn(logger, 'log');

    fc.assert(
        fc.property(fc.integer({min: -10, max: 110}), (station) => {
            radio.turn(station);
        })
    )
});

test('Sound should play', () => {
    const sound = new Sound(logger);

    fc.assert(
        fc.property(fc.string(), (soundName) => {
            sound.play(soundName);
            expect(sound.name).toBe(soundName);
        }), { numRuns: 10, verbose: true, seed: 14785230 }
    );
});

test('Radio should ring', () => {
    

    // Stub
    // const logger = {
    //     log: vi.fn().mockClear()
    // }

    // Spy
    const spy = vi.spyOn(logger, 'log');

    const radio = new Radio(logger);
    
    const sound = radio.ring();

    expect(spy).toHaveBeenCalledWith('Playing sound: ringing', 'info');    
    expect(sound.name).toBe('ringing');
});