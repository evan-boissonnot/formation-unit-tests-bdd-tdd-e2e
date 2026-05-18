import {expect, test, vi} from 'vitest';
import {Radio} from '../models/radio';
import type { Logger } from '../../../../chore/tools/logger';
import { Sound } from '../models/sound';

test('Radio should ring', () => {
    const logger: Logger = {
        log(message: string, type: 'info' | 'error' | 'warn'): void {
            expect(message).toBe('Playing sound: ringing');
        }
    }

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