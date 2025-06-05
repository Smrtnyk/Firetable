import type { FabricObject, Point, TOriginX, TOriginY } from "fabric";

export type AligningLineConfig = {
    /** Close horizontal line, default false. */
    closeHLine: boolean;
    /** Close Vertical line, default false. */
    closeVLine: boolean;
    /** Aligning line color */
    color: string;
    /** Alignment method is required when customizing. */
    contraryOriginMap?: OriginMap;
    /** When the user customizes the controller, this property is used to enable or disable alignment positioning through points. */
    getContraryMap?: (target: FabricObject) => PointMap;
    /** Returns shapes that can draw aligning lines, default returns all shapes on the canvas excluding groups. */
    getObjectsByTarget?: (target: FabricObject) => Set<FabricObject>;
    /** When the user customizes the controller, this property is set to enable or disable automatic alignment through point scaling/resizing. */
    getPointMap?: (target: FabricObject) => PointMap;
    /** At what distance from the shape does alignment begin? */
    margin: number;
    /** Aligning line dimensions */
    width: number;
};

export type LineProps = {
    origin: Point;
    target: Point;
};

export type PointMap = { [props: string]: Point };

type OriginMap = { [props: string]: [TOriginX, TOriginY] };
