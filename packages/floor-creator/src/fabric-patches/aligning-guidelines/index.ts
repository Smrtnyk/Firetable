/* eslint-disable func-style,@typescript-eslint/no-non-null-assertion */
import type { BasicTransformEvent, Canvas, FabricObject, Point } from "fabric";

import type { AligningLineConfig, LineProps } from "./typedefs.js";

import { aligningLineConfig } from "./constant.js";
import { getContraryMap, getPointMap } from "./util/basic.js";
import { collectLine } from "./util/collect-line.js";
import { collectHorizontalPoint, collectVerticalPoint } from "./util/collect-point.js";
import { drawHorizontalLine, drawPointList, drawVerticalLine } from "./util/draw.js";
import { getObjectsByTarget } from "./util/get-objects-by-target.js";

type TransformEvent = BasicTransformEvent & {
    target: FabricObject;
};

export function initAligningGuidelines(canvas: Canvas, options: Partial<AligningLineConfig> = {}) {
    Object.assign(aligningLineConfig, options);

    const horizontalLines = new Set<string>();
    const verticalLines = new Set<string>();
    // When we drag to resize using center points like mt, ml, mb, and mr,
    // we do not need to draw line segments; we only need to draw the target points.
    let onlyDrawPoint = false;
    const cacheMap = new Map<string, Point[]>();

    const getCaCheMapValue = (object: FabricObject): Point[] => {
        // If there is an ID and the ID is unique, we can cache using the ID for acceleration.
        // However, since Fabric does not have a built-in ID, we use the position information as the key for caching.
        // const cacheKey = object.id;
        const cacheKey = [
            object.calcTransformMatrix().toString(),
            object.width,
            object.height,
        ].join(",");
        const cacheValue = cacheMap.get(cacheKey);
        if (cacheValue) return cacheValue;
        const value = object.getCoords();
        value.push(object.getCenterPoint());
        cacheMap.set(cacheKey, value);
        return value;
    };

    function moving(e: TransformEvent): void {
        const target = e.target;
        // We need to obtain the real-time coordinates of the current object, so we need to update them in real-time
        target.setCoords();
        onlyDrawPoint = false;
        verticalLines.clear();
        horizontalLines.clear();

        // Find the shapes associated with the current graphic to draw reference lines for it.
        const objects = options.getObjectsByTarget?.(target) ?? getObjectsByTarget(target);
        const points: Point[] = [];
        // Collect all the points to draw reference lines.
        for (const object of objects) points.push(...getCaCheMapValue(object));

        // Obtain horizontal and vertical reference lines.
        const { hLines, vLines } = collectLine(target, points);
        vLines.forEach((o) => {
            // Objects cannot be deduplicated; convert them to strings for deduplication.
            verticalLines.add(JSON.stringify(o));
        });
        hLines.forEach((o) => {
            // Objects cannot be deduplicated; convert them to strings for deduplication.
            horizontalLines.add(JSON.stringify(o));
        });
    }

    // eslint-disable-next-line complexity -- patched from fabric
    function scalingOrResizing(e: TransformEvent): void {
        const target = e.target;
        // We need to obtain the real-time coordinates of the current object, so we need to update them in real-time
        target.setCoords();
        // The value of action can be scaleX, scaleY, scale, resize, etc.
        // If it does not start with "scale," it is considered a modification of size.
        const isScale = String(e.transform.action).startsWith("scale");
        verticalLines.clear();
        horizontalLines.clear();

        const objects = options.getObjectsByTarget?.(target) ?? getObjectsByTarget(target);
        let corner = e.transform.corner;
        // When the shape is flipped, the tl obtained through getCoords is actually tr,
        // and tl is actually tr. We need to make correction adjustments.
        // tr <-> tl、 bl <-> br、  mb <-> mt、 ml <-> mr
        if (target.flipX) {
            if (corner.includes("l")) corner = corner.replace("l", "r");
            else if (corner.includes("r")) corner = corner.replace("r", "l");
        }
        if (target.flipY) {
            if (corner.includes("t")) corner = corner.replace("t", "b");
            else if (corner.includes("b")) corner = corner.replace("b", "t");
        }

        // Obtain the coordinates of the current operation point through the value of corner.
        // users can be allowed to customize and pass in custom corners.
        const pointMap = options.getPointMap?.(target) ?? getPointMap(target);
        if (!(corner in pointMap)) return;
        onlyDrawPoint = corner.includes("m");
        if (onlyDrawPoint) {
            const angle = target.getTotalAngle();
            // When the shape is rotated, it is meaningless to draw points using the center point.
            if (angle % 90 !== 0) return;
        }
        // If manipulating tl, then when the shape changes size, it should be positioned by br,
        // and the same applies to others.
        // users can be allowed to customize and pass in custom corners.
        const contraryMap = options.getContraryMap?.(target) ?? getContraryMap(target);

        const point = pointMap[corner];
        let diagonalPoint = contraryMap[corner];
        // When holding the centerKey (default is altKey), the shape will scale based on the center point, with the reference point being the center.
        const isCenter = e.transform.altKey;
        if (isCenter) diagonalPoint = diagonalPoint.add(point).scalarDivide(2);

        const uniformIsToggled = e.e[canvas.uniScaleKey!];
        let isUniform =
            (canvas.uniformScaling && !uniformIsToggled) ??
            (!canvas.uniformScaling && uniformIsToggled);
        // When controlling through the center point,
        // if isUniform is true, it actually changes the skew, so it is meaningless.
        if (onlyDrawPoint) isUniform = false;

        const list: Point[] = [];
        for (const object of objects) {
            const d = getCaCheMapValue(object);
            list.push(...d);
        }

        const props = {
            corner,
            diagonalPoint,
            isCenter,
            isScale,
            isUniform,
            list,
            point,
            target,
        };
        // Obtain horizontal and vertical reference lines.
        const noNeedToCollectV = onlyDrawPoint && (corner.includes("t") ?? corner.includes("b"));
        const noNeedToCollectH = onlyDrawPoint && (corner.includes("l") ?? corner.includes("r"));
        const vLines = noNeedToCollectV ? [] : collectVerticalPoint(props);
        const hLines = noNeedToCollectH ? [] : collectHorizontalPoint(props);
        vLines.forEach((o) => {
            // Objects cannot be deduplicated; convert them to strings for deduplication.
            verticalLines.add(JSON.stringify(o));
        });
        hLines.forEach((o) => {
            // Objects cannot be deduplicated; convert them to strings for deduplication.
            horizontalLines.add(JSON.stringify(o));
        });
    }

    function beforeRender(): void {
        canvas.clearContext(canvas.contextTop);
    }
    function afterRender(): void {
        if (onlyDrawPoint) {
            const list: LineProps[] = [];
            if (!options.closeVLine) {
                for (const v of verticalLines) list.push(JSON.parse(v));
            }
            if (!options.closeHLine) {
                for (const h of horizontalLines) list.push(JSON.parse(h));
            }
            drawPointList(canvas, list);
        } else {
            if (!options.closeVLine) {
                for (const v of verticalLines) drawVerticalLine(canvas, JSON.parse(v));
            }
            if (!options.closeHLine) {
                for (const h of horizontalLines) {
                    drawHorizontalLine(canvas, JSON.parse(h));
                }
            }
        }
    }
    function mouseUp(): void {
        verticalLines.clear();
        horizontalLines.clear();
        cacheMap.clear();
        canvas.requestRenderAll();
    }

    canvas.on("object:resizing", scalingOrResizing);
    canvas.on("object:scaling", scalingOrResizing);
    canvas.on("object:moving", moving);
    canvas.on("before:render", beforeRender);
    canvas.on("after:render", afterRender);
    canvas.on("mouse:up", mouseUp);

    return () => {
        canvas.off("object:resizing", scalingOrResizing);
        canvas.off("object:scaling", scalingOrResizing);
        canvas.off("object:moving", moving);
        canvas.off("before:render", beforeRender);
        canvas.off("after:render", afterRender);
        canvas.off("mouse:up", mouseUp);
    };
}
