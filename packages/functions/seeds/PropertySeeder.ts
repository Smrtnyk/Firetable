import type { PropertyDoc } from "@shared-types/property.js";
import type { OrganisationDoc } from "@shared-types/organisation.js";
import { BaseSeeder } from "./BaseSeeder.js";
import { DataGenerator } from "./DataGenerator.js";
import { getPropertiesPath } from "../src/paths.js";
import { faker } from "@faker-js/faker";

export class PropertySeeder extends BaseSeeder {
    async seed(organisations: OrganisationDoc[]): Promise<PropertyDoc[]> {
        const properties: PropertyDoc[] = [];

        for (const org of organisations) {
            const propertyCount = faker.number.int({ min: 1, max: 5 });

            for (let i = 0; i < propertyCount; i++) {
                const id = `prop-${org.id}-${(i + 1).toString().padStart(2, "0")}`;
                const property = DataGenerator.generateProperty(id, org.id);
                properties.push(property);

                await this.batchWrite([property], getPropertiesPath(org.id));
            }
        }

        console.log(`✓ Seeded ${properties.length} properties`);
        return properties;
    }
}
