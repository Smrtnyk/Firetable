import { colors } from "quasar";

const { changeAlpha, rgbToHex, hexToRgb, rgbToHsv, hsvToRgb } = colors;

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

function rotateHue(hexColor: string, angle: number): string {
    const rgb = hexToRgb(hexColor);

    // eslint-disable-next-line id-length -- quasar built-in function
    const { h, s, v } = rgbToHsv(rgb);

    let newH = (h + angle) % 360;
    newH = newH < 0 ? 360 + newH : newH;

    // eslint-disable-next-line id-length -- quasar built-in function
    const newRgb = hsvToRgb({ h: newH, s, v });
    return rgbToHex(newRgb);
}

function adjustColorOpacity(hexColor: string, opacity: number): string {
    return changeAlpha(hexColor, opacity);
}

export function getColors(count: number): { backgroundColors: string[]; borderColors: string[] } {
    const backgroundColors: string[] = [];
    const borderColors: string[] = [];

    for (let i = 0; i < count; i += 1) {
        let baseColor;

        if (i < baseColors.length) {
            baseColor = baseColors[i];
        } else {
            // Start modifying the color after using all base colors
            const colorIndex = i % baseColors.length;
            baseColor = rotateHue(baseColors[colorIndex], ((i - baseColors.length) * 20) % 360);
        }

        backgroundColors.push(adjustColorOpacity(baseColor, 0.7));
        borderColors.push(adjustColorOpacity(baseColor, 1));
    }

    return { backgroundColors, borderColors };
}
