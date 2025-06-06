<script setup lang="ts">
import type { User, VoidFunction } from "@firetable/types";

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
        return { color: "negative", text: "Never signed in" };
    }

    const now = Date.now();
    const daysSinceLastSignIn = (now - lastSignInTime) / (1000 * 60 * 60 * 24);

    if (daysSinceLastSignIn < 1) {
        return { color: "positive", text: "Active today" };
    } else if (daysSinceLastSignIn < 7) {
        return { color: "positive", text: "Active this week" };
    } else if (daysSinceLastSignIn < 30) {
        return { color: "warning", text: "Active this month" };
    }
    return {
        color: "grey",
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

function onUserSlideRight(user: BucketizedUser, reset: VoidFunction): void {
    emit("delete", user);
    reset();
}

function showEditUserDialog(user: BucketizedUser, reset: VoidFunction): void {
    emit("edit", user);
    reset();
}
</script>

<template>
    <q-list class="admin-users-list">
        <q-slide-item
            v-for="user in props.users"
            :key="user.id"
            right-color="negative"
            left-color="primary"
            @right="({ reset }) => onUserSlideRight(user, reset)"
            @left="({ reset }) => showEditUserDialog(user, reset)"
            class="user-slide-item ft-card"
        >
            <template #right>
                <div class="slide-action">
                    <q-icon name="fa fa-trash" size="20px" />
                    <div class="slide-action-text">Delete</div>
                </div>
            </template>

            <template #left>
                <div class="slide-action">
                    <q-icon name="fa fa-pencil" size="20px" />
                    <div class="slide-action-text">Edit</div>
                </div>
            </template>

            <q-item class="user-item">
                <q-item-section avatar>
                    <q-avatar
                        size="48px"
                        :color="getRoleColor(user.role)"
                        text-color="white"
                        class="user-avatar"
                    >
                        <div class="avatar-content">
                            {{ getUserInitials(user.name) }}
                        </div>
                    </q-avatar>
                </q-item-section>

                <q-item-section>
                    <q-item-label class="user-name">
                        {{ user.name }}
                        <q-badge
                            :color="getRoleColor(user.role)"
                            class="q-ml-sm role-badge"
                            v-if="user.role === Role.PROPERTY_OWNER"
                        >
                            Owner
                        </q-badge>
                    </q-item-label>

                    <q-item-label class="user-email">
                        <q-icon name="fa fa-envelope" size="12px" class="q-mr-xs" />
                        {{ user.email }}
                    </q-item-label>

                    <q-item-label caption class="user-meta">
                        <div class="meta-row" v-if="user.memberOf && user.memberOf.length > 0">
                            <q-icon name="fa fa-home" size="12px" class="q-mr-xs" />
                            <span>{{ user.memberOf.join(", ") }}</span>
                        </div>

                        <div class="meta-row">
                            <q-icon name="fa fa-clock" size="12px" class="q-mr-xs" />
                            <span :class="`text-${getLastSignInStatus(user.lastSignInTime).color}`">
                                {{ getLastSignInStatus(user.lastSignInTime).text }}
                            </span>
                        </div>
                    </q-item-label>
                </q-item-section>

                <q-item-section side>
                    <q-icon name="fa fa-chevron-left" size="12px" color="grey-5" />
                </q-item-section>
            </q-item>
        </q-slide-item>
    </q-list>
</template>

<style scoped lang="scss">
.admin-users-list {
    padding: 0;

    .user-slide-item {
        margin-bottom: 8px;

        &:last-child {
            margin-bottom: 0;
        }

        .slide-action {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding: 0 24px;

            .slide-action-text {
                font-size: 12px;
                margin-top: 4px;
                font-weight: 500;
            }
        }
    }

    .user-item {
        padding: 16px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        transition: all 0.2s ease;

        .body--dark & {
            background: var(--q-dark);
            box-shadow: 0 1px 3px rgba(255, 255, 255, 0.05);
        }

        &:active {
            transform: scale(0.98);
        }

        .user-avatar {
            position: relative;

            .avatar-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 16px;
                line-height: 1;
            }
        }

        .user-name {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 4px;
            display: flex;
            align-items: center;

            .role-badge {
                font-size: 10px;
                padding: 2px 6px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
        }

        .user-email {
            font-size: 14px;
            margin-bottom: 8px;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            display: flex;
            align-items: center;
        }

        .user-meta {
            .meta-row {
                display: flex;
                align-items: center;
                margin-bottom: 4px;
                font-size: 12px;

                &:last-child {
                    margin-bottom: 0;
                }

                q-icon {
                    opacity: 0.6;
                }
            }
        }
    }
}
</style>
