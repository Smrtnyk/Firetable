function generateHSLColor(
    hue: number,
    saturation: number,
    lightness: number,
    opacity: number,
): string {
    return `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`;
}

export function getColors(count: number): { backgroundColors: string[]; borderColors: string[] } {
    const backgroundColors: string[] = [];
    const borderColors: string[] = [];

    let hue = Math.floor(Math.random() * 360); // Start at a random hue
    const hueIncrement = 360 / count; // Divide the color wheel into equal parts

    for (let i = 0; i < count; i++) {
        const backgroundColor = generateHSLColor(hue, 70, 60, 0.2);
        const borderColor = generateHSLColor(hue, 70, 60, 1);

        backgroundColors.push(backgroundColor);
        borderColors.push(borderColor);

        hue = (hue + hueIncrement) % 360; // Increment and wrap the hue
    }

    return { backgroundColors, borderColors };
}
