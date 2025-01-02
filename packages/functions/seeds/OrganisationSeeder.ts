import type { OrganisationDoc } from "@shared-types/organisation.js";
import { BaseSeeder } from "./BaseSeeder.js";
import { DataGenerator } from "./DataGenerator.js";
import { Collection } from "@shared-types/firebase.js";

export class OrganisationSeeder extends BaseSeeder {
    async seed(): Promise<OrganisationDoc[]> {
        const organisations: OrganisationDoc[] = [];

        for (let i = 0; i < 20; i++) {
            const id = `org-${(i + 1).toString().padStart(2, "0")}`;
            organisations.push(DataGenerator.generateOrganisation(id));
        }

        await this.batchWrite(organisations, Collection.ORGANISATIONS);

        console.log(`✓ Seeded ${organisations.length} organisations`);

        return organisations;
    }
}
