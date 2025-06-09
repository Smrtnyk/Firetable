<script setup lang="ts">
import type { CreateUserPayload, EditUserPayload, PropertyDoc, User } from "@firetable/types";
import type { BucketizedUser, BucketizedUsers } from "src/components/admin/user/AdminUsersList.vue";

import { Role } from "@firetable/types";
import { useAsyncState } from "@vueuse/core";
import { matchesProperty } from "es-toolkit/compat";
import AdminUsersList from "src/components/admin/user/AdminUsersList.vue";
import UserCreateForm from "src/components/admin/user/UserCreateForm.vue";
import UserEditForm from "src/components/admin/user/UserEditForm.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTTitle from "src/components/FTTitle.vue";
import { globalDialog } from "src/composables/useDialog";
import { createUserWithEmail, deleteUser, fetchUsersByRole, updateUser } from "src/db";
import { showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useAuthStore } from "src/stores/auth-store";
import { useGlobalStore } from "src/stores/global-store";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed, onBeforeMount, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

export interface PageAdminUsersProps {
    organisationId: string;
}

const props = defineProps<PageAdminUsersProps>();

const { t } = useI18n();
const router = useRouter();
const globalStore = useGlobalStore();
const authStore = useAuthStore();
const propertiesStore = usePropertiesStore();

const {
    execute: executeFetchUsers,
    isLoading,
    state: users,
} = useAsyncState(() => fetchUsersByRole(props.organisationId), [], {
    immediate: true,
    onError: showErrorMessage,
});

const activeTab = ref(0);

const organisation = computed(function () {
    return propertiesStore.getOrganisationById(props.organisationId);
});

const unassignedUsers = computed(function () {
    return users.value.filter(function (user) {
        return user.relatedProperties.length === 0 && user.role !== Role.PROPERTY_OWNER;
    });
});

const bucketizedUsers = computed<BucketizedUsers>(function () {
    const buckets: BucketizedUsers = {};

    function addUserToBucket(bucketizedUser: BucketizedUser, property: PropertyDoc): void {
        bucketizedUser.memberOf?.push(property.name);
        buckets[property.id] ??= { propertyName: property.name, users: [] };
        buckets[property.id].users.push(bucketizedUser);
    }

    users.value.forEach(function (user) {
        const bucketizedUser: BucketizedUser = { ...user, memberOf: [] };

        // If user is property owner, add them to all buckets
        if (bucketizedUser.role === Role.PROPERTY_OWNER) {
            properties.value.forEach(function (property) {
                buckets[property.id] ??= { propertyName: property.name, users: [] };
                buckets[property.id].users.push(bucketizedUser);
            });
            return;
        }

        bucketizedUser.relatedProperties.forEach(function (propertyId) {
            const property = findPropertyById(propertyId);
            if (property) {
                addUserToBucket(bucketizedUser, property);
            }
        });
    });

    return buckets;
});

const properties = computed(function () {
    return propertiesStore.getPropertiesByOrganisationId(props.organisationId);
});

function findPropertyById(propertyId: string): PropertyDoc | undefined {
    return properties.value.find(matchesProperty("id", propertyId));
}

async function onDeleteUser(user: User): Promise<void> {
    if (user.id === authStore.user?.id) {
        showErrorMessage(t("PageAdminUsers.cannotDeleteSelfError"));
        return;
    }

    await tryCatchLoadingWrapper({
        async hook() {
            await deleteUser(user);
            await executeFetchUsers();
        },
    });
}

async function onUpdateUser(updatedUser: EditUserPayload): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            await updateUser(updatedUser);
            await executeFetchUsers();
            globalStore.notify(t("PageAdminUsers.userUpdatedSuccess"));
        },
    });
}

onBeforeMount(function () {
    if (!props.organisationId) {
        router.replace("/");
    }
});

onUnmounted(function () {
    globalStore.setLoading(false);
});

watch(
    isLoading,
    function (loading) {
        if (loading) {
            globalStore.setLoading(true);
        } else {
            globalStore.setLoading(false);
        }
    },
    { immediate: true },
);

async function onCreateUserFormSubmit(newUser: CreateUserPayload): Promise<void> {
    if (users.value.length > 150) {
        showErrorMessage(t("PageAdminUsers.maxAmountUsersCreationMessage", { limit: 150 }));
        return;
    }

    await tryCatchLoadingWrapper({
        async hook() {
            await createUserWithEmail(newUser);
            await executeFetchUsers();
        },
    });
}

async function onUserSlideRight(user: User): Promise<void> {
    if (
        await globalDialog.confirm({
            message: "",
            title: t("PageAdminUsers.deleteUserConfirmTitle"),
        })
    ) {
        await onDeleteUser(user);
    }
}

function showCreateUserDialog(): void {
    const dialog = globalDialog.openDialog(
        UserCreateForm,
        {
            onSubmit(userPayload: CreateUserPayload) {
                onCreateUserFormSubmit(userPayload);
                dialog.hide();
            },
            organisation: organisation.value,
            properties: properties.value,
        },
        {
            title: t("PageAdminUsers.createNewUserDialogTitle"),
        },
    );
}

async function showEditUserDialog(user: User): Promise<void> {
    if (user.id === authStore.user?.id) {
        showErrorMessage(t("PageAdminUsers.editSelfError"));
        return;
    }
    if (
        !(await globalDialog.confirm({
            message: "",
            title: t("PageAdminUsers.editUserConfirmationMessage", { name: user.name }),
        }))
    ) {
        return;
    }
    const selectedProperties = properties.value.filter(function (ownProperty) {
        return user.relatedProperties.includes(ownProperty.id);
    });
    const dialog = globalDialog.openDialog(
        UserEditForm,
        {
            async onSubmit(userPayload: EditUserPayload["updatedUser"]) {
                await onUpdateUser({
                    organisationId: userPayload.organisationId,
                    updatedUser: userPayload,
                    userId: userPayload.id,
                });

                dialog.hide();
            },
            organisation: organisation.value,
            properties: properties.value,
            selectedProperties,
            user: { ...user },
        },
        {
            title: t("PageAdminUsers.editUserDialogTitle", { name: user.name }),
        },
    );
}

const uniqueUsersCount = computed(() => users.value.length);
</script>

<template>
    <div class="PageAdminUsers">
        <FTTitle :title="`${t('PageAdminUsers.title')} (${uniqueUsersCount})`">
            <template #right>
                <FTBtn
                    aria-label="Add user button"
                    rounded
                    icon="fa fa-plus"
                    color="primary"
                    @click="showCreateUserDialog"
                />
            </template>
        </FTTitle>

        <template v-if="unassignedUsers.length > 0">
            <FTCenteredText>
                {{ t("PageAdminUsers.unassignedUsersTitle", { count: unassignedUsers.length }) }}
            </FTCenteredText>
            <AdminUsersList
                @edit="showEditUserDialog"
                @delete="onUserSlideRight"
                :users="unassignedUsers"
                class="mb-4"
            />
        </template>

        <!-- Users Assigned to Properties -->
        <div v-if="Object.keys(bucketizedUsers).length > 0 && !isLoading">
            <template v-if="Object.keys(bucketizedUsers).length > 1">
                <!-- Multiple properties: Show tabs -->
                <v-tabs v-model="activeTab" align-tabs="start">
                    <v-tab
                        v-for="(bucket, index) in Object.values(bucketizedUsers)"
                        :key="bucket.propertyName"
                        :value="index"
                    >
                        {{
                            t("PageAdminUsers.propertyUserCountTabLabel", {
                                propertyName: bucket.propertyName,
                                count: bucket.users.length,
                            })
                        }}
                    </v-tab>
                </v-tabs>

                <v-window v-model="activeTab" class="bg-transparent mt-4">
                    <v-window-item
                        v-for="(bucket, index) in Object.values(bucketizedUsers)"
                        :key="bucket.propertyName"
                        :value="index"
                        class="pa-0"
                    >
                        <AdminUsersList
                            @edit="showEditUserDialog"
                            @delete="onUserSlideRight"
                            :users="bucket.users"
                        />
                    </v-window-item>
                </v-window>
            </template>
            <template v-else>
                <!-- Single property: Show users without tabs -->
                <AdminUsersList
                    @edit="showEditUserDialog"
                    @delete="onUserSlideRight"
                    :users="Object.values(bucketizedUsers)[0].users"
                />
            </template>
        </div>

        <!-- Show no properties message if no properties are created -->
        <FTCenteredText v-if="properties.length === 0">
            {{ t("PageAdminUsers.createPropertiesPrompt") }}
        </FTCenteredText>

        <FTCenteredText v-else-if="Object.keys(bucketizedUsers).length === 0 && !isLoading">
            {{ t("PageAdminUsers.noUsersCreatedMessage") }}
        </FTCenteredText>
    </div>
</template>
