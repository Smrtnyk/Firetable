import { OrganisationSeeder } from "../OrganisationSeeder.js";
import { UserSeeder } from "../UserSeeder.js";
import { PropertySeeder } from "../PropertySeeder.js";
import { FloorSeeder } from "../FloorSeeder.js";
import { EventSeeder } from "../EventSeeder.js";
import { GuestSeeder } from "../GuestSeeder.js";
import { verifyEmulatorConnection } from "../config.js";
import { ReservationSeeder } from "../ReservationSeeder.js";
import { logger } from "../logger.js";
import { faker } from "@faker-js/faker";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

await verifyEmulatorConnection();

const argv = yargs(hideBin(process.argv))
    .option("organisations", {
        alias: "o",
        description: "Number of organisations to seed",
        type: "number",
        default: 1,
    })
    .option("with-admin", {
        alias: "a",
        description: "Create an admin user",
        type: "boolean",
        default: false,
    })
    .help()
    .alias("help", "h")
    .version(false)
    .parseSync();

async function seed(): Promise<void> {
    const startTime = Date.now();
    logger.info(`🌱 Starting seeding process (Creating ${argv.organisations} organisations)...`);

    try {
        const organisationSeeder = new OrganisationSeeder();
        const propertySeeder = new PropertySeeder();
        const userSeeder = new UserSeeder();
        const floorSeeder = new FloorSeeder();
        const eventSeeder = new EventSeeder();
        const guestSeeder = new GuestSeeder();
        const reservationSeeder = new ReservationSeeder();

        for (let i = 0; i < argv.organisations; i++) {
            const orgId = `org-${(i + 1).toString().padStart(2, "0")}`;
            const organisation = await organisationSeeder.seedOne(orgId);
            logger.organization(i + 1, argv.organisations, organisation.name);

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

        if (argv.withAdmin) {
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

await seed();
