export interface FloorDoc {
    id: string;
    name: string;
    width: number;
    height: number;
    json?: string;
}

export const enum ElementType {
    WALL = "wall",
    TABLE = "table",
}

export const enum ElementTag {
    RECT = "rect",
    CIRCLE = "circle",
}
