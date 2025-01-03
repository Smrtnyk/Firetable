import { OrganisationSeeder } from "../OrganisationSeeder.js";
import { UserSeeder } from "../UserSeeder.js";
import { PropertySeeder } from "../PropertySeeder.js";
import { FloorSeeder } from "../FloorSeeder.js";
import { EventSeeder } from "../EventSeeder.js";
import { GuestSeeder } from "../GuestSeeder.js";
import { verifyEmulatorConnection } from "../config.js";
import { ReservationSeeder } from "../ReservationSeeder.js";
import { faker } from "@faker-js/faker";

await verifyEmulatorConnection();

async function seed(): Promise<void> {
    console.log("🌱 Starting seeding process...");

    try {
        const organisationSeeder = new OrganisationSeeder();
        const propertySeeder = new PropertySeeder();
        const userSeeder = new UserSeeder();
        const floorSeeder = new FloorSeeder();
        const eventSeeder = new EventSeeder();
        const guestSeeder = new GuestSeeder();
        const reservationSeeder = new ReservationSeeder();

        for (let i = 0; i < 20; i++) {
            const orgId = `org-${(i + 1).toString().padStart(2, "0")}`;
            const organisation = await organisationSeeder.seedOne(orgId);
            console.log(`✓ Created organisation: ${organisation.name}`);

            const propertyCount = faker.number.int({ min: 1, max: 5 });
            const properties = await propertySeeder.seedForOrganisation(
                organisation,
                propertyCount,
            );
            const users = await userSeeder.seedForOrganisation(organisation, properties);
            await floorSeeder.seedForProperties(properties);
            const events = await eventSeeder.seedForProperties(properties);
            await guestSeeder.seedForOrganisation(organisation, properties, events);
            await reservationSeeder.seedForEvents(events, users);
        }

        await userSeeder.createAdminUser();

        console.log("✨ Seeding completed successfully!");
    } catch (error) {
        console.error("❌ Error during seeding:", error);
        process.exit(1);
    }
}

await seed();
