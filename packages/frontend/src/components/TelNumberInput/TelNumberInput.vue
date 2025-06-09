<template>
    <div class="TelNumberInput">
        <v-row no-gutters>
            <!-- Country Code Select -->
            <v-col cols="12" sm="5" md="4">
                <v-select
                    v-model="selectedCountry as CountryWIthDisplayName"
                    :items="countryOptions"
                    item-title="displayName"
                    item-value="iso2"
                    return-object
                    :label="t('TelNumberInput.countryCodeLabel')"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    :rules="required ? [validateCountrySelection] : []"
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

            <!-- Phone Number Input -->
            <v-col cols="12" sm="7" md="8">
                <v-text-field
                    v-model="phoneNumber"
                    :label="t('TelNumberInput.phoneNumberLabel')"
                    type="tel"
                    variant="outlined"
                    density="comfortable"
                    :rules="required ? [validatePhoneNumber] : []"
                    @input="onPhoneInput"
                    @blur="onPhoneBlur"
                >
                    <template v-slot:prepend-inner>
                        <v-icon size="x-small" class="text-medium-emphasis">fas fa-phone</v-icon>
                    </template>

                    <template v-slot:append-inner>
                        <v-fade-transition>
                            <v-icon
                                v-if="isValid"
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

type CountryWIthDisplayName = Country & {
    displayName: string;
};

const props = withDefaults(defineProps<TelNumberInputProps>(), {
    modelValue: "",
    required: false,
});

const emit = defineEmits<{
    "update:modelValue": [value: string];
}>();

const { t } = useI18n();

const selectedCountry = ref<Country | null>(null);
const phoneNumber = ref("");

const countryOptions = computed(() => {
    return europeanCountries.map((country) => ({
        ...country,
        displayName: `${country.name} (+${country.dialCode})`,
    }));
});

const fullNumber = computed(() => {
    if (selectedCountry.value && phoneNumber.value) {
        return `+${selectedCountry.value.dialCode}${phoneNumber.value}`;
    }
    return "";
});

const isValid = computed(() => {
    if (!fullNumber.value) return false;
    const parsed = parsePhoneNumberFromString(fullNumber.value);
    return parsed?.isValid() ?? false;
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
            const country = europeanCountries.find((c) => c.iso2.toUpperCase() === parsed.country);
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

function emitValue(): void {
    if (isValid.value) {
        emit("update:modelValue", fullNumber.value);
    } else if (!selectedCountry.value && !phoneNumber.value) {
        emit("update:modelValue", "");
    } else {
        // Don't emit invalid partial values
        emit("update:modelValue", "");
    }
}

function onPhoneBlur(): void {
    // Final formatting on blur
    if (selectedCountry.value && phoneNumber.value) {
        const parsed = parsePhoneNumberFromString(fullNumber.value);
        if (parsed?.isValid()) {
            phoneNumber.value = parsed.nationalNumber;
        }
    }
}

function onPhoneInput(): void {
    if (!selectedCountry.value || !phoneNumber.value) {
        return;
    }
    // Format as user types if country is selected
    const formatter = new AsYouType(selectedCountry.value.iso2.toUpperCase() as CountryCode);
    const formatted = formatter.input(phoneNumber.value);
    // Only update if it's actually formatted differently
    if (formatted !== phoneNumber.value) {
        phoneNumber.value = formatted;
    }
}

function validateCountrySelection(): boolean | string {
    if (props.required && !selectedCountry.value) {
        return t("TelNumberInput.selectCountryCodeValidationMsg");
    }
    if (phoneNumber.value && !selectedCountry.value) {
        return t("TelNumberInput.selectCountryCodeValidationMsg");
    }
    return true;
}

function validatePhoneNumber(): boolean | string {
    if (props.required) {
        if (!phoneNumber.value) {
            return t("TelNumberInput.provideCountryAndNumberValidationMsg");
        }
        if (!selectedCountry.value) {
            return t("TelNumberInput.selectCountryCodeValidationMsg");
        }
    }

    if (phoneNumber.value && selectedCountry.value && !isValid.value) {
        return t("TelNumberInput.invalidPhoneNumberValidationMsg");
    }

    return true;
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
