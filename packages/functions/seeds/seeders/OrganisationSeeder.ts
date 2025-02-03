import type { OrganisationDoc } from "@shared-types/organisation.js";

import { Collection } from "@shared-types/firebase.js";

import { DataGenerator } from "../DataGenerator.js";
import { BaseSeeder } from "./BaseSeeder.js";

export class OrganisationSeeder extends BaseSeeder {
    async seedOne(id: string): Promise<OrganisationDoc> {
        const organisation = DataGenerator.generateOrganisation(id);

        await this.batchWrite([organisation], Collection.ORGANISATIONS);

        return organisation;
    }
}
