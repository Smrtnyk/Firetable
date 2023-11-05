<script setup lang="ts">
import UserCreateForm from "src/components/admin/User/UserCreateForm.vue";
import UserEditForm from "src/components/admin/User/UserEditForm.vue";
import FTTitle from "src/components/FTTitle.vue";
import { showConfirm, showErrorMessage, withLoading } from "src/helpers/ui-helpers";
import { watch } from "vue";
import { Loading, useQuasar } from "quasar";
import FTDialog from "src/components/FTDialog.vue";
import { ADMIN, CreateUserPayload, EditUserPayload, User } from "@firetable/types";
import {
    createUserWithEmail,
    deleteUser,
    fetchOrganisationById,
    fetchOrganisationsForAdmin,
    updateUser,
} from "@firetable/backend";
import { usePropertiesStore } from "src/stores/usePropertiesStore";
import { useUsers } from "src/composables/useUsers";
import { useAuthStore } from "src/stores/auth-store";
import { useDialog } from "src/composables/useDialog";
import { useI18n } from "vue-i18n";
import FTCenteredText from "src/components/FTCenteredText.vue";

const { t } = useI18n();
const quasar = useQuasar();
const authStore = useAuthStore();
const propertiesStore = usePropertiesStore();
const { users, isLoading, fetchUsers } = useUsers();
const { createDialog } = useDialog();

const onCreateUser = withLoading(async (newUser: CreateUserPayload) => {
    await createUserWithEmail(newUser);
    await fetchUsers();
});

const onUpdateUser = withLoading(async (updatedUser: EditUserPayload) => {
    await updateUser(updatedUser);
    await fetchUsers();
});

const onDeleteUser = withLoading(async (user: User) => {
    await deleteUser(user);
    await fetchUsers();
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

function onCreateUserFormSubmit(newUser: CreateUserPayload): Promise<void | Promise<void>> | void {
    if (users.value.length > 150) {
        showErrorMessage(t("PageAdminUsers.maxAmountUsersCreationMessage", { limit: 150 }));
        return;
    }

    return onCreateUser(newUser);
}

async function showCreateUserDialog(): Promise<void> {
    const organisations =
        authStore.user!.role === ADMIN
            ? await fetchOrganisationsForAdmin()
            : [await fetchOrganisationById(authStore.user!.organisationId)];
    const properties = await propertiesStore.getPropertiesOfCurrentUser();
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: UserCreateForm,
            maximized: false,
            title: t("PageAdminUsers.createNewUserDialogTitle"),
            componentPropsObject: {
                properties,
                organisations,
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

async function showEditUserDialog(user: User, reset: () => void): Promise<void> {
    if (
        !(await showConfirm(t("PageAdminUsers.editUserConfirmationMessage", { name: user.name })))
    ) {
        reset();
        return;
    }
    const [properties, selectedProperties] = await Promise.all([
        propertiesStore.getPropertiesOfCurrentUser(),
        propertiesStore.getPropertiesOfUser(user),
    ]);
    const organisation = await fetchOrganisationById(user.organisationId);
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: UserEditForm,
            maximized: false,
            title: t("PageAdminUsers.editUserDialogTitle", { name: user.name }),
            componentPropsObject: {
                user: { ...user },
                properties,
                selectedProperties,
                organisation,
            },
            listeners: {
                submit: async (userPayload: CreateUserPayload) => {
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
    dialog.onDismiss(reset);
}

async function onUserSlideRight(user: User, reset: () => void): Promise<void> {
    if (await showConfirm("Delete user?")) {
        return onDeleteUser(user);
    }
    reset();
}
</script>

<template>
    <div class="PageAdminUsers">
        <FTTitle :title="t('PageAdminUsers.title')">
            <template #right>
                <q-btn rounded icon="plus" class="button-gradient" @click="showCreateUserDialog" />
            </template>
        </FTTitle>

        <q-list v-if="users.length && !isLoading">
            <q-slide-item
                v-for="user in users"
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
                    </q-item-section>
                </q-item>
            </q-slide-item>
        </q-list>

        <FTCenteredText v-if="users.length === 0 && !isLoading">
            {{ t("PageAdminUsers.noUsersCreatedMessage") }}
        </FTCenteredText>
    </div>
</template>
