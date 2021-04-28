import {
    BaseFloorElement,
    ElementTag,
    ElementType,
    TableElement,
    WallElement,
} from "src/types";

export function isWall(d: Pick<BaseFloorElement, "type">): d is WallElement {
    const { type } = d;
    return type === ElementType.WALL;
}

export function isTable(d: Pick<BaseFloorElement, "type">): d is TableElement {
    const { type } = d;
    return type === ElementType.TABLE;
}

export function isSquaredTable(
    d: Pick<BaseFloorElement, "type" | "tag">
): d is TableElement {
    const { tag } = d;
    return isTable(d) && tag === ElementTag.RECT;
}

export function isRoundTable(
    d: Pick<BaseFloorElement, "type" | "tag">
): d is TableElement {
    const { tag } = d;
    return isTable(d) && tag === ElementTag.CIRCLE;
}
