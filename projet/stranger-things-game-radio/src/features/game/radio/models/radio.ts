import type { Logger } from "../../../../chore/tools/logger";
import { Sound } from "./sound";

export class Radio {
    private readonly logger: Logger;
    
        constructor(logger: Logger) {
            this.logger = logger;
        }
    

    ring(): Sound {
        const sound = new Sound(this.logger);

        sound.name = 'ringing';
        sound.play();

        return sound;
    }
}