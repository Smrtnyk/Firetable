<script setup lang="ts">
import UserCreateForm from "components/admin/User/UserCreateForm.vue";
import UserEditForm from "components/admin/User/UserEditForm.vue";
import FTTitle from "components/FTTitle.vue";
import { showConfirm, showErrorMessage, withLoading } from "src/helpers/ui-helpers";
import { watch } from "vue";
import { Loading } from "quasar";
import FTDialog from "components/FTDialog.vue";
import { ADMIN, CreateUserPayload, EditUserPayload, User } from "@firetable/types";
import {
    createUserWithEmail,
    deleteUser,
    fetchOrganisationById,
    fetchOrganisationsForAdmin,
    updateUser,
} from "@firetable/backend";
import { usePropertiesStore } from "stores/usePropertiesStore";
import { useAdminUsers } from "src/composables/useAdminUsers";
import { useAuthStore } from "stores/auth-store";
import { useDialog } from "src/composables/useDialog";

const authStore = useAuthStore();
const propertiesStore = usePropertiesStore();
const { users, isLoading, fetchUsers } = useAdminUsers();
const { createDialog } = useDialog();

const onCreateUser = withLoading(async (newUser: CreateUserPayload) => {
    await createUserWithEmail(newUser);
    await fetchUsers();
});

const onUpdateUser = withLoading(async (updatedUser: EditUserPayload) => {
    await updateUser(updatedUser);
    await fetchUsers();
});

const onDeleteUser = withLoading(async (id: string) => {
    await deleteUser(id);
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

function onCreateUserFormSubmit(newUser: CreateUserPayload) {
    if (users.value.length > 150) {
        showErrorMessage(`You have reached the maximum amount of users which is ${150}!`);
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
            title: "Create new user",
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

async function showEditUserDialog(user: User, reset: () => void) {
    if (!(await showConfirm(`Are you sure you want to edit user ${user.name}?`, ""))) {
        reset();
        return;
    }
    const [properties, selectedProperties] = await Promise.all([
        propertiesStore.getPropertiesOfCurrentUser(),
        propertiesStore.getPropertiesOfUser(user.id),
    ]);
    const organisation = await fetchOrganisationById(user.organisationId);
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: UserEditForm,
            maximized: false,
            title: `Editing user: ${user.name}`,
            componentPropsObject: {
                user: { ...user },
                properties,
                selectedProperties,
                organisation,
            },
            listeners: {
                submit: (user: CreateUserPayload) => {
                    onUpdateUser({ userId: user.id, updatedUser: user })
                        .then(reset)
                        .catch(showErrorMessage);
                    dialog.hide();
                },
            },
        },
    });
}

async function onUserSlideRight(id: string, reset: () => void) {
    if (await showConfirm("Delete user?")) {
        return onDeleteUser(id);
    }
    reset();
}
</script>

<template>
    <div class="PageAdminUsers">
        <FTTitle title="Users">
            <template #right>
                <q-btn rounded icon="plus" class="button-gradient" @click="showCreateUserDialog" />
            </template>
        </FTTitle>

        <q-list v-if="users.length && !isLoading">
            <q-slide-item
                v-for="user in users"
                :key="user.id"
                right-color="warning"
                @right="({ reset }) => onUserSlideRight(user.id, reset)"
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

        <div
            v-if="users.length === 0 && !isLoading"
            class="row justify-center items-center q-mt-md"
        >
            <h6 class="q-ma-sm text-weight-bolder underline">There are no users created.</h6>
        </div>
    </div>
</template>
