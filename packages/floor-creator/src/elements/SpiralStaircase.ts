import { ELEMENT_DEFAULT_FILL_COLOR, ELEMENT_DEFAULT_STROKE_COLOR } from "../constants";
import { Group, Path } from "fabric";

export class SpiralStaircase extends Group {
    constructor(top: number, left: number) {
        const steps = 13;
        const innerRadius = 5;
        const stepHeight = 5;
        const rotationAngle = 270;
        // Angle covered by each step in degrees
        const anglePerStep = rotationAngle / steps;

        const staircaseComponents: Path[] = [];

        for (let i = 0; i < steps; i++) {
            const startAngleRad = (Math.PI / 180) * (i * anglePerStep);
            const endAngleRad = (Math.PI / 180) * ((i + 1) * anglePerStep);

            const stepOuterRadius = innerRadius + (i + 1) * stepHeight;

            const points = [
                // Inner start point
                innerRadius * Math.cos(startAngleRad),
                innerRadius * Math.sin(startAngleRad),
                // Outer start point
                stepOuterRadius * Math.cos(startAngleRad),
                stepOuterRadius * Math.sin(startAngleRad),
                // Outer end point
                stepOuterRadius * Math.cos(endAngleRad),
                stepOuterRadius * Math.sin(endAngleRad),
                // Inner end point
                innerRadius * Math.cos(endAngleRad),
                innerRadius * Math.sin(endAngleRad),
            ];

            const step = new Path(
                `M ${points[0]} ${points[1]} L ${points[2]} ${points[3]} ` +
                    `L ${points[4]} ${points[5]} L ${points[6]} ${points[7]} z`,
                {
                    fill: ELEMENT_DEFAULT_FILL_COLOR,
                    stroke: ELEMENT_DEFAULT_STROKE_COLOR,
                    strokeUniform: true,
                    strokeWidth: 0.5,
                },
            );

            staircaseComponents.push(step);
        }

        // Group all the steps together
        super(staircaseComponents, {
            originX: "center",
            originY: "center",
            top,
            left,
        });
    }

    getBaseFill(): string {
        return "";
    }

    setBaseFill(): void {
        // imp
    }
}
