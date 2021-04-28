import { defineComponent, ref, PropType } from "vue";
import { TableElement } from "src/types";
import { useI18n } from "vue-i18n";

import { QInput, QIcon } from "quasar";

export default defineComponent({
    name: "FTAutocomplete",

    props: {
        allReservedTables: {
            type: Array as PropType<TableElement[]>,
            required: true,
        },
    },

    components: { QInput, QIcon },

    emits: ["found", "clear"],

    setup(props, { emit }) {
        const searchTerm = ref("");
        const { t } = useI18n();

        function onTablesSearch(val: string) {
            if (!val) {
                emit("clear");
                return;
            }

            const found = props.allReservedTables.filter((table) => {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const normalizedGuestName = table.reservation!.guestName; // NOSONAR
                const normalizedVal = val.toLowerCase();
                return normalizedGuestName.startsWith(normalizedVal);
            });

            emit("found", found);
        }

        return () => (
            <div class="FTAutocomplete">
                <q-input
                    v-model={searchTerm.value}
                    label={t(`FTAutocomplete.label`)}
                    clearable
                    clear-icon="close"
                    dense
                    standout
                    rounded
                    debounce="500"
                    {...{ "onUpdate:modelValue": onTablesSearch }}
                    onClear={() => emit("clear")}
                >
                    {{
                        prepend: () => <q-icon name="search" />,
                    }}
                </q-input>
            </div>
        );
    },
});
