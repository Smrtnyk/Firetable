import type { FloorDoc } from "@firetable/types";
import type { App, Ref, ShallowRef } from "vue";

import { delay, noop } from "es-toolkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, ref, shallowRef } from "vue";

import { useFloorsPageEvent } from "./useFloorsPageEvent";

vi.mock("src/helpers/compress-floor-doc", () => ({
    decompressFloorDoc: vi.fn().mockImplementation((doc) => doc),
}));

export function withSetup(composable: () => ReturnType<typeof useFloorsPageEvent>): {
    app: App<Element>;
    result: ReturnType<typeof useFloorsPageEvent>;
} {
    let result: ReturnType<typeof useFloorsPageEvent>;
    const app = createApp({
        setup() {
            result = composable();
            return noop;
        },
    });
    app.mount(document.createElement("div"));
    // @ts-expect-error -- ignore this error
    return { app, result };
}

describe("useFloorsPageEvent", () => {
    let eventFloors: Ref<FloorDoc[]>;
    let pageRef: ShallowRef<HTMLDivElement | null>;

    beforeEach(() => {
        eventFloors = ref<FloorDoc[]>([]);
        pageRef = shallowRef(null);
    });

    it("initializes with default values", () => {
        const { result } = withSetup(() => useFloorsPageEvent(eventFloors, pageRef));

        expect(result.activeFloor.value).toBeUndefined();
        expect(result.floorInstances.value).toEqual([]);
        expect(result.hasMultipleFloorPlans.value).toBe(false);
    });

    it("computes hasMultipleFloorPlans correctly", () => {
        eventFloors.value = [{ id: "floor1" } as FloorDoc, { id: "floor2" } as FloorDoc];
        const { result } = withSetup(() => useFloorsPageEvent(eventFloors, pageRef));

        expect(result.hasMultipleFloorPlans.value).toBe(true);
    });

    it("sets active floor correctly", () => {
        const { result } = withSetup(() => useFloorsPageEvent(eventFloors, pageRef));

        result.setActiveFloor({ id: "floor1", name: "Floor 1" });
        expect(result.activeFloor.value).toEqual({ id: "floor1", name: "Floor 1" });
    });

    it("checks if a floor is active", () => {
        const { result } = withSetup(() => useFloorsPageEvent(eventFloors, pageRef));

        result.setActiveFloor({ id: "floor1", name: "Floor 1" });
        expect(result.isActiveFloor("floor1")).toBe(true);
        expect(result.isActiveFloor("floor2")).toBe(false);
    });

    it("instantiates floor instances when eventFloors change", async () => {
        const { result } = withSetup(() => useFloorsPageEvent(eventFloors, pageRef));

        // Create a div to simulate the pageRef
        const pageDiv = document.createElement("div");
        pageDiv.style.width = "800px";
        document.body.appendChild(pageDiv);
        pageRef.value = pageDiv as HTMLDivElement;

        // Create canvas elements and append to pageDiv
        const canvas1 = document.createElement("canvas");
        const canvas2 = document.createElement("canvas");
        pageDiv.appendChild(canvas1);
        pageDiv.appendChild(canvas2);

        // Append canvases to the document if necessary
        document.body.appendChild(canvas1);
        document.body.appendChild(canvas2);

        // Map canvases
        result.mapFloorToCanvas({ id: "floor1", name: "Floor 1" } as FloorDoc)(canvas1);
        result.mapFloorToCanvas({ id: "floor2", name: "Floor 2" } as FloorDoc)(canvas2);

        eventFloors.value = [
            { id: "floor1", name: "Floor 1" } as FloorDoc,
            { id: "floor2", name: "Floor 2" } as FloorDoc,
        ];

        // Wait for nextTick and watchers
        await delay(0);

        expect(result.floorInstances.value.length).toBe(2);
        expect(result.floorInstances.value[0].id).toBe("floor1");
        expect(result.floorInstances.value[1].id).toBe("floor2");

        // Clean up
        document.body.removeChild(pageDiv);
    });
});
