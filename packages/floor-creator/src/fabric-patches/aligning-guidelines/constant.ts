import type { AligningLineConfig } from "./typedefs.js";

export const aligningLineConfig: AligningLineConfig = {
    /** Close horizontal line, default false. */
    closeHLine: false,
    /** Close Vertical line, default false. */
    closeVLine: false,
    /** Aligning line color */
    color: "rgba(255,0,0,0.9)",
    /** At what distance from the shape does alignment begin? */
    margin: 4,
    /** Aligning line dimensions */
    width: 1,
};
