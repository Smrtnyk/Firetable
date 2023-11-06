export interface FloorDoc {
    id: string;
    name: string;
    width: number;
    height: number;
    json: Record<string, any>;
    propertyId: string;
}

export type EventFloorDoc = FloorDoc & {
    lastModified?: number;
};

export const enum ElementTag {
    RECT = "RectTable",
    CIRCLE = "RoundTable",
    SOFA = "Sofa",
    SINGLE_SOFA = "SingleSofa",
    DJ_BOOTH = "DJBooth",
    WALL = "Wall",
    STAGE = "Stage",
}
