import type { EventDoc } from "@shared-types/event.js";
import type {
    PlannedReservation,
    PlannedReservationDoc,
    User,
    WalkInReservation,
    WalkInReservationDoc,
} from "@shared-types/index.js";

import { faker } from "@faker-js/faker";
import {
    Collection,
    ReservationState,
    ReservationStatus,
    ReservationType,
} from "@shared-types/index.js";

import { getEventPath, getReservationsPath } from "../../src/paths.js";
import { DataGenerator } from "../DataGenerator.js";
import { db } from "../init.js";
import { logger } from "../logger.js";
import { decompressJson, extractTableLabels, generateFirestoreId } from "../utils.js";
import { BaseSeeder } from "./BaseSeeder.js";

export class ReservationSeeder extends BaseSeeder {
    async seedForEvents(events: Omit<EventDoc, "_doc">[], users: User[]): Promise<void> {
        let totalReservations = 0;
        let currentReservation = 0;
        let totalPlanned = 0;
        let totalWalkIn = 0;
        let totalTablesUsed = 0;
        let totalFloorsWithReservations = 0;

        // First pass: estimate how many total reservations we'll generate
        for (const event of events) {
            const floorsSnapshot = await db
                .collection(
                    `${getEventPath(event.organisationId, event.propertyId, event.id)}/${Collection.FLOORS}`,
                )
                .get();

            for (const floorDoc of floorsSnapshot.docs) {
                const decompressedJson = await decompressJson(floorDoc.data().json);
                const floorTableLabels = extractTableLabels(decompressedJson);
                if (floorTableLabels.length === 0) continue;

                // We'll pick random # of reservations for each floor
                const minReservations = Math.ceil(floorTableLabels.length * 0.3);
                const maxReservations = floorTableLabels.length;

                totalReservations += faker.number.int({
                    max: maxReservations,
                    min: minReservations,
                });
            }
        }

        // Second pass: actually create reservations
        for (const event of events) {
            const floorsSnapshot = await db
                .collection(
                    `${getEventPath(event.organisationId, event.propertyId, event.id)}/${Collection.FLOORS}`,
                )
                .get();

            const reservationsPath = getReservationsPath(
                event.organisationId,
                event.propertyId,
                event.id,
            );

            const allReservations: (PlannedReservation | WalkInReservation)[] = [];

            for (const floorDoc of floorsSnapshot.docs) {
                const decompressedJson = await decompressJson(floorDoc.data().json);
                const floorTableLabels = extractTableLabels(decompressedJson);
                if (floorTableLabels.length === 0) continue;

                // Shuffle table labels so we don’t reuse the same ones multiple times
                const shuffledLabels = faker.helpers.shuffle(floorTableLabels);
                // Decide how many tables will get reservations in this floor
                const minReservations = Math.ceil(shuffledLabels.length * 0.3);
                const maxReservations = shuffledLabels.length;
                const reservationCount = faker.number.int({
                    max: maxReservations,
                    min: minReservations,
                });

                const usedTableLabels = shuffledLabels.slice(0, reservationCount);

                for (const tableLabel of usedTableLabels) {
                    const randomCreator = faker.helpers.arrayElement(users);
                    const randomReservedBy = faker.helpers.arrayElement(users);

                    if (faker.number.int({ max: 100, min: 1 }) <= 70) {
                        // 70% chance of planned
                        allReservations.push(
                            this.generatePlannedReservation(
                                tableLabel,
                                floorDoc.id,
                                randomCreator,
                                randomReservedBy,
                            ),
                        );
                        totalPlanned++;
                    } else {
                        // 30% chance of walk-in
                        allReservations.push(
                            this.generateWalkInReservation(tableLabel, floorDoc.id, randomCreator),
                        );
                        totalWalkIn++;
                    }

                    currentReservation++;
                    logger.progress(currentReservation, totalReservations, "Creating reservations");
                }

                totalTablesUsed += floorTableLabels.length;
                totalFloorsWithReservations++;
            }

            if (allReservations.length > 0) {
                await this.batchWrite(allReservations, reservationsPath);
            }
        }

        logger.stats({
            "Floors With Reservations": totalFloorsWithReservations,
            "Planned Reservations": totalPlanned,
            "Tables Used": totalTablesUsed,
            "Total Reservations": totalReservations,
            "Walk-in Reservations": totalWalkIn,
        });
    }

    private generatePlannedReservation(
        tableLabel: string,
        floorId: string,
        creatorUser: User,
        reservedByUser: User,
    ): PlannedReservationDoc {
        const isVIP = faker.datatype.boolean();
        const hasContact = faker.number.int({ max: 100, min: 1 }) <= 20;
        const randomState = faker.helpers.arrayElement([
            ReservationState.PENDING,
            ReservationState.CONFIRMED,
            ReservationState.ARRIVED,
        ]);
        const flags = this.getReservationFlags(randomState);

        return {
            creator: {
                createdAt: faker.date.recent().getTime(),
                email: creatorUser.email,
                id: creatorUser.id,
                name: creatorUser.name,
            },
            floorId,
            guestContact: hasContact ? DataGenerator.generatePhoneNumber() : "",
            id: generateFirestoreId(),
            numberOfGuests: faker.number.int({ max: 10, min: 1 }),
            reservationNote:
                faker.helpers.maybe(() => faker.lorem.sentence(), {
                    probability: 0.3,
                }) ?? "",
            state: randomState,
            status: ReservationStatus.ACTIVE,
            tableLabel,
            time: faker.helpers.arrayElement(["20:00", "21:00", "22:00", "23:00"]),
            ...flags,
            cancelled: false,
            consumption: isVIP
                ? faker.number.int({ max: 2000, min: 500 })
                : faker.number.int({ max: 500, min: 50 }),
            guestName: faker.person.fullName(),
            isVIP,
            reservedBy: {
                email: reservedByUser.email,
                id: reservedByUser.id,
                name: reservedByUser.name,
            },
            type: ReservationType.PLANNED,
        };
    }

    private generateWalkInReservation(
        tableLabel: string,
        floorId: string,
        creatorUser: User,
    ): WalkInReservationDoc {
        const isVIP = faker.datatype.boolean();
        const hasContact = faker.number.int({ max: 100, min: 1 }) <= 20;

        return {
            arrived: true,
            consumption: isVIP
                ? faker.number.int({ max: 2000, min: 500 })
                : faker.number.int({ max: 500, min: 50 }),
            creator: {
                createdAt: faker.date.recent().getTime(),
                email: creatorUser.email,
                id: creatorUser.id,
                name: creatorUser.name,
            },
            floorId,
            guestContact: hasContact ? DataGenerator.generatePhoneNumber() : "",
            guestName: faker.person.fullName(),
            id: generateFirestoreId(),
            isVIP,
            numberOfGuests: faker.number.int({ max: 10, min: 1 }),
            reservationNote:
                faker.helpers.maybe(() => faker.lorem.sentence(), {
                    probability: 0.3,
                }) ?? "",
            state: ReservationState.ARRIVED,
            status: ReservationStatus.ACTIVE,
            tableLabel,
            time: faker.helpers.arrayElement(["20:00", "21:00", "22:00", "23:00"]),
            type: ReservationType.WALK_IN,
        };
    }

    private getReservationFlags(state: ReservationState): {
        arrived: boolean;
        reservationConfirmed: boolean;
        waitingForResponse: boolean;
    } {
        switch (state) {
            case ReservationState.ARRIVED:
                return {
                    arrived: true,
                    reservationConfirmed: false,
                    waitingForResponse: false,
                };
            case ReservationState.CONFIRMED:
                return {
                    arrived: false,
                    reservationConfirmed: true,
                    waitingForResponse: false,
                };
            case ReservationState.PENDING:
                return {
                    arrived: false,
                    reservationConfirmed: false,
                    waitingForResponse: true,
                };
        }
        throw new Error("Invalid reservation state");
    }
}
