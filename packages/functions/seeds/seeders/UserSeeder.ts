import type { OrganisationDoc, PropertyDoc, User } from "@shared-types/index.js";

import { faker } from "@faker-js/faker";
import { AdminRole, Role } from "@shared-types/index.js";

import { getUsersPath } from "../../src/paths.js";
import { DataGenerator } from "../DataGenerator.js";
import { auth } from "../init.js";
import { logger } from "../logger.js";
import { generateFirestoreId } from "../utils.js";
import { BaseSeeder } from "./BaseSeeder.js";

export class UserSeeder extends BaseSeeder {
    async createAdminUser(): Promise<void> {
        logger.info("Creating admin user...");
        await auth
            .createUser({
                email: "admin@firetable.at",
                password: "ADMIN123",
                uid: generateFirestoreId(),
            })
            .then(function (userRecord) {
                return auth.setCustomUserClaims(userRecord.uid, {
                    role: AdminRole.ADMIN,
                });
            });
        logger.success("Admin user created");
    }

    async seedForOrganisation(
        organisation: OrganisationDoc,
        properties: PropertyDoc[],
    ): Promise<User[]> {
        const startTime = Date.now();
        const usersByOrg: Record<string, User[]> = {};

        const users: User[] = [];

        const roleCounts = {
            [Role.HOSTESS]: faker.number.int({ max: 15, min: 5 }),
            [Role.MANAGER]: faker.number.int({ max: 5, min: 2 }),
            [Role.PROPERTY_OWNER]: faker.number.int({ max: 3, min: 1 }),
            [Role.STAFF]: faker.number.int({ max: 30, min: 10 }),
        };

        Object.entries(roleCounts).forEach(([role, count]) => {
            for (let i = 0; i < count; i++) {
                let assignedProperties: string[];

                switch (role as Role) {
                    case Role.HOSTESS:
                    case Role.STAFF:
                        // Hostess and Staff get 1-3 properties
                        assignedProperties = faker.helpers.arrayElements(
                            properties.map(({ id }) => id),
                            { max: Math.min(3, properties.length), min: 1 },
                        );
                        break;
                    case Role.MANAGER:
                        // Managers get 50-100% of properties
                        assignedProperties = faker.helpers.arrayElements(
                            properties.map(({ id }) => id),
                            {
                                max: properties.length,
                                min: Math.ceil(properties.length * 0.5),
                            },
                        );
                        break;
                    case Role.PROPERTY_OWNER:
                        // Property owners sees all properties anyway
                        assignedProperties = [];
                        break;
                }

                const user = DataGenerator.generateUser(
                    organisation.id,
                    role as Role,
                    assignedProperties,
                    organisation.name,
                );
                users.push(user);
            }
        });

        usersByOrg[organisation.id] = users;
        await this.batchWrite(users, getUsersPath(organisation.id));

        const allUsers = Object.values(usersByOrg).flat();
        const authOperations = allUsers.map((user) =>
            auth
                .createUser({
                    displayName: user.name,
                    email: user.email,
                    password: "USER123",
                    uid: user.id,
                })
                .then((userRecord) =>
                    auth.setCustomUserClaims(userRecord.uid, {
                        organisationId: user.organisationId,
                        role: user.role,
                    }),
                ),
        );

        await Promise.all(authOperations);

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        logger.success(`Created ${users.length} users in ${duration}s`);
        return users;
    }
}
