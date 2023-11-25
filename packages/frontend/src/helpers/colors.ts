import Color from "color";

const baseColors = [
    "#e60049",
    "#0bb4ff",
    "#50e991",
    "#e6d800",
    "#9b19f5",
    "#ffa300",
    "#dc0ab4",
    "#b3d4ff",
    "#00bfa0",
];

function adjustColorOpacity(hexColor: string, opacity: number): string {
    return Color(hexColor).alpha(opacity).string();
}

export function getColors(count: number): { backgroundColors: string[]; borderColors: string[] } {
    const backgroundColors: string[] = [];
    const borderColors: string[] = [];

    for (let i = 0; i < count; i++) {
        let baseColor;

        if (i < baseColors.length) {
            baseColor = baseColors[i];
        } else {
            // Start modifying the color after using all base colors
            const colorIndex = i % baseColors.length;
            baseColor = Color(baseColors[colorIndex])
                .rotate(((i - baseColors.length) * 20) % 360)
                .hex();
        }

        backgroundColors.push(adjustColorOpacity(baseColor, 0.7));
        borderColors.push(adjustColorOpacity(baseColor, 1));
    }

    return { backgroundColors, borderColors };
}
