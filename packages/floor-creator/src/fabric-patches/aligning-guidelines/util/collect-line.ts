import type { FabricObject, Point, TOriginX, TOriginY } from "fabric";

import type { LineProps } from "../typedefs.js";

import { aligningLineConfig } from "../constant.js";
import { getDistanceList } from "./basic.js";

type CollectItemLineProps = {
    list: Point[];
    margin: number;
    points: Point[];
    target: FabricObject;
    type: "x" | "y";
};

export function collectLine(
    target: FabricObject,
    points: Point[],
): { hLines: LineProps[]; vLines: LineProps[] } {
    const list = target.getCoords();
    list.push(target.getCenterPoint());
    const margin = aligningLineConfig.margin / (target.canvas?.getZoom() ?? 1);
    const opts = { list, margin, points, target };
    const vLines = collectPoints({ ...opts, type: "x" });
    const hLines = collectPoints({ ...opts, type: "y" });

    return { hLines, vLines };
}
const originArr: [TOriginX, TOriginY][] = [
    ["left", "top"],
    ["right", "top"],
    ["right", "bottom"],
    ["left", "bottom"],
    ["center", "center"],
];
function collectPoints(props: CollectItemLineProps): LineProps[] {
    const { list, margin, points, target, type } = props;
    const res: LineProps[] = [];
    const arr: ReturnType<typeof getDistanceList>[] = [];
    let min = Infinity;
    for (const item of list) {
        const o = getDistanceList(item, points, type);
        arr.push(o);
        if (min > o.dis) min = o.dis;
    }
    if (min > margin) return res;
    let b = false;
    for (let i = 0; i < list.length; i++) {
        if (arr[i].dis !== min) continue;
        for (const item of arr[i].arr) {
            res.push({ origin: list[i], target: item });
        }

        if (b) continue;
        b = true;
        const d = arr[i].arr[0][type] - list[i][type];
        // It will change the original data, and the next time we collect y, use the modified data.
        list.forEach((item) => {
            item[type] += d;
        });
        target.setXY(list[i], ...originArr[i]);
        target.setCoords();
    }

    return res;
}
