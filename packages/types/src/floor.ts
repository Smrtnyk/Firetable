export interface FloorDoc {
    id: string;
    name: string;
    width: number;
    height: number;
    json: string | Record<string, any>;
    propertyId: string;
    compressed?: boolean;
}

export type EventFloorDoc = FloorDoc & {
    lastModified?: number;
};

export const enum ElementTag {
    RECT = "RectTable",
    CIRCLE = "RoundTable",
    SOFA = "Sofa",
    DJ_BOOTH = "DJBooth",
    WALL = "Wall",
    STAGE = "Stage",
}
