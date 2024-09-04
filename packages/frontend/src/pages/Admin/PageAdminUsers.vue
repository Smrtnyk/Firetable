<script setup lang="ts">
import type { CreateUserPayload, EditUserPayload, User } from "@firetable/types";
import type { BucketizedUser, BucketizedUsers } from "src/components/admin/user/AdminUsersList.vue";
import { Role } from "@firetable/types";

import UserCreateForm from "src/components/admin/user/UserCreateForm.vue";
import UserEditForm from "src/components/admin/user/UserEditForm.vue";
import FTTitle from "src/components/FTTitle.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTDialog from "src/components/FTDialog.vue";
import AdminUsersList from "src/components/admin/user/AdminUsersList.vue";
import FTTabs from "src/components/FTTabs.vue";
import FTTabPanels from "src/components/FTTabPanels.vue";

import { showConfirm, showErrorMessage, withLoading } from "src/helpers/ui-helpers";
import { computed, onBeforeMount, onUnmounted, ref, watch } from "vue";
import { Loading, useQuasar } from "quasar";
import { createUserWithEmail, deleteUser, updateUser } from "@firetable/backend";
import { usePropertiesStore } from "src/stores/properties-store";
import { useUsers } from "src/composables/useUsers";
import { useAuthStore } from "src/stores/auth-store";
import { useDialog } from "src/composables/useDialog";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const props = defineProps<{ organisationId: string }>();

const { t } = useI18n();
const router = useRouter();
const quasar = useQuasar();
const authStore = useAuthStore();
const propertiesStore = usePropertiesStore();

const { users, isLoading, fetchUsers } = useUsers(props.organisationId);
const { createDialog } = useDialog();

const activeTab = ref(0);

const organisation = computed(() => {
    return propertiesStore.getOrganisationById(props.organisationId);
});

const unassignedUsers = computed(() => {
    return users.value.filter((user) => {
        return user.relatedProperties.length === 0 && user.role !== Role.PROPERTY_OWNER;
    });
});

const bucketizedUsers = computed((): BucketizedUsers => {
    const buckets: BucketizedUsers = {};
    users.value.forEach((user) => {
        const bucketizedUser: BucketizedUser = { ...user, memberOf: [] };
        // if user is property owner, then add it to all buckets
        // it needs to be added to all buckets because it must be a member of all properties
        if (bucketizedUser.role === Role.PROPERTY_OWNER) {
            properties.value.forEach(function (property) {
                if (!buckets[property.id]) {
                    buckets[property.id] = { propertyName: property.name, users: [] };
                }
                buckets[property.id].users.push(bucketizedUser);
            });
            return;
        }

        bucketizedUser.relatedProperties.forEach(function (propertyId) {
            const property = properties.value.find(function ({ id }) {
                return id === propertyId;
            });
            if (property) {
                bucketizedUser.memberOf?.push(property.name);
                if (!buckets[propertyId]) {
                    buckets[propertyId] = { propertyName: property.name, users: [] };
                }
                buckets[propertyId].users.push(bucketizedUser);
            }
        });
    });
    return buckets;
});

const properties = computed(() => {
    return propertiesStore.getPropertiesByOrganisationId(props.organisationId);
});

const onCreateUser = withLoading(async (newUser: CreateUserPayload) => {
    await createUserWithEmail(newUser);
    await fetchUsers();
});

const onUpdateUser = withLoading(async (updatedUser: EditUserPayload) => {
    await updateUser(updatedUser);
    await fetchUsers();
});

const onDeleteUser = withLoading(async (user: User) => {
    if (user.id === authStore.user?.id) {
        showErrorMessage("You cannot delete yourself!");
        return;
    }
    await deleteUser(user);
    await fetchUsers();
});

onBeforeMount(() => {
    if (!props.organisationId) {
        router.replace("/");
    }
});

onUnmounted(() => {
    if (Loading.isActive) {
        Loading.hide();
    }
});

watch(
    isLoading,
    (loading) => {
        if (loading) {
            Loading.show();
        } else {
            Loading.hide();
        }
    },
    { immediate: true },
);

function onCreateUserFormSubmit(
    newUser: CreateUserPayload,
): Promise<void | Promise<void>> | undefined {
    if (users.value.length > 150) {
        showErrorMessage(t("PageAdminUsers.maxAmountUsersCreationMessage", { limit: 150 }));
        return undefined;
    }

    return onCreateUser(newUser);
}

async function showCreateUserDialog(): Promise<void> {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: UserCreateForm,
            maximized: false,
            title: t("PageAdminUsers.createNewUserDialogTitle"),
            componentPropsObject: {
                properties: properties.value,
                organisation: organisation.value,
            },
            listeners: {
                submit: function (userPayload: CreateUserPayload) {
                    onCreateUserFormSubmit(userPayload);
                    dialog.hide();
                },
            },
        },
    });
}

async function showEditUserDialog(user: User): Promise<void> {
    if (user.id === authStore.user?.id) {
        showErrorMessage("To edit your profile, go to profile page!");
        return;
    }
    if (
        !(await showConfirm(t("PageAdminUsers.editUserConfirmationMessage", { name: user.name })))
    ) {
        return;
    }
    const selectedProperties = properties.value.filter((ownProperty) => {
        return user.relatedProperties.includes(ownProperty.id);
    });
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: UserEditForm,
            maximized: false,
            title: t("PageAdminUsers.editUserDialogTitle", { name: user.name }),
            componentPropsObject: {
                user: { ...user },
                properties: properties.value,
                selectedProperties,
                organisation: organisation.value,
            },
            listeners: {
                submit: async (userPayload: EditUserPayload["updatedUser"]) => {
                    await onUpdateUser({
                        userId: userPayload.id,
                        organisationId: userPayload.organisationId,
                        updatedUser: userPayload,
                    });
                    quasar.notify("User updated successfully!");
                    dialog.hide();
                },
            },
        },
    });
}

async function onUserSlideRight(user: User): Promise<void> {
    if (await showConfirm("Delete user?")) {
        await onDeleteUser(user);
    }
}
</script>

<template>
    <div class="PageAdminUsers">
        <FTTitle :title="t('PageAdminUsers.title')">
            <template #right>
                <q-btn rounded icon="plus" class="button-gradient" @click="showCreateUserDialog" />
            </template>
        </FTTitle>

        <template v-if="unassignedUsers.length > 0">
            <FTCenteredText> Unassigned users ({{ unassignedUsers.length }}) </FTCenteredText>
            <AdminUsersList
                @edit="showEditUserDialog"
                @delete="onUserSlideRight"
                :users="unassignedUsers"
                class="q-mb-md"
            />
        </template>

        <div v-if="Object.keys(bucketizedUsers).length > 0 && !isLoading">
            <FTTabs v-model="activeTab">
                <q-tab
                    v-for="(bucket, index) in Object.values(bucketizedUsers)"
                    :key="bucket.propertyName"
                    :name="index"
                    :label="`${bucket.propertyName} (${bucket.users.length})`"
                />
            </FTTabs>

            <FTTabPanels v-model="activeTab">
                <q-tab-panel
                    v-for="(bucket, index) in Object.values(bucketizedUsers)"
                    :key="bucket.propertyName"
                    :name="index"
                >
                    <AdminUsersList
                        @edit="showEditUserDialog"
                        @delete="onUserSlideRight"
                        :users="bucket.users"
                    />
                </q-tab-panel>
            </FTTabPanels>
        </div>

        <!-- Show no properties message if no properties are created -->
        <FTCenteredText v-if="properties.length === 0">
            In order to list users, create some properties first
        </FTCenteredText>

        <FTCenteredText v-else-if="Object.keys(bucketizedUsers).length === 0 && !isLoading">
            {{ t("PageAdminUsers.noUsersCreatedMessage") }}
        </FTCenteredText>
    </div>
</template>
