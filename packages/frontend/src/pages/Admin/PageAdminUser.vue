<script setup lang="ts">
import FTTitle from "src/components/FTTitle.vue";
import { createQuery, useFirestoreCollection } from "src/composables/useFirestore";
import { eventsCollection, propertiesCollection, reservationsCollection } from "@firetable/backend";
import { getDocs, query, where } from "firebase/firestore";
import { EventDoc, PropertyDoc, ReservationDoc } from "@firetable/types";
import { computed, onBeforeMount, ref } from "vue";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { Loading } from "quasar";
import { takeProp } from "@firetable/utils";

interface Props {
    organisationId: string;
    userId: string;
}

const props = defineProps<Props>();

const { data: properties, promise: propertiesPromise } = useFirestoreCollection<PropertyDoc>(
    createQuery(
        propertiesCollection(props.organisationId),
        where("relatedUsers", "array-contains", props.userId),
    ),
    { once: true },
);

const reservations = ref<ReservationDoc[]>([]);
const reservationsSummary = computed(() => {
    return {
        confirmed: reservations.value.filter((res) => res.confirmed),
        unconfirmed: reservations.value.filter((res) => !res.confirmed),
    };
});

onBeforeMount(async () => {
    try {
        Loading.show();
        await propertiesPromise.value;
        const allEvents = await getEventsForProperties(properties.value);
        const allReservations = await getReservationFromEventsByUser(allEvents, props.userId);
        reservations.value.push(...allReservations);
        console.log(allEvents);
        console.log(allReservations);
    } catch (e) {
        showErrorMessage(e);
    } finally {
        Loading.hide();
    }
});

async function getEventsForProperties(propertyDocs: PropertyDoc[]): Promise<EventDoc[]> {
    const allEvents = await Promise.all(
        propertyDocs.map((property) => {
            return getDocs(
                eventsCollection({
                    organisationId: props.organisationId,
                    propertyId: property.id,
                    id: "",
                }),
            );
        }),
    );
    return allEvents
        .flatMap((snapShot) => {
            return snapShot.docs;
        })
        .map((doc) => {
            return { ...doc.data(), id: doc.id } as EventDoc;
        });
}

async function getReservationFromEventsByUser(
    eventDocs: EventDoc[],
    userId: string,
): Promise<ReservationDoc[]> {
    const allReservations = await Promise.all(
        eventDocs.map((event) => {
            return getDocs(
                query(
                    reservationsCollection({
                        organisationId: props.organisationId,
                        propertyId: event.propertyId,
                        id: event.id,
                    }),
                    where("reservedBy.id", "==", userId),
                ),
            );
        }),
    );
    return allReservations.flatMap(takeProp("docs")).map((doc) => {
        return { ...doc.data(), id: doc.id } as ReservationDoc;
    });
}
</script>

<template>
    <div class="PageAdminUser">
        <FTTitle title="User Profile" />
        <div>
            <p>
                Total:
                {{ reservationsSummary.confirmed.length + reservationsSummary.unconfirmed.length }}
            </p>
            <p>
                Confirmed:
                {{ reservationsSummary.confirmed.length }}
            </p>
            <p>
                Unconfirmed:
                {{ reservationsSummary.unconfirmed.length }}
            </p>
        </div>
    </div>
</template>
