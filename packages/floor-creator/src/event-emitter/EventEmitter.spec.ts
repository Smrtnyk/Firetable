import { EventEmitter } from "./EventEmitter.js";
import { describe, it, expect, vi } from "vitest";

type TestEvents = {
    eventA: [string];
    eventB: [number, string];
};

describe("EventEmitter", () => {
    it("adds listeners and trigger them on emit", () => {
        const emitter = new EventEmitter<TestEvents>();

        const listenerA = vi.fn();
        emitter.on("eventA", listenerA);

        emitter.emit("eventA", "test");

        expect(listenerA).toHaveBeenCalledTimes(1);
        expect(listenerA).toHaveBeenCalledWith("test");
    });

    it("allows multiple listeners and call them in order", () => {
        const emitter = new EventEmitter<TestEvents>();

        const listenerA = vi.fn();
        const listenerB = vi.fn();

        emitter.on("eventA", listenerA);
        emitter.on("eventA", listenerB);

        emitter.emit("eventA", "test");

        expect(listenerA).toHaveBeenCalledTimes(1);
        expect(listenerB).toHaveBeenCalledTimes(1);
        expect(listenerA).toHaveBeenCalledWith("test");
        expect(listenerB).toHaveBeenCalledWith("test");
    });

    it("removes listeners using the off method", () => {
        const emitter = new EventEmitter<TestEvents>();

        const listenerA = vi.fn();
        const listenerB = vi.fn();

        const removeListenerA = emitter.on("eventA", listenerA);
        emitter.on("eventA", listenerB);

        // Remove listenerA and ensure it's not called
        removeListenerA();
        emitter.emit("eventA", "test");

        expect(listenerA).not.toHaveBeenCalled();
        expect(listenerB).toHaveBeenCalledTimes(1);
    });

    it("removes listeners when off method is called", () => {
        const emitter = new EventEmitter<TestEvents>();

        const listener = vi.fn();

        emitter.on("eventA", listener);
        emitter.emit("eventA", "before remove");

        // Remove listener and emit again
        emitter.off("eventA", listener);
        emitter.emit("eventA", "after remove");

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith("before remove");
    });

    it("handles events with multiple arguments", () => {
        const emitter = new EventEmitter<TestEvents>();

        const listener = vi.fn();

        emitter.on("eventB", listener);

        emitter.emit("eventB", 123, "test");
        expect(listener).toHaveBeenCalledWith(123, "test");
    });

    it("doesn't break when no listeners exist", () => {
        const emitter = new EventEmitter<TestEvents>();

        // Emit an event without any listeners attached
        expect(() => {
            emitter.emit("eventA", "test");
        }).not.toThrow();
    });
});
