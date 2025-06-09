<script setup lang="ts">
import type { User } from "@firetable/types";

import { Role } from "@firetable/types";
import { formatEventDate, getDefaultTimezone } from "src/helpers/date-utils";
import { useI18n } from "vue-i18n";

export type BucketizedUser = User & { memberOf?: string[] };

export interface BucketizedUsers {
    [propertyId: string]: {
        propertyName: string;
        users: BucketizedUser[];
    };
}
interface Props {
    users: BucketizedUser[];
}

const { locale } = useI18n();
const props = defineProps<Props>();
const emit = defineEmits<(e: "delete" | "edit", value: User) => void>();

function getLastSignInStatus(lastSignInTime: null | number | undefined): {
    color: string;
    text: string;
} {
    if (!lastSignInTime) {
        return { color: "error", text: "Never signed in" };
    }

    const now = Date.now();
    const daysSinceLastSignIn = (now - lastSignInTime) / (1000 * 60 * 60 * 24);

    if (daysSinceLastSignIn < 1) {
        return { color: "success", text: "Active today" };
    } else if (daysSinceLastSignIn < 7) {
        return { color: "success", text: "Active this week" };
    } else if (daysSinceLastSignIn < 30) {
        return { color: "warning", text: "Active this month" };
    }
    return {
        color: "grey-darken-1",
        text: formatEventDate(lastSignInTime, locale.value, getDefaultTimezone()),
    };
}

function getRoleColor(role: Role): string {
    switch (role) {
        case Role.MANAGER:
            return "secondary";
        case Role.PROPERTY_OWNER:
            return "primary";
        default:
            return "grey";
    }
}

function getUserInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function onDeleteUser(user: BucketizedUser): void {
    emit("delete", user);
}

function onEditUser(user: BucketizedUser): void {
    emit("edit", user);
}
</script>

<template>
    <v-list class="admin-users-list" lines="three">
        <v-list-item
            v-for="user in props.users"
            :key="user.id"
            class="user-item ft-card mb-2"
            elevation="1"
        >
            <template #prepend>
                <v-avatar size="48" :color="getRoleColor(user.role)" class="user-avatar me-3">
                    <span class="text-white font-weight-bold">{{
                        getUserInitials(user.name)
                    }}</span>
                </v-avatar>
            </template>

            <v-list-item-title class="user-name font-weight-bold text-h6 mb-1">
                {{ user.name }}
                <v-chip
                    :color="getRoleColor(user.role)"
                    size="small"
                    class="ms-2 role-badge"
                    label
                    v-if="user.role === Role.PROPERTY_OWNER"
                >
                    Owner
                </v-chip>
            </v-list-item-title>

            <v-list-item-subtitle class="user-email mb-2">
                <v-icon icon="fas fa-envelope" size="x-small" class="me-1" />
                {{ user.email }}
            </v-list-item-subtitle>

            <div class="user-meta text-caption">
                <div
                    class="meta-row d-flex align-center mb-1"
                    v-if="user.memberOf && user.memberOf.length > 0"
                >
                    <v-icon icon="fas fa-home" size="x-small" class="me-1" />
                    <span>{{ user.memberOf.join(", ") }}</span>
                </div>
                <div class="meta-row d-flex align-center">
                    <v-icon icon="fas fa-clock" size="x-small" class="me-1" />
                    <span :class="`text-${getLastSignInStatus(user.lastSignInTime).color}`">
                        {{ getLastSignInStatus(user.lastSignInTime).text }}
                    </span>
                </div>
            </div>

            <template #append>
                <div class="d-flex flex-column ga-1">
                    <v-btn
                        icon="fas fa-pencil"
                        variant="text"
                        size="small"
                        color="primary"
                        @click="onEditUser(user)"
                    >
                        <v-tooltip activator="parent" location="top">Edit</v-tooltip>
                    </v-btn>
                    <v-btn
                        icon="fas fa-trash"
                        variant="text"
                        size="small"
                        color="error"
                        @click="onDeleteUser(user)"
                    >
                        <v-tooltip activator="parent" location="bottom">Delete</v-tooltip>
                    </v-btn>
                </div>
            </template>
        </v-list-item>
    </v-list>
</template>

<style scoped lang="scss">
.admin-users-list {
    .user-item {
        border-radius: 8px;

        .user-avatar {
            .avatar-content {
                font-weight: 600;
                font-size: 16px;
                line-height: 1;
            }
        }

        .user-name {
            display: flex;
            align-items: center;

            .role-badge {
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
        }

        .user-email {
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            display: flex;
            align-items: center;
        }

        .user-meta {
            .meta-row {
                &:last-child {
                    margin-bottom: 0;
                }

                .v-icon {
                    opacity: 0.7;
                }
            }
        }
    }
}
</style>
