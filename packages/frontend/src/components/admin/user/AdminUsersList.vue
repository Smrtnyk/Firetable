<script setup lang="ts">
import type { User, VoidFunction } from "@firetable/types";

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
    <q-list>
        <q-slide-item
            v-for="user in props.users"
            :key="user.id"
            right-color="warning"
            @right="({ reset }) => onUserSlideRight(user, reset)"
            @left="({ reset }) => showEditUserDialog(user, reset)"
            class="fa-card"
        >
            <template #right>
                <q-icon name="trash" />
            </template>

            <template #left>
                <q-icon name="pencil" />
            </template>

            <q-item clickable class="ft-card">
                <q-item-section>
                    <q-item-label> {{ user.name }} - {{ user.email }} </q-item-label>
                    <q-item-label caption> Role: {{ user.role }} </q-item-label>
                    <q-item-label caption v-if="user.memberOf && user.memberOf.length > 0">
                        Member of: {{ user.memberOf.join(", ") }}
                    </q-item-label>
                    <q-item-label caption v-if="user.lastSignInTime">
                        Last sign-in:
                        {{ formatEventDate(user.lastSignInTime, locale, getDefaultTimezone()) }}
                    </q-item-label>
                </q-item-section>
            </q-item>
        </q-slide-item>
    </q-list>
</template>
