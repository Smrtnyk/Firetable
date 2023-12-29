export function isValidEuropeanPhoneNumber(number: unknown): boolean {
    if (!number) {
        return false;
    }

    const numberString = String(number);

    const regex =
        /^(\+?[2-4]\d{0,2}|00[2-4]\d{0,2})?[/\-. ]?(\d{1,4})?[/\-. ]?(\d{1,4})?[/\-. ]?(\d{1,4})?[/\-. ]?(\d{1,4})?$/;

    const digitCount = (numberString.match(/\d/g) || []).length;

    return regex.test(numberString) && digitCount >= 6;
}
