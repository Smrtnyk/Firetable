import type { PhoneNumber } from "libphonenumber-js";
import { parsePhoneNumberFromString } from "libphonenumber-js";

/**
 * Masks the national part of a phone number, leaving only the last four digits visible.
 * The international (country) part remains unmasked.
 *
 * @param phoneNumber - The input phone number string.
 * @returns The masked phone number string.
 * @throws {Error} If the phone number is invalid or too short to mask.
 */
export function maskPhoneNumber(phoneNumber: string): string {
    const parsedNumber: PhoneNumber | undefined = parsePhoneNumberFromString(phoneNumber);

    if (!parsedNumber?.isValid()) {
        throw new Error("Invalid phone number");
    }

    const internationalPart = parsedNumber.countryCallingCode
        ? `+${parsedNumber.countryCallingCode}`
        : "";

    const nationalNumber = parsedNumber.nationalNumber;

    if (nationalNumber.length < 4) {
        throw new Error("National number too short to mask");
    }

    const maskedNationalNumber =
        nationalNumber.slice(0, -4).replaceAll(/\d/g, "X") + nationalNumber.slice(-4);

    return internationalPart ? `${internationalPart}${maskedNationalNumber}` : maskedNationalNumber;
}
