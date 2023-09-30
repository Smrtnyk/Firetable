<script setup lang="ts">
import ClubCard from "components/Club/ClubCard.vue";
import { PropertyDoc } from "@firetable/types";

interface Props {
    clubs: PropertyDoc[];
}
const props = defineProps<Props>();
</script>

<template>
    <div class="EventCardList row">
        <div v-for="club in props.clubs" class="col-12 col-sm-6 q-pa-xs" :key="club.id">
            <ClubCard :club="club" />
        </div>
    </div>
</template>
