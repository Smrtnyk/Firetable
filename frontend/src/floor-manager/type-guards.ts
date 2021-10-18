import {
    BaseFloorElement,
    ElementTag,
    ElementType,
    RoundTable,
    TableElement,
    WallElement,
} from "src/types";

export function isWall(d: Pick<BaseFloorElement, "type">): d is WallElement {
    return d.type === ElementType.WALL;
}

export function isTable(d: Pick<BaseFloorElement, "type">): d is TableElement {
    return d.type === ElementType.TABLE;
}

export function isSquaredTable(
    d: TableElement | BaseFloorElement
): d is TableElement {
    return isTable(d) && d.tag === ElementTag.RECT;
}

export function isRoundTable(
    d: TableElement | BaseFloorElement
): d is RoundTable {
    return isTable(d) && d.tag === ElementTag.CIRCLE;
}
