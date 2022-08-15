<script setup lang="ts">
import FTTitle from "components/FTTitle.vue";
import FTDialog from "components/FTDialog.vue";
import AddNewRoleForm from "components/admin/roles/AddNewRoleForm.vue";

import { arrayUnion, arrayRemove } from "firebase/firestore";
import { useFirestoreDoc } from "src/composables/useFirestoreDoc";
import { RoleDoc } from "src/types/roles";
import { useQuasar } from "quasar";
import { loadingWrapper, showConfirm } from "src/helpers/ui-helpers";
import { ROLES_PATH } from "@firetable/backend";

const quasar = useQuasar();
const { data: rolesDoc, updateDoc } = useFirestoreDoc<RoleDoc>({
    type: "watch",
    path: ROLES_PATH,
});

const onRoleCreate = loadingWrapper((newRoleName: string) => {
    return updateDoc({
        // @ts-ignore roles is an array but here it is a FieldValue, should be fine
        roles: arrayUnion(newRoleName),
    });
});

const onDeleteRole = loadingWrapper((roleNameToDelete: string) => {
    return updateDoc({
        // @ts-ignore roles is an array but here it is a FieldValue, should be fine
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
