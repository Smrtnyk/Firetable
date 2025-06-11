<script setup lang="ts">
import type { Link } from "src/types";

interface Props {
    link: Link;
}

const { link } = defineProps<Props>();
</script>

<template>
    <q-item
        :to="link.route"
        clickable
        class="AppDrawerLink"
        :aria-labelledby="`label-${link.route}`"
    >
        <q-item-section avatar class="AppDrawerLink__icon-section">
            <i :class="link.icon" class="AppDrawerLink__icon" aria-hidden="true" />
        </q-item-section>
        <q-item-section class="AppDrawerLink__label" :id="`label-${link.route}`">
            {{ link.label }}
        </q-item-section>
    </q-item>
</template>

<style lang="scss" scoped>
.AppDrawerLink {
    &__icon-section {
        min-width: 32px;
        margin-right: 4px;
    }

    &__icon {
        width: 16px;
        color: $icon-primary;
        font-size: 14px;
        text-align: center;
        display: block;
    }

    &__label {
        font-size: 14px;
        color: $text-secondary;
        font-weight: 500;
    }

    // Active/selected state
    &.q-router-link--active {
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

    // Hover state
    &:hover {
        .AppDrawerLink__icon {
            color: $icon-hover;
        }

        .AppDrawerLink__label {
            color: $text-primary;
        }
    }
}

// Dark mode styles
.body--dark .AppDrawerLink {
    &__icon {
        color: $icon-primary-dark;
    }

    &__label {
        color: $text-secondary-dark;
    }

    &.q-router-link--active {
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
