<template>
    <div class="TelNumberInput">
        <v-row no-gutters>
            <v-col cols="12" sm="5" md="4">
                <v-select
                    v-model="selectedCountry"
                    :items="countryOptions"
                    item-title="displayName"
                    item-value="iso2"
                    return-object
                    :label="t('TelNumberInput.countryCodeLabel')"
                    :aria-label="t('TelNumberInput.countryCodeLabel')"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                    :rules="countryRules"
                    :clearable="!props.required && !!selectedCountry"
                    @click:clear="clearAll"
                    class="mb-2 me-2"
                >
                    <template v-slot:prepend-inner>
                        <v-icon size="x-small" class="text-medium-emphasis">fas fa-globe</v-icon>
                    </template>

                    <template v-slot:selection="{ item }">
                        <div class="d-flex align-center ga-2" v-if="item">
                            <img :src="item.raw.flag" alt="" class="country-flag" />
                            <span class="font-weight-medium">+{{ item.raw.dialCode }}</span>
                        </div>
                    </template>

                    <template v-slot:item="{ props: itemProps, item }">
                        <v-list-item v-bind="itemProps">
                            <template v-slot:prepend>
                                <img :src="item.raw.flag" alt="" class="country-flag" />
                            </template>
                            <template v-slot:title>
                                {{ item.raw.name }}
                            </template>
                            <template v-slot:subtitle> +{{ item.raw.dialCode }} </template>
                        </v-list-item>
                    </template>
                </v-select>
            </v-col>

            <v-col cols="12" sm="7" md="8">
                <v-text-field
                    v-model="phoneNumber"
                    :label="t('TelNumberInput.phoneNumberLabel')"
                    type="tel"
                    variant="outlined"
                    density="comfortable"
                    :disabled="!selectedCountry"
                    :rules="phoneRules"
                    hide-details="auto"
                    @input="onPhoneInput"
                    @blur="onPhoneBlur"
                >
                    <template v-slot:prepend-inner>
                        <v-icon size="x-small" class="text-medium-emphasis">fas fa-phone</v-icon>
                    </template>

                    <template v-slot:append-inner>
                        <v-fade-transition>
                            <v-icon
                                v-if="isValidComplete"
                                size="small"
                                color="success"
                                class="phone-validation-icon"
                            >
                                fas fa-check-circle
                            </v-icon>
                        </v-fade-transition>
                    </template>
                </v-text-field>
            </v-col>
        </v-row>
    </div>
</template>

<script setup lang="ts">
import type { CountryCode } from "libphonenumber-js";

import { AsYouType, parsePhoneNumberFromString } from "libphonenumber-js";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import type { Country } from "./european-countries";

import europeanCountries from "./european-countries";

export interface TelNumberInputProps {
    modelValue?: string;
    required?: boolean;
}

interface CountryWithDisplayName extends Country {
    displayName: string;
}

const props = withDefaults(defineProps<TelNumberInputProps>(), {
    modelValue: "",
    required: false,
});

const emit = defineEmits<{
    "update:modelValue": [value: string];
}>();

const { t } = useI18n();

const PHONE_NUMBER_MIN_LENGTH = 4;
const PHONE_NUMBER_MAX_LENGTH = 15;

const selectedCountry = ref<CountryWithDisplayName | null>(null);
const phoneNumber = ref("");

const countryOptions = computed(() => {
    return europeanCountries.map((country) => ({
        ...country,
        displayName: `${country.name} (+${country.dialCode})`,
    }));
});

const fullNumber = computed(() => {
    if (selectedCountry.value && phoneNumber.value) {
        const cleanNumber = phoneNumber.value.replaceAll(/\s/g, "");
        return `+${selectedCountry.value.dialCode}${cleanNumber}`;
    }
    return "";
});

const isValidComplete = computed(() => {
    if (!selectedCountry.value || !phoneNumber.value) return false;
    if (phoneNumber.value.length < PHONE_NUMBER_MIN_LENGTH) return false;

    const parsed = parsePhoneNumberFromString(fullNumber.value);
    return parsed?.isValid() ?? false;
});

const countryRules = computed(() => {
    const rules: Array<(value: CountryWithDisplayName | null) => boolean | string> = [];

    if (props.required || phoneNumber.value) {
        rules.push(
            (val: CountryWithDisplayName | null) =>
                Boolean(val) || t("TelNumberInput.selectCountryCodeValidationMsg"),
        );
    }

    return rules;
});

const phoneRules = computed(() => {
    const rules: Array<(value: string) => boolean | string> = [];

    if (!selectedCountry.value) {
        return rules;
    }

    if (props.required || selectedCountry.value) {
        rules.push(
            (val: string) =>
                Boolean(val) || t("TelNumberInput.provideCountryAndNumberValidationMsg"),
        );
    }

    if (phoneNumber.value && selectedCountry.value) {
        rules.push(
            (val: string) =>
                val.length >= PHONE_NUMBER_MIN_LENGTH ||
                t("TelNumberInput.invalidPhoneNumberValidationMsg"),
        );

        rules.push(() => {
            const parsed = parsePhoneNumberFromString(fullNumber.value);
            return parsed?.isValid() || t("TelNumberInput.invalidPhoneNumberValidationMsg");
        });
    }

    return rules;
});

watch(
    () => props.modelValue,
    (newValue) => {
        if (!newValue) {
            selectedCountry.value = null;
            phoneNumber.value = "";
            return;
        }

        if (newValue === fullNumber.value) return;

        const parsed = parsePhoneNumberFromString(newValue);
        if (parsed) {
            const country = countryOptions.value.find(
                (c) => c.iso2.toUpperCase() === parsed.country,
            );
            if (country) {
                selectedCountry.value = country;
                phoneNumber.value = parsed.nationalNumber;
            }
        }
    },
    { immediate: true },
);

watch([selectedCountry, phoneNumber], () => {
    emitValue();
});

watch(phoneNumber, (newValue) => {
    if (!selectedCountry.value && newValue) {
        phoneNumber.value = "";
    }
});

watch(selectedCountry, (newValue) => {
    if (newValue && !phoneNumber.value && !props.required) {
        setTimeout(() => {
            const phoneInput = document.querySelector(
                '.TelNumberInput input[type="tel"]',
            ) as HTMLInputElement;
            phoneInput?.focus();
        }, 100);
    }
});

function clearAll(): void {
    selectedCountry.value = null;
    phoneNumber.value = "";
}

function emitValue(): void {
    if (isValidComplete.value) {
        emit("update:modelValue", fullNumber.value);
    } else if (!phoneNumber.value && !selectedCountry.value) {
        emit("update:modelValue", "");
    }
}

function onPhoneBlur(): void {
    if (!selectedCountry.value || !phoneNumber.value) {
        return;
    }
    const asYouType = new AsYouType(selectedCountry.value.iso2.toUpperCase() as CountryCode);
    asYouType.input(phoneNumber.value);
    const output = asYouType.getNumber();
    if (output) {
        phoneNumber.value = output.nationalNumber;
    }
}

function onPhoneInput(): void {
    if (!selectedCountry.value) {
        phoneNumber.value = "";
        return;
    }

    if (!phoneNumber.value) {
        return;
    }

    const digitsOnly = phoneNumber.value.replaceAll(/\D/g, "");
    if (digitsOnly.length > PHONE_NUMBER_MAX_LENGTH) {
        phoneNumber.value = phoneNumber.value.slice(0, -1);
        return;
    }

    const formatter = new AsYouType(selectedCountry.value.iso2.toUpperCase() as CountryCode);
    const formatted = formatter.input(phoneNumber.value);

    if (formatted !== phoneNumber.value && formatter.getNumber()?.nationalNumber) {
        phoneNumber.value = formatted;
    }
}
</script>

<style lang="scss" scoped>
.TelNumberInput {
    width: 100%;
}

.country-flag {
    width: 20px;
    height: 14px;
    object-fit: cover;
    border-radius: 2px;
    flex-shrink: 0;
}

.phone-validation-icon {
    opacity: 0.8;
}

.v-btn--icon {
    opacity: 0.6;
    transition: opacity 0.2s;

    &:hover {
        opacity: 1;
    }
}

@media (max-width: 600px) {
    .TelNumberInput {
        :deep(.v-col) {
            padding-bottom: 8px;
        }

        .me-2 {
            margin-inline-end: 0 !important;
        }
    }
}
</style>
