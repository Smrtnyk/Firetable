<template>
    <v-list-item :to="link.route" class="AppDrawerLink" :aria-labelledby="`label-${link.route}`">
        <template v-slot:prepend>
            <v-icon :icon="link.icon" class="AppDrawerLink__icon" aria-hidden="true" size="xs" />
        </template>

        <v-list-item-title class="AppDrawerLink__label" :id="`label-${link.route}`">
            {{ link.label }}
        </v-list-item-title>
    </v-list-item>
</template>

<script setup lang="ts">
import type { Link } from "src/types";

interface Props {
    link: Link;
}

const { link } = defineProps<Props>();
</script>

<style lang="scss" scoped>
@use "src/css/variables.scss" as *;

.AppDrawerLink {
    &__icon {
        color: $icon-secondary;
        transition: color 0.2s ease;
    }

    &__label {
        color: $text-secondary;
        transition: color 0.2s ease;
    }

    &.v-list-item--active {
        background: $state-active-light;
        color: $icon-primary;

        .AppDrawerLink__icon {
            color: $icon-primary;
        }

        .AppDrawerLink__label {
            color: $icon-primary;
            font-weight: 600;
        }
    }

    &:hover {
        .AppDrawerLink__icon {
            color: $icon-hover;
        }

        .AppDrawerLink__label {
            color: $text-primary;
        }
    }
}

.v-theme--dark .AppDrawerLink {
    &__icon {
        color: $icon-secondary-dark;
    }

    &__label {
        color: $text-secondary-dark;
    }

    &.v-list-item--active {
        background: $state-active-dark;

        .AppDrawerLink__icon {
            color: $icon-hover-dark;
        }

        .AppDrawerLink__label {
            color: $icon-hover-dark;
        }
    }

    &:hover {
        .AppDrawerLink__icon {
            color: $icon-hover-dark;
        }

        .AppDrawerLink__label {
            color: $text-primary-dark;
        }
    }
}
</style>
