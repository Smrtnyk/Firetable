import type { Command } from "./Command.js";
import { CommandInvoker } from "./CommandInvoker.js";
import { expect, it, describe, beforeEach, vi } from "vitest";

class MockCommand {
    execute = vi.fn();
    undo = vi.fn();
}

describe("CommandInvoker", () => {
    let invoker: CommandInvoker;
    let mockCommand: Command;

    beforeEach(() => {
        invoker = new CommandInvoker();
        mockCommand = new MockCommand();
    });

    it("executes command and push it to undo stack", () => {
        invoker.execute(mockCommand);
        expect(mockCommand.execute).toHaveBeenCalled();
        expect(invoker.canUndo()).toBeTruthy();
        expect(invoker.canRedo()).toBeFalsy();
    });

    it("undos command and push it to redo stack", () => {
        invoker.execute(mockCommand);
        invoker.undo();
        expect(mockCommand.undo).toHaveBeenCalled();
        expect(invoker.canUndo()).toBeFalsy();
        expect(invoker.canRedo()).toBeTruthy();
    });

    it("redos command and push it back to undo stack", () => {
        invoker.execute(mockCommand);
        invoker.undo();
        invoker.redo();
        // Once during initial execute, once during redo
        expect(mockCommand.execute).toHaveBeenCalledTimes(2);
        expect(invoker.canUndo()).toBeTruthy();
        expect(invoker.canRedo()).toBeFalsy();
    });

    it("emits events correctly", () => {
        const listener = vi.fn();
        invoker.on("change", listener);
        invoker.execute(mockCommand);
        invoker.undo();
        invoker.redo();
        // Once for each operation
        expect(listener).toHaveBeenCalledTimes(3);
    });

    it("unregisters listeners", () => {
        const listener = vi.fn();
        const unregister = invoker.on("change", listener);
        unregister();
        invoker.execute(mockCommand);
        expect(listener).not.toHaveBeenCalled();
    });

    it("handles undo with empty undo stack gracefully", () => {
        invoker.undo();
        expect(mockCommand.undo).not.toHaveBeenCalled();
        expect(invoker.canRedo()).toBeFalsy();
    });

    it("handles redo with empty redo stack gracefully", () => {
        invoker.redo();
        expect(mockCommand.execute).not.toHaveBeenCalled();
        expect(invoker.canUndo()).toBeFalsy();
    });

    it("handles multiple commands correctly", () => {
        const anotherMockCommand = new MockCommand();

        invoker.execute(mockCommand);
        invoker.execute(anotherMockCommand);
        // undo anotherMockCommand
        invoker.undo();
        expect(anotherMockCommand.undo).toHaveBeenCalled();
        // redo anotherMockCommand
        invoker.redo();
        expect(anotherMockCommand.execute).toHaveBeenCalled();
        // undo anotherMockCommand
        invoker.undo();
        // undo mockCommand
        invoker.undo();
        expect(mockCommand.undo).toHaveBeenCalled();
    });

    it("calls multiple listeners for the same event", () => {
        const listener1 = vi.fn();
        const listener2 = vi.fn();

        invoker.on("change", listener1);
        invoker.on("change", listener2);

        invoker.execute(mockCommand);

        expect(listener1).toHaveBeenCalled();
        expect(listener2).toHaveBeenCalled();
    });

    it("correctly reports canUndo and canRedo after multiple operations", () => {
        invoker.execute(mockCommand);
        expect(invoker.canUndo()).toBeTruthy();
        expect(invoker.canRedo()).toBeFalsy();

        invoker.undo();
        expect(invoker.canUndo()).toBeFalsy();
        expect(invoker.canRedo()).toBeTruthy();

        invoker.redo();
        expect(invoker.canUndo()).toBeTruthy();
        expect(invoker.canRedo()).toBeFalsy();
    });

    it("clears both undo and redo stacks", () => {
        invoker.execute(mockCommand);
        invoker.undo();
        invoker.clear();
        expect(invoker.canUndo()).toBeFalsy();
        expect(invoker.canRedo()).toBeFalsy();
    });

    it("clears redo stack after executing a new command post undo", () => {
        invoker.execute(mockCommand);
        invoker.undo();
        invoker.execute(new MockCommand());
        expect(invoker.canRedo()).toBeFalsy();
    });

    it("maintains the correct order of commands in stacks", () => {
        const anotherMockCommand = new MockCommand();
        invoker.execute(mockCommand);
        invoker.execute(anotherMockCommand);
        invoker.undo();
        invoker.undo();
        expect(mockCommand.undo).toHaveBeenCalled();
        expect(anotherMockCommand.undo).toHaveBeenCalled();
        invoker.redo();
        invoker.redo();
        expect(mockCommand.execute).toHaveBeenCalledTimes(2);
        expect(anotherMockCommand.execute).toHaveBeenCalledTimes(2);
    });

    it("calls the same listener multiple times if registered multiple times", () => {
        const listener = vi.fn();
        invoker.on("change", listener);
        invoker.on("change", listener);
        invoker.execute(mockCommand);
        expect(listener).toHaveBeenCalledTimes(2);
    });

    it("ensures listeners are only unregistered once", () => {
        const listener = vi.fn();
        const unregister = invoker.on("change", listener);
        unregister();
        // Call unregister multiple times
        unregister();
        invoker.execute(mockCommand);
        expect(listener).not.toHaveBeenCalled();
    });

    it("calls listeners in the order they were registered", () => {
        const order: number[] = [];
        const listener1 = vi.fn(() => order.push(1));
        const listener2 = vi.fn(() => order.push(2));

        invoker.on("change", listener1);
        invoker.on("change", listener2);

        invoker.execute(mockCommand);
        expect(order).toEqual([1, 2]);
    });
});
