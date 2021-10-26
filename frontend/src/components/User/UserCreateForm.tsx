import { ACTIVITY_STATUS, Role, CreateUserPayload } from "src/types/auth";
import { defineComponent, PropType, ref, withDirectives } from "vue";
import { noEmptyString } from "src/helpers/form-rules";
import { PROJECT_MAIL } from "src/config";
import {
    ClosePopup,
    QCard,
    QBanner,
    QForm,
    QInput,
    QBtn,
    QSelect,
    QIcon,
    QDialog,
} from "quasar";
import { useAuthStore } from "src/stores/auth-store";

const user: CreateUserPayload = {
    id: "",
    name: "",
    email: "",
    password: "",
    floors: [],
    role: Role.WAITER,
    status: ACTIVITY_STATUS.OFFLINE,
};

export default defineComponent({
    name: "UserCreateForm",

    components: {
        QCard,
        QBanner,
        QForm,
        QInput,
        QBtn,
        QSelect,
        QIcon,
        QDialog,
    },

    emits: ["submit"],

    props: {
        floors: {
            type: Array as PropType<string[]>,
            required: true,
        },
    },

    setup(props, { emit }) {
        const authStore = useAuthStore();
        const form = ref<CreateUserPayload>({ ...user });

        const stringRules = [noEmptyString()];

        const roles = Object.values(Role);

        function onSubmit() {
            form.value.email = form.value.email + PROJECT_MAIL;
            emit("submit", form.value);
        }

        function onReset() {
            form.value = { ...user };
        }

        return () => (
            <div class="UserCreateForm">
                <q-dialog
                    model-value={authStore.showCreateUserDialog}
                    {...{
                        "onUpdate:model-value":
                            authStore.toggleCreateUserDialogVisibility,
                    }}
                    maximized
                >
                    <q-card>
                        <q-banner
                            inline-actions
                            rounded
                            class="bg-gradient text-white"
                        >
                            {{
                                avatar: () =>
                                    withDirectives(
                                        <q-btn
                                            round
                                            class="q-mr-sm"
                                            flat
                                            icon="close"
                                        />,
                                        [[ClosePopup]]
                                    ),
                                default: () => "Create new user",
                            }}
                        </q-banner>
                        <q-form
                            class="q-gutter-md q-pt-md q-pa-md"
                            onSubmit={onSubmit}
                            onReset={onReset}
                        >
                            <q-input
                                v-model={form.value.name}
                                standout
                                rounded
                                label="Fill name *"
                                hint="Name of the person, e.g. Max Mustermann"
                                lazy-rules
                                rules={stringRules}
                            />

                            <q-input
                                v-model={form.value.email}
                                standout
                                rounded
                                label="Username *"
                                hint="Username without spaces and special charactes, e.g. max123"
                                rules={stringRules}
                            />

                            <q-input
                                v-model={form.value.password}
                                standout
                                rounded
                                label="User password *"
                                hint="Password of the user"
                                lazy-rules
                                rules={stringRules}
                            >
                                {{
                                    prepend: () => <q-icon name="key" />,
                                }}
                            </q-input>

                            <q-select
                                v-model={form.value.role}
                                hint="Assign role to user, default is waiter."
                                standout
                                rounded
                                options={roles}
                                label="Role"
                            />
                            <q-select
                                v-model={form.value.floors}
                                hint="Assign areas to user, multiple areas are allowed."
                                standout
                                rounded
                                multiple
                                options={props.floors}
                                label="Areas"
                            />

                            <div>
                                <q-btn
                                    rounded
                                    size="md"
                                    label="Submit"
                                    type="submit"
                                    class="button-gradient"
                                />
                                <q-btn
                                    rounded
                                    size="md"
                                    outline
                                    label="Reset"
                                    type="reset"
                                    color="primary"
                                    class="q-ml-sm"
                                />
                            </div>
                        </q-form>
                    </q-card>
                </q-dialog>
            </div>
        );
    },
});
