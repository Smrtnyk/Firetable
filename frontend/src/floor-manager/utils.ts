import { RESOLUTION, TABLE_HEIGHT, TABLE_WIDTH } from "./constants";
import { BaseFloorElement, FloorMode, TableElement } from "src/types";
import { isRoundTable, isTable, isWall } from "src/floor-manager/type-guards";

export function generateTableGroupClass({ tableId }: TableElement) {
    return `tableGroup tableGroup__${tableId}`;
}

export function generateTableClass({ reservation, tableId }: TableElement) {
    const className = ["table", `table__${tableId}`];
    if (reservation) {
        className.push("reserved");

        if (reservation.confirmed) {
            className.push("confirmed");
        }
    }
    return className.join(" ");
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
    const largestWidth = Math.max(d?.width || 0, d?.height || 0, TABLE_WIDTH);
    const diagonal = largestWidth * Math.sqrt(2);
    return diagonal / 2;
}

export function getTableHeight(d?: TableElement) {
    return d?.height || TABLE_HEIGHT;
}

export function getTableWidth(d?: TableElement) {
    return d?.width || TABLE_WIDTH;
}

export function calculateBottomResizableCirclePositionX(d: TableElement) {
    if (isRoundTable(d)) {
        return getRoundTableRadius(d) / Math.sqrt(2);
    }
    return d.width;
}

export function calculateBottomResizableCirclePositionY(d: TableElement) {
    if (isRoundTable(d)) {
        return getRoundTableRadius(d) / Math.sqrt(2);
    }
    return d.height;
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

export function isEditorModeActive(mode: FloorMode): boolean {
    return mode === FloorMode.EDITOR;
}
