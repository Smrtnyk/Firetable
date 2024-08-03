import type { FabricObject, TBBox } from "fabric";
import { aligningLineMargin } from "./constant.js";
import { getDistance, setPositionDir } from "./basic.js";
import { Point } from "fabric";

type CollectLineProps = {
    activeObject: FabricObject;
    activeObjectRect: TBBox;
    objectRect: TBBox;
};

type Line = {
    vLines: VerticalLine[];
    hLines: HorizontalLine[];
};

export function collectLine(props: CollectLineProps): Line {
    const { activeObject, activeObjectRect, objectRect } = props;
    const list = makeLineByRect(objectRect);
    const aList = makeLineByRect(activeObjectRect);
    const margin = aligningLineMargin / (activeObject.canvas?.getZoom() ?? 1);
    const opts = { target: activeObject, list, aList, margin };
    const vLines = collectLines(opts, "x", createVerticalLine, setVerticalPos);
    const hLines = collectLines(opts, "y", createHorizontalLine, setHorizontalPos);

    return { vLines, hLines };
}

type CollectItemLineProps = {
    target: FabricObject;
    list: LineProps[];
    aList: LineProps[];
    margin: number;
};

type VerticalLine = { x: number; y1: number; y2: number };
type HorizontalLine = { y: number; x1: number; x2: number };

function collectLines<A extends "x" | "y", R = A extends "y" ? HorizontalLine : VerticalLine>(
    props: CollectItemLineProps,
    axis: A,
    createLineFn: (line: LineProps, aLine: LineProps) => R,
    setPosFn: (props: SnapToPixelProps) => void,
): R[] {
    const { target, list, aList, margin } = props;

    const arr = aList.map((x) => getDistanceLine(x, list, axis));
    const min = getMinDistance(arr);
    if (min > margin) {
        return [];
    }
    const lines: R[] = [];
    const width = aList[0].x2 - aList[0].x;
    const height = aList[0].y2 - aList[0].y;
    let b = false;
    for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (min === item.dis) {
            const line = list[item.index];
            const aLine = aList[item.index];
            lines.push(createLineFn(line, aLine));
            if (b) {
                continue;
            }
            b = true;

            setPosFn({
                target,
                x: axis === "x" ? line.x : aLine.x,
                y: axis === "y" ? line.y : aLine.y,
                centerX: axis === "x" ? i - 1 : item.index - 1,
                centerY: axis === "y" ? i - 1 : item.index - 1,
                width,
                height,
                dir: axis,
            });
            const dis = min * item.dir;
            aList.forEach(function (lineProp) {
                lineProp[axis] -= dis;
            });
        }
    }
    return lines;
}

function createVerticalLine(line: LineProps, aLine: LineProps): VerticalLine {
    const x = line.x;
    const y = aLine.y;
    const y1 = Math.min(line.y, line.y2, y, aLine.y2);
    const y2 = Math.max(line.y, line.y2, y, aLine.y2);
    return { x, y1, y2 };
}

function createHorizontalLine(line: LineProps, aLine: LineProps): HorizontalLine {
    const y = line.y;
    const x = aLine.x;
    const x1 = Math.min(line.x, line.x2, x, aLine.x2);
    const x2 = Math.max(line.x, line.x2, x, aLine.x2);
    return { y, x1, x2 };
}

type LineProps = {
    x: number;
    y: number;
    x2: number;
    y2: number;
};

type DistanceLine = {
    dis: number;
    index: number;
    dir: number;
};

function getDistanceLine(target: LineProps, list: LineProps[], type: "x" | "y"): DistanceLine {
    let dis = Infinity;
    let index = -1;
    let dir = 1;
    for (let i = 0; i < list.length; i++) {
        const v = getDistance(target[type], list[i][type]);
        if (dis > v) {
            index = i;
            dis = v;
            dir = target[type] > list[i][type] ? 1 : -1;
        }
    }
    return { dis, index, dir };
}

type LineByRect = { x: number; y: number; x2: number; y2: number };

function makeLineByRect(rect: TBBox): [a: LineByRect, b: LineByRect, c: LineByRect] {
    const { left, top, width, height } = rect;
    const a = { x: left, y: top, x2: left + width, y2: top + height };
    const x = left + width / 2;
    const y = top + height / 2;
    const b = { x, y, x2: x, y2: y };
    const c = { x: left + width, x2: left, y: top + height, y2: top };

    return [a, b, c];
}

type SnapToPixelProps = {
    target: FabricObject;
    x: number;
    y: number;
    /** -1 0 1 */
    centerX: number;
    /** -1 0 1 */
    centerY: number;
    width: number;
    height: number;
    dir: "x" | "y";
};

function setVerticalPos(props: SnapToPixelProps): void {
    const { target, centerX, width } = props;
    let { x } = props;
    x -= (centerX * width) / 2;
    setPositionDir(target, new Point(x, props.y), "x");
    target.setCoords();
}

function setHorizontalPos(props: SnapToPixelProps): void {
    const { target, centerY, height } = props;
    let { y } = props;
    y -= (centerY * height) / 2;
    setPositionDir(target, new Point(props.x, y), "y");
    target.setCoords();
}

function getMinDistance(arr: DistanceLine[]): number {
    return Math.min(...arr.map(({ dis }) => dis));
}
