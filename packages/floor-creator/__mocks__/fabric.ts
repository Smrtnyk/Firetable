import { vi } from "vitest";

const mockSetCoords = vi.fn();

const mockObject = {
    set: vi.fn((props: any) => {
        Object.assign(mockObject, props);
    }),
    setCoords: mockSetCoords,
    left: 0,
    top: 0,
};

// The fabric module mock
export const fabric = {
    Object: vi.fn().mockImplementation(() => mockObject),
    Group: vi.fn(() => {
        return {
            ...fabric.Object,
            type: "group",
        };
    }),
} as any;
