export type EventEmitterListener<Args extends any[] = any[]> = (...args: Args) => void;

export class EventEmitter<Events extends Record<string, any[]>> {
    private listeners: Map<keyof Events, EventEmitterListener<Events[keyof Events]>[]> = new Map();

    public on<K extends keyof Events>(
        event: K,
        listener: EventEmitterListener<Events[K]>,
    ): () => void {
        const currentListeners = this.listeners.get(event) || [];
        currentListeners.push(listener as any);
        this.listeners.set(event, currentListeners);
        return () => this.off(event, listener);
    }

    public off<K extends keyof Events>(event: K, listener: EventEmitterListener<Events[K]>): void {
        const currentListeners = this.listeners.get(event) || [];
        this.listeners.set(
            event,
            currentListeners.filter((l) => l !== listener),
        );
    }

    public emit<K extends keyof Events>(event: K, ...args: Events[K]): void {
        const currentListeners = this.listeners.get(event) || [];
        currentListeners.forEach((listener) => listener(...args));
    }
}
