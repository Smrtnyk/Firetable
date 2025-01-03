import type { FloorDoc } from "@shared-types/floor.js";
import type { PropertyDoc } from "@shared-types/property.js";
import { BaseSeeder } from "./BaseSeeder.js";
import { DataGenerator } from "./DataGenerator.js";
import { compressJson } from "./utils.js";
import { getPropertyPath } from "../src/paths.js";
import { Collection } from "@shared-types/firebase.js";
import { join } from "node:path";

export class FloorSeeder extends BaseSeeder {
    private floorPlans: {
        [key: string]: {
            json: string;
            width: number;
            height: number;
        };
    } = {};

    async seedForProperties(properties: PropertyDoc[]): Promise<void> {
        await this.loadFloorPlans();
        const floorPlanKeys = Object.keys(this.floorPlans);

        for (const property of properties) {
            const floors: FloorDoc[] = [];

            for (let floorNumber = 1; floorNumber <= 3; floorNumber++) {
                const id = `floor-${property.id}-${floorNumber}`;

                const floorPlanKey = floorPlanKeys[(floorNumber - 1) % floorPlanKeys.length]!;
                const floorPlanJson = this.floorPlans[floorPlanKey]!;

                const compressedJson = await compressJson(floorPlanJson.json);

                floors.push({
                    ...DataGenerator.generateFloor(id, property.id, floorNumber),
                    json: compressedJson,
                    width: floorPlanJson.width,
                    height: floorPlanJson.height,
                });
            }

            await this.batchWrite(
                floors,
                `${getPropertyPath(property.organisationId, property.id)}/${Collection.FLOORS}`,
            );
        }
    }

    private async loadFloorPlans(): Promise<void> {
        try {
            const floorPlansDir = join(import.meta.dirname, "floor-plans");

            for (let i = 1; i <= 3; i++) {
                const filePath = join(floorPlansDir, `floor-${i}.json`);
                this.floorPlans[`floor-${i}`] = await import(filePath, {
                    assert: { type: "json" },
                });
            }

            console.log("✓ Loaded floor plan templates");
        } catch (error) {
            console.error("Error loading floor plan templates:", error);
            throw error;
        }
    }
}
