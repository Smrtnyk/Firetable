/* eslint-disable id-length -- patched from fabric */
import type { FabricObject, Point } from "fabric";

import type { PointMap } from "../typedefs.js";

export function getContraryMap(target: FabricObject): PointMap {
    const aCoords = target.aCoords ?? target.calcACoords();
    return {
        bl: aCoords.tr,
        br: aCoords.tl,
        mb: aCoords.tl.add(aCoords.tr).scalarDivide(2),
        ml: aCoords.tr.add(aCoords.br).scalarDivide(2),
        mr: aCoords.bl.add(aCoords.tl).scalarDivide(2),
        mt: aCoords.br.add(aCoords.bl).scalarDivide(2),
        tl: aCoords.br,
        tr: aCoords.bl,
    };
}

export function getDistance(a: number, b: number): number {
    return Math.abs(a - b);
}

export function getDistanceList(
    point: Point,
    list: Point[],
    type: "x" | "y",
): { arr: Point[]; dis: number } {
    let dis = Infinity;
    let arr: Point[] = [];
    for (const item of list) {
        const v = getDistance(point[type], item[type]);
        if (dis > v) {
            arr = [];
            dis = v;
        }
        if (dis === v) {
            arr.push(item);
        }
    }
    return { arr, dis };
}

export function getPointMap(target: FabricObject): PointMap {
    const coords = target.getCoords();
    return {
        bl: coords[3],
        br: coords[2],
        mb: coords[2].add(coords[3]).scalarDivide(2),
        ml: coords[3].add(coords[0]).scalarDivide(2),
        mr: coords[1].add(coords[2]).scalarDivide(2),
        mt: coords[0].add(coords[1]).scalarDivide(2),
        tl: coords[0],
        tr: coords[1],
    };
}
