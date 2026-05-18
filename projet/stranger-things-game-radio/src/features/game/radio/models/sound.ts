import type { Logger } from "../../../../chore/tools/logger";

export class Sound {
    private readonly logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    name = 'default';

    play(): void {
        this.logger.log(`Playing sound: ${this.name}`, 'info');
    }
}