import type { PropertyDoc } from "@shared-types/property.js";
import { OrganisationSeeder } from "../OrganisationSeeder.js";
import { UserSeeder } from "../UserSeeder.js";
import { PropertySeeder } from "../PropertySeeder.js";
import { FloorSeeder } from "../FloorSeeder.js";
import { EventSeeder } from "../EventSeeder.js";
import { GuestSeeder } from "../GuestSeeder.js";
import { verifyEmulatorConnection } from "../config.js";

await verifyEmulatorConnection();

async function seed(): Promise<void> {
    console.log("🌱 Starting seeding process...");

    try {
        const organisationSeeder = new OrganisationSeeder();
        const organisations = await organisationSeeder.seed();

        const propertySeeder = new PropertySeeder();
        const properties = await propertySeeder.seed(organisations);

        // Group properties by org for user seeding
        const propertiesByOrg = properties.reduce<Record<string, PropertyDoc[]>>(
            (acc, property) => {
                if (!acc[property.organisationId]) {
                    acc[property.organisationId] = [];
                }
                acc[property.organisationId]?.push(property);
                return acc;
            },
            {},
        );

        const userSeeder = new UserSeeder();
        await userSeeder.seed(organisations, propertiesByOrg);

        const floorSeeder = new FloorSeeder();
        await floorSeeder.seed(properties);

        const eventSeeder = new EventSeeder();
        const events = await eventSeeder.seed(properties);

        const guestSeeder = new GuestSeeder();
        await guestSeeder.seed(organisations, properties, events);

        console.log("✨ Seeding completed successfully!");
    } catch (error) {
        console.error("❌ Error during seeding:", error);
        process.exit(1);
    }
}

await seed();
