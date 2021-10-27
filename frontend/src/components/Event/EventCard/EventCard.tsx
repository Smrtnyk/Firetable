import "./EventCard.scss";

import { defineComponent, PropType } from "vue";
import { EventDoc } from "src/types/event";
import { dateFromTimestamp, hourFromTimestamp } from "src/helpers/utils";

import { QCard, QCardSection, QIcon, QTooltip, QImg, QSeparator } from "quasar";

export default defineComponent({
    name: "EventCard",

    components: { QCard, QCardSection, QIcon, QTooltip, QImg, QSeparator },

    props: {
        event: {
            type: Object as PropType<EventDoc>,
            required: true,
        },
    },

    setup(props) {
        return () => (
            <q-card class="ft-card q-pa-sm EventCard">
                <q-card-section class="q-pb-sm q-pl-sm q-pt-none EventCard__header">
                    <div class="text-h6 event-name">{props.event.name}</div>
                    {props.event.reservedPercentage >= 75 && (
                        <div>
                            <q-icon
                                name="fire"
                                color="warning"
                                class="bg-warning-shadow rounded"
                                size="md"
                            />
                            <q-tooltip>
                                {props.event.reservedPercentage}% of tables are reserved. Event is
                                performing well!
                            </q-tooltip>
                        </div>
                    )}
                </q-card-section>
                <router-link to={{ name: "event", params: { id: props.event.id } }}>
                    <q-img
                        style="background-color: grey"
                        src={props.event.img || "images/default-event-img.jpg"}
                        basic
                        ratio={4 / 3}
                    />
                </router-link>
                <q-card-section class="q-px-none q-py-sm">
                    <div class="row items-center justify-evenly vertical-middle">
                        <span class="flex-v-center">
                            <q-icon
                                name="calendar"
                                color="negative"
                                class="q-mr-xs gradient-warning q-pa-xs rounded"
                                size="xs"
                            />
                            <span class="font-black text-caption text-grey-6">
                                {dateFromTimestamp(props.event.date)}
                            </span>
                        </span>
                        <q-separator class="q-mx-sm-xs q-mx-md-sm" vertical />
                        <span class="flex-v-center">
                            <q-icon
                                name="clock"
                                color="positive"
                                class="q-mr-xs gradient-positive q-pa-xs rounded"
                                size="xs"
                            />
                            <span class="font-black text-caption text-grey-6">
                                {hourFromTimestamp(props.event.date)}
                            </span>
                        </span>
                        <q-separator class="q-mx-md" vertical />
                        <span class="flex-v-center">
                            <q-icon
                                name="euro"
                                color="pink"
                                class="q-mr-xs gradient-pink q-pa-xs rounded"
                                size="xs"
                            />
                            <span class="text-grey-6 font-black text-caption">
                                {props.event.entryPrice}
                            </span>
                        </span>
                    </div>
                </q-card-section>
            </q-card>
        );
    },
});
