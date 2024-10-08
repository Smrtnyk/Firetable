import { negate } from "es-toolkit";
import { matches } from "es-toolkit/compat";

export type EventEmitterListener<EventType extends unknown[] = unknown[]> = (
    ...args: EventType
) => void;

type EventMap = {
    [Event: string]: unknown[];
};

interface TypedEventEmitter<Events extends EventMap> {
    on<K extends keyof Events>(event: K, listener: EventEmitterListener<Events[K]>): void;
    off<K extends keyof Events>(event: K, listener: EventEmitterListener<Events[K]>): void;
    emit<K extends keyof Events>(event: K, ...args: Events[K]): void;
}

export class EventEmitter<Events extends EventMap> implements TypedEventEmitter<Events> {
    private readonly listeners: Map<keyof Events, EventEmitterListener[]> = new Map();

    public on<K extends keyof Events>(
        event: K,
        listener: EventEmitterListener<Events[K]>,
    ): () => void {
        const currentListeners = this.listeners.get(event) ?? [];
        currentListeners.push(listener as EventEmitterListener);
        this.listeners.set(event, currentListeners);

        // Return a function that removes the listener when called.
        return () => this.off(event, listener);
    }

    public off<K extends keyof Events>(event: K, listener: EventEmitterListener<Events[K]>): void {
        let currentListeners = this.listeners.get(event) ?? [];
        currentListeners = currentListeners.filter(negate(matches(listener)));
        this.listeners.set(event, currentListeners);
    }

    public emit<K extends keyof Events>(event: K, ...args: Events[K]): void {
        const currentListeners = this.listeners.get(event) ?? [];
        currentListeners.forEach(function (listener) {
            listener(...args);
        });
    }
}
