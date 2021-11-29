import { TableElement } from "src/floor-manager/TableElement";
import { RoundTableElement } from "src/floor-manager/RoundTableElement";

export function isWall(element: any): element is any {
    return true;
}

export function isTable(element: any): boolean {
    return element instanceof RoundTableElement || element instanceof TableElement;
}

export function isRoundTable(element: any): element is any {
    return element instanceof RoundTableElement;
}
