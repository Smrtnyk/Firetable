import { RESOLUTION, TABLE_HEIGHT, TABLE_WIDTH } from "./constants";
import { BaseFloorElement, FloorMode, TableElement } from "src/types";
import { isRoundTable, isTable, isWall } from "src/floor-manager/type-guards";

export const generateTableGroupClass = ({ tableId }: TableElement) =>
    `tableGroup tableGroup__${tableId}`;

export function generateTableClass({ reservation, tableId }: TableElement) {
    let className = `table table__${tableId} `;
    if (reservation) {
        className += "reserved";

        if (reservation.confirmed) {
            className += " confirmed";
        }
    }
    return className;
}

export function getTableText({ tableId }: TableElement) {
    return tableId;
}

export function round(p: number, n: number) {
    return p % n < n / 2 ? p - (p % n) : p + n - (p % n);
}

export function getTableTextPosition(d: TableElement) {
    if (isRoundTable(d)) {
        return "translate(0,0)";
    }
    return `translate(${getTableWidth(d) / 2},${getTableHeight(d) / 2})`;
}

export function getRoundTableRadius(d?: TableElement) {
    return (d?.width || TABLE_WIDTH) / 2;
}

export function getTableHeight(d?: TableElement) {
    return (d && d.height) || TABLE_HEIGHT;
}

export function getTableWidth(d?: TableElement) {
    return d?.width || TABLE_WIDTH;
}

export function calculateTopResizableCirclePositionY(d: BaseFloorElement) {
    const { height } = d;
    if (isTable(d) && isRoundTable(d)) {
        return -(height / 2);
    }
    return 0;
}

export function calculateTopResizableCirclePositionX(d: BaseFloorElement) {
    const { width } = d;
    if (isTable(d) && isRoundTable(d)) {
        return -(width / 2);
    }
    return 0;
}

export function calculateBottomResizableCirclePositionX(d: BaseFloorElement) {
    const { width } = d;
    if (isTable(d) && isRoundTable(d)) {
        return width / 2;
    }
    return width;
}

export function calculateBottomResizableCirclePositionY(d: BaseFloorElement) {
    const { height } = d;
    if (isTable(d) && isRoundTable(d)) {
        return height / 2;
    }
    return height;
}

export function possibleXMove(
    width: number,
    x: number,
    elemWidth = TABLE_WIDTH
) {
    let normalizedX = x;
    if (x + elemWidth > width) {
        normalizedX = width - elemWidth;
    }
    return round(Math.max(0, normalizedX), RESOLUTION);
}

export function possibleYMove(
    height: number,
    y: number,
    elemHeight = TABLE_HEIGHT
) {
    let normalizedY = y;
    if (y + elemHeight > height) {
        normalizedY = height - elemHeight;
    }
    return round(Math.max(0, normalizedY), RESOLUTION);
}

export function getDefaultElementWidth(d: BaseFloorElement) {
    if (isWall(d)) {
        return calculateWallWidth();
    }
    if (isTable(d)) {
        return getTableWidth();
    }
    return 0;
}

export function calculateWallHeight({ height } = { height: RESOLUTION }) {
    return height;
}

export function calculateWallWidth({ width } = { width: RESOLUTION }) {
    return width;
}

export function translateElementToItsPosition({ x, y }: BaseFloorElement) {
    return `translate(${x}, ${y})`;
}

export function isEditorModeActive(mode: FloorMode) {
    return mode === FloorMode.EDITOR;
}
