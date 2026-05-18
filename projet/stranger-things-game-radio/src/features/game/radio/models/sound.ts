import type { Logger } from "../../../../chore/tools/logger";

export class Sound {
    private readonly logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    #name = 'default';

    get name(): string {
        return this.#name;
    }

    play(soundName: string): void {
        this.#name = soundName;
        this.logger.log(`Playing sound: ${soundName}`, 'info');
    }
}