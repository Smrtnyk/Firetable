import { OrganisationSeeder } from "../seeders/OrganisationSeeder.js";
import { UserSeeder } from "../seeders/UserSeeder.js";
import { PropertySeeder } from "../seeders/PropertySeeder.js";
import { FloorSeeder } from "../seeders/FloorSeeder.js";
import { EventSeeder } from "../seeders/EventSeeder.js";
import { GuestSeeder } from "../seeders/GuestSeeder.js";
import { verifyEmulatorConnection } from "../config.js";
import { ReservationSeeder } from "../seeders/ReservationSeeder.js";
import { logger } from "../logger.js";
import { faker } from "@faker-js/faker";
import { cac } from "cac";

await verifyEmulatorConnection();

const cli = cac("seed");

cli.option("-o, --organisations <number>", "Number of organisations to seed", {
    default: 1,
})
    .option("-a, --with-admin", "Create an admin user", {
        default: false,
    })
    .help();

const { options } = cli.parse();

async function seed(): Promise<void> {
    const startTime = Date.now();
    logger.info(`🌱 Starting seeding process (Creating ${options.organisations} organisations)...`);

    try {
        const organisationSeeder = new OrganisationSeeder();
        const propertySeeder = new PropertySeeder();
        const userSeeder = new UserSeeder();
        const floorSeeder = new FloorSeeder();
        const eventSeeder = new EventSeeder();
        const guestSeeder = new GuestSeeder();
        const reservationSeeder = new ReservationSeeder();

        for (let i = 0; i < options.organisations; i++) {
            const orgId = `org-${(i + 1).toString().padStart(2, "0")}`;
            const organisation = await organisationSeeder.seedOne(orgId);
            logger.organization(i + 1, options.organisations, organisation.name);

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

            logger.stats(
                {
                    Properties: properties.length,
                    Users: users.length,
                    Events: events.length,
                },
                2,
            );
        }

        if (options.withAdmin) {
            await userSeeder.createAdminUser();
        }

        const duration = Date.now() - startTime;
        logger.timing(duration);
        logger.success("Seeding completed successfully!");
    } catch (error) {
        console.error("❌ Error during seeding:", error);
        process.exit(1);
    }
}

cli.on("command:*", function () {
    console.error("Invalid command");
    process.exit(1);
});

await seed();
