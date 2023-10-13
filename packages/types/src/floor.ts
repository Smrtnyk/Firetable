export interface FloorDoc {
    id: string;
    name: string;
    width: number;
    height: number;
    json: Record<string, any>;
    propertyId: string;
}

export const enum ElementTag {
    RECT = "rect",
    CIRCLE = "circle",
    SOFA = "sofa",
    DJ_BOOTH = "dj_booth",
    WALL = "wall",
}
