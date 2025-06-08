import type { FabricObject, Point, TOriginX, TOriginY } from "fabric";

import type { LineProps } from "../typedefs.js";

import { aligningLineConfig } from "../constant.js";
import { getDistanceList } from "./basic.js";

type CollectPointProps = {
    /** tl、tr、br、bl、mt、mr、mb、ml */
    corner: string;
    /** Position using diagonal points when resizing/scaling. */
    diagonalPoint: Point;
    /** When holding the centerKey (default is altKey), the shape will scale based on the center point, with the reference point being the center. */
    isCenter: boolean;
    /** Change the zoom or change the size, determine by whether e.transform.action starts with the string "scale" */
    isScale: boolean;
    /** Whether to change uniformly is determined by canvas.uniformScaling and canvas.uniScaleKey. */
    isUniform: boolean;
    /** Set of points to consider for alignment: [tl, tr, br, bl, center] */
    list: Point[];
    /** Operation points of the target element: top-left, bottom-left, top-right, bottom-right */
    point: Point;
    target: FabricObject;
};
// Position using diagonal points when resizing/scaling
const originMap: { [props: string]: [TOriginX, TOriginY] } = {
    bl: ["right", "top"],
    br: ["left", "top"],
    mb: ["center", "top"],
    ml: ["right", "center"],
    mr: ["left", "center"],
    mt: ["center", "bottom"],
    tl: ["right", "bottom"],
    tr: ["left", "bottom"],
};
export function collectHorizontalPoint(props: CollectPointProps): LineProps[] {
    const { corner, diagonalPoint, isCenter, isScale, isUniform, list, point, target } = props;
    const { arr, dis } = getDistanceList(point, list, "y");
    const margin = aligningLineConfig.margin / (target.canvas?.getZoom() ?? 1);
    if (dis > margin) return [];
    let v = arr[arr.length - 1].y - point.y;
    // tl mt tr
    // If modifying on the top side, the size decreases; conversely, it increases.
    const dirY = corner.includes("t") ? -1 : 1;
    v *= dirY;

    const { height, scaleX, scaleY, strokeUniform, strokeWidth, width } = target;
    // Because when modifying through the center point, isUniform is always false, so skew does not need to be considered.
    const dStrokeWidth = strokeUniform ? 0 : strokeWidth;
    const scaleHeight = scaleY * height + dStrokeWidth;
    const sy = (v + scaleHeight) / scaleHeight;
    // When v equals -scaleHeight, sy equals 0.
    if (sy === 0) {
        return [];
    }
    if (isScale) {
        target.set("scaleY", scaleY * sy);
        if (isUniform) target.set("scaleX", scaleX * sy);
    } else {
        target.set("height", height * sy);
        if (isUniform) target.set("width", width * sy);
    }
    if (isCenter) {
        target.setRelativeXY(diagonalPoint, "center", "center");
    } else {
        const originArr = aligningLineConfig.contraryOriginMap ?? originMap;
        target.setRelativeXY(diagonalPoint, ...originArr[corner]);
    }
    target.setCoords();
    return arr.map((targetVal) => ({ origin: point, target: targetVal }));
}

export function collectVerticalPoint(props: CollectPointProps): LineProps[] {
    const { corner, diagonalPoint, isCenter, isScale, isUniform, list, point, target } = props;
    const { arr, dis } = getDistanceList(point, list, "x");
    const margin = aligningLineConfig.margin / (target.canvas?.getZoom() ?? 1);
    if (dis > margin) return [];
    let v = arr[arr.length - 1].x - point.x;
    // tl bl ml
    // If modifying on the left side, the size decreases; conversely, it increases.
    const dirX = corner.includes("l") ? -1 : 1;
    v *= dirX;

    const { height, scaleX, scaleY, strokeUniform, strokeWidth, width } = target;
    // Because when modifying through the center point, isUniform is always false, so skew does not need to be considered.
    const dStrokeWidth = strokeUniform ? 0 : strokeWidth;
    const scaleWidth = scaleX * width + dStrokeWidth;
    const sx = (v + scaleWidth) / scaleWidth;
    // When v equals -scaleWidth, sx equals 0.
    if (sx === 0) {
        return [];
    }
    if (isScale) {
        target.set("scaleX", scaleX * sx);
        if (isUniform) target.set("scaleY", scaleY * sx);
    } else {
        target.set("width", width * sx);
        if (isUniform) target.set("height", height * sx);
    }
    if (isCenter) {
        target.setRelativeXY(diagonalPoint, "center", "center");
    } else {
        const originArr = aligningLineConfig.contraryOriginMap ?? originMap;
        target.setRelativeXY(diagonalPoint, ...originArr[corner]);
    }
    target.setCoords();
    return arr.map((targetVal) => ({ origin: point, target: targetVal }));
}
