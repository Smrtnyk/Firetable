/**
 * Capitalizes the first letter of each word in the given name.
 * Handles multiple spaces and trims the input.
 */
export function capitalizeName(name: string): string {
    if (!name) {
        return "";
    }

    // Step 1: Capitalize first letter of each word and each hyphenated sub-word
    const capitalized = name
        .split(" ")
        .filter(Boolean)
        .map(function (word) {
            // Handle hyphenated names (e.g., "foo-bar")
            return word
                .split("-")
                .map(function (subWord) {
                    return subWord.charAt(0).toUpperCase() + subWord.slice(1).toLowerCase();
                })
                .join("-");
        })
        .join(" ");

    // Step 2: Capitalize letters following apostrophes
    return capitalized.replaceAll(/'(\w)/g, function (_, letter) {
        return `'${letter.toUpperCase()}`;
    });
}