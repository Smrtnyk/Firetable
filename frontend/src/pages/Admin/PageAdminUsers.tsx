import UserCreateForm from "src/components/User/UserCreateForm";
import { FTTitle } from "src/components/FTTitle";

import {
    showConfirm,
    showErrorMessage,
    tryCatchLoadingWrapper,
} from "src/helpers/ui-helpers";
import { computed, defineComponent, ref } from "vue";
import { createUserWithEmail, deleteUser } from "src/services/firebase/auth";
import { config } from "src/config";
import { useFirestore } from "src/composables/useFirestore";

import {
    QBtn,
    QIcon,
    QList,
    QItem,
    QSlideItem,
    QItemSection,
    QItemLabel,
} from "quasar";
import { Collection } from "src/types/firebase";
import { CreateUserPayload, User } from "src/types/auth";
import { FloorDoc } from "src/types/floor";
import { useAuthStore } from "src/stores/auth-store";

const { maxNumOfUsers } = config;

export default defineComponent({
    name: "PageAdminUsers",

    components: {
        FTTitle,
        UserCreateForm,
        QBtn,
        QIcon,
        QList,
        QItem,
        QSlideItem,
        QItemSection,
        QItemLabel,
    },

    setup() {
        const authStore = useAuthStore();
        const showCreateUserForm = ref(false);

        const floorsMaps = computed(() => floors.value.map(({ name }) => name));
        const usersStatus = computed(() => {
            return {
                totalUsers: users.value.length,
                maxUsers: maxNumOfUsers,
            };
        });

        const { data: users } = useFirestore<User>({
            type: "watch",
            queryType: "collection",
            path: Collection.USERS,
        });

        const { data: floors } = useFirestore<FloorDoc>({
            type: "get",
            queryType: "collection",
            path: Collection.FLOORS,
        });

        async function onCreateUser(newUser: CreateUserPayload) {
            if (users.value.length > maxNumOfUsers) {
                showErrorMessage(
                    "You have reached the maximum amount of users!"
                );
                return;
            }

            await tryCatchLoadingWrapper(async () => {
                await createUserWithEmail(newUser);
                showCreateUserForm.value = false;
            });
        }

        async function onUserSlideRight({ id }: User, reset: () => void) {
            if (await showConfirm("Delete user?")) {
                await tryCatchLoadingWrapper(() => deleteUser(id));
                return;
            }

            reset();
        }

        return () => (
            <div class="PageAdminUsers">
                <f-t-title title="Users">
                    {{
                        right: () => (
                            <q-btn
                                rounded
                                icon="plus"
                                class="button-gradient"
                                onClick={
                                    authStore.toggleCreateUserDialogVisibility
                                }
                                label="new user"
                            />
                        ),
                        default: () => (
                            <div>
                                <span>{usersStatus.value.totalUsers}</span> /
                                <span> {usersStatus.value.maxUsers}</span>
                            </div>
                        ),
                    }}
                </f-t-title>

                {!!floorsMaps.value.length && (
                    <user-create-form
                        floors={floorsMaps.value}
                        onClose={() => (showCreateUserForm.value = false)}
                        onSubmit={onCreateUser}
                    />
                )}

                {!!users.value.length && (
                    <q-list>
                        {users.value.map((user) => (
                            <q-slide-item
                                key={user.id}
                                right-color="warning"
                                onRight={({ reset }: any) =>
                                    onUserSlideRight(user, reset)
                                }
                                class="fa-card"
                            >
                                {{
                                    right: () => <q-icon name="trash" />,
                                    default: () => (
                                        <q-item clickable class="ft-card">
                                            <q-item-section>
                                                <q-item-label>
                                                    {user.name} -{user.email}
                                                </q-item-label>
                                                <q-item-label caption>
                                                    ROLE: {user.role}
                                                </q-item-label>
                                            </q-item-section>
                                        </q-item>
                                    ),
                                }}
                            </q-slide-item>
                        ))}
                    </q-list>
                )}
            </div>
        );
    },
});
