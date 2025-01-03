import type { PropertyDoc } from "@shared-types/property.js";
import type { OrganisationDoc } from "@shared-types/organisation.js";
import { BaseSeeder } from "./BaseSeeder.js";
import { DataGenerator } from "./DataGenerator.js";
import { getPropertiesPath } from "../src/paths.js";

export class PropertySeeder extends BaseSeeder {
    async seedForOrganisation(
        organisation: OrganisationDoc,
        propertyCount: number,
    ): Promise<PropertyDoc[]> {
        const properties: PropertyDoc[] = [];

        for (let i = 0; i < propertyCount; i++) {
            const id = `prop-${organisation.id}-${(i + 1).toString().padStart(2, "0")}`;
            const property = DataGenerator.generateProperty(id, organisation.id);
            properties.push(property);

            await this.batchWrite([property], getPropertiesPath(organisation.id));
        }

        console.log(`✓ Seeded ${properties.length} properties`);
        return properties;
    }
}
