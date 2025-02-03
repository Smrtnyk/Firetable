import type { OrganisationDoc } from "@shared-types/organisation.js";
import type { PropertyDoc } from "@shared-types/property.js";

import { getPropertiesPath } from "../../src/paths.js";
import { DataGenerator } from "../DataGenerator.js";
import { logger } from "../logger.js";
import { BaseSeeder } from "./BaseSeeder.js";

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

        logger.success(`Seeded ${properties.length} properties`);
        return properties;
    }
}
