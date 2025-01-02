import type { FloorDoc } from "@shared-types/floor.js";
import type { EventDoc } from "@shared-types/event.js";
import type { PropertyDoc } from "@shared-types/property.js";
import { db } from "./init.js";
import { BaseSeeder } from "./BaseSeeder.js";
import { DataGenerator } from "./DataGenerator.js";
import { getEventPath, getEventsPath, getPropertyPath, getUsersPath } from "../src/paths.js";
import { Collection } from "@shared-types/firebase.js";
import { faker } from "@faker-js/faker";
import { Role } from "@shared-types/auth.js";

export class EventSeeder extends BaseSeeder {
    async seed(properties: PropertyDoc[]): Promise<Omit<EventDoc, "_doc">[]> {
        const events: Omit<EventDoc, "_doc">[] = [];

        for (const property of properties) {
            const usersSnapshot = await db
                .collection(getUsersPath(property.organisationId))
                .where("role", "==", Role.MANAGER)
                .get();

            const managers = usersSnapshot.docs.map((doc) => doc.data().email);
            if (managers.length === 0) continue;

            const floorsSnapshot = await db
                .collection(
                    `${getPropertyPath(property.organisationId, property.id)}/${Collection.FLOORS}`,
                )
                .get();
            const propertyFloors = floorsSnapshot.docs.map((doc) => doc.data() as FloorDoc);

            const numEvents = faker.number.int({ min: 20, max: 100 });
            const today = new Date();

            for (let i = 0; i < numEvents; i++) {
                const monthOffset = faker.number.int({ min: -6, max: 6 });
                const eventDate = new Date(today);
                eventDate.setMonth(today.getMonth() + monthOffset);
                eventDate.setHours(faker.number.int({ min: 21, max: 23 }), 0, 0, 0);

                const creator = faker.helpers.arrayElement(managers);
                const eventId = `event-${property.id}-${(i + 1).toString().padStart(3, "0")}`;

                const event = {
                    ...DataGenerator.generateEvent(
                        property.id,
                        property.organisationId,
                        creator,
                        eventDate.getTime(),
                    ),
                    id: eventId,
                };

                events.push(event);

                await this.batchWrite([event], getEventsPath(property.organisationId, property.id));

                if (propertyFloors.length > 0) {
                    const eventFloors = propertyFloors.map((floor, index) => ({
                        ...DataGenerator.generateEventFloor(floor, index + 1),
                        json: floor.json,
                    }));

                    await this.batchWrite(
                        eventFloors,
                        `${getEventPath(property.organisationId, property.id, eventId)}/${Collection.FLOORS}`,
                    );
                }
            }
        }

        console.log(`✓ Seeded ${events.length} events with floors`);
        return events;
    }
}
