import type { EventDoc } from "@shared-types/event.js";
import type { GuestDoc } from "@shared-types/guest.js";
import type { PropertyDoc } from "@shared-types/index.js";
import type { OrganisationDoc } from "@shared-types/organisation.js";

import { faker } from "@faker-js/faker";

import { getGuestsPath } from "../../src/paths.js";
import { DataGenerator } from "../DataGenerator.js";
import { logger } from "../logger.js";
import { BaseSeeder } from "./BaseSeeder.js";

export class GuestSeeder extends BaseSeeder {
    async seedForOrganisation(
        organisation: OrganisationDoc,
        properties: PropertyDoc[],
        events: Omit<EventDoc, "_doc">[],
    ): Promise<void> {
        const startTime = Date.now();
        logger.info(`Creating guests for organisation "${organisation.name}"`);

        const eventsByProperty = events.reduce<Record<string, Omit<EventDoc, "_doc">[]>>(
            (acc, event) => {
                acc[event.propertyId] ??= [];
                acc[event.propertyId]?.push(event);
                return acc;
            },
            {},
        );

        const orgProperties = properties.filter(
            (property) => property.organisationId === organisation.id,
        );

        const stats = {
            guestsWithContact: 0,
            guestsWithMultipleVisits: 0,
            propertiesWithGuests: 0,
            totalGuests: 0,
            totalVisits: 0,
            vipGuests: 0,
        };

        for (const property of orgProperties) {
            const propertyEvents = eventsByProperty[property.id] ?? [];
            if (propertyEvents.length === 0) {
                logger.warn(`No events found for property "${property.name}", skipping...`);
                continue;
            }

            const numGuests = faker.number.int({ max: 1000, min: 100 });
            logger.info(`Creating ${numGuests} guests for property "${property.name}"`);

            const propertyStart = Date.now();
            const guests: GuestDoc[] = [];
            let propertyVisits = 0;

            for (let i = 0; i < numGuests; i++) {
                const guestEvents = faker.helpers.arrayElements(
                    propertyEvents,
                    faker.number.int({ max: 5, min: 1 }),
                );

                const guest = DataGenerator.generateGuest();

                // Track guest with contact info
                if (guest.contact) {
                    stats.guestsWithContact++;
                }

                // Track VIP guests
                if (guest.tags?.includes("VIP")) {
                    stats.vipGuests++;
                }

                if (guestEvents.length > 1) {
                    stats.guestsWithMultipleVisits++;
                    propertyVisits += guestEvents.length;

                    guestEvents.forEach((event) => {
                        guest.visitedProperties[property.id] ??= {};
                        guest.visitedProperties[property.id]![event.id] = {
                            arrived: faker.datatype.boolean(),
                            cancelled: faker.datatype.boolean(),
                            date: event.date,
                            eventName: event.name,
                            isVIPVisit: guest.tags?.includes("VIP") ?? false,
                        };
                    });
                }

                guests.push(guest);
            }

            if (guests.length > 0) {
                await this.batchWrite(guests, getGuestsPath(organisation.id));
                stats.propertiesWithGuests++;
                stats.totalGuests += guests.length;
                stats.totalVisits += propertyVisits;

                const propertyDuration = ((Date.now() - propertyStart) / 1000).toFixed(2);
                logger.stats(
                    {
                        "Guests Created": guests.length,
                        Time: `${propertyDuration}s`,
                        "Total Visits": propertyVisits,
                    },
                    2,
                );
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        logger.info("Guest seeding statistics:");
        logger.stats({
            "Guests with Contact": stats.guestsWithContact,
            "Multiple Visit Guests": stats.guestsWithMultipleVisits,
            "Properties with Guests": stats.propertiesWithGuests,
            "Total Guests": stats.totalGuests,
            "Total Time": `${duration}s`,
            "Total Visits": stats.totalVisits,
            "VIP Guests": stats.vipGuests,
        });
    }
}
