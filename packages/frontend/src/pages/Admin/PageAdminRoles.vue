<script setup lang="ts">
import FTTitle from "components/FTTitle.vue";
import FTDialog from "components/FTDialog.vue";
import AddNewRoleForm from "components/admin/roles/AddNewRoleForm.vue";

import { RoleDoc } from "src/types/roles";
import { useQuasar } from "quasar";
import { loadingWrapper, showConfirm } from "src/helpers/ui-helpers";
import { ROLES_PATH } from "@firetable/backend";
import {
    getFirestoreDocument,
    updateFirestoreDocument,
    useFirestoreDocument,
} from "src/composables/useFirestore";
import { arrayUnion, arrayRemove } from "firebase/firestore";

const quasar = useQuasar();
const rolesDoc = useFirestoreDocument<RoleDoc>(ROLES_PATH);

const onRoleCreate = loadingWrapper((newRoleName: string) => {
    return updateFirestoreDocument(getFirestoreDocument(ROLES_PATH), {
        roles: arrayUnion(newRoleName),
    });
});

const onDeleteRole = loadingWrapper((roleNameToDelete: string) => {
    return updateFirestoreDocument(getFirestoreDocument(ROLES_PATH), {
        roles: arrayRemove(roleNameToDelete),
    });
});

async function deleteRole(roleNameToDelete: string): Promise<void> {
    if (await showConfirm("Delete Role?")) {
        return onDeleteRole(roleNameToDelete);
    }
}

function createRole(): void {
    quasar.dialog({
        component: FTDialog,
        componentProps: {
            title: "Add new Role",
            maximized: false,
            component: AddNewRoleForm,
            componentPropsObject: {},
            listeners: {
                create: onRoleCreate,
            },
        },
    });
}
</script>

<template>
    <div>
        <FTTitle title="Roles">
            <template #right>
                <q-btn
                    rounded
                    icon="plus"
                    class="button-gradient"
                    @click="createRole"
                    label="Add new role"
                />
            </template>
        </FTTitle>
        <q-list v-if="rolesDoc">
            <q-slide-item
                v-for="role in rolesDoc.roles"
                :key="role"
                right-color="warning"
                @right="() => deleteRole(role)"
                class="fa-card"
            >
                <template #right>
                    <q-icon name="trash" />
                </template>

                <q-item clickable class="ft-card">
                    <q-item-section>
                        <q-item-label> {{ role }}</q-item-label>
                    </q-item-section>
                </q-item>
            </q-slide-item>
        </q-list>
    </div>
</template>
