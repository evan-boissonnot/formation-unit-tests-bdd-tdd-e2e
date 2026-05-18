export interface Logger {
    log(message: string, type: 'info' | 'error' | 'warn'): void;
}

export class ConsoleLogger implements Logger {
    log(message: string, type: 'info' | 'error' | 'warn'): void {
        switch (type) {
            case 'info':    
                console.info(`INFO: ${message}`);
                break;
            case 'error':
                console.error(`ERROR: ${message}`);
                break;
        }
    }
}

export const logger = new ConsoleLogger();