export interface FloorDoc {
    id: string;
    name: string;
    width: number;
    height: number;
    json: Record<string, any>;
}

export const enum ElementType {
    WALL = "wall",
    TABLE = "table",
}

export const enum ElementTag {
    RECT = "rect",
    CIRCLE = "circle",
}
