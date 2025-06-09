function changeAlpha(hexColor: string, opacity: number): string {
    const { b, g, r } = hexToRgb(hexColor);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function hexToRgb(hex: string): { b: number; g: number; r: number } {
    const shorthandRegex = /^#?([\da-f])([\da-f])([\da-f])$/i;
    const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(fullHex);
    return result
        ? {
              b: Number.parseInt(result[3], 16),
              g: Number.parseInt(result[2], 16),
              r: Number.parseInt(result[1], 16),
          }
        : { b: 0, g: 0, r: 0 };
}

function hsvToRgb({ h, s, v }: { h: number; s: number; v: number }): {
    b: number;
    g: number;
    r: number;
} {
    let b = 0;
    let g = 0;
    let r = 0;
    const hNormalized = h / 60;
    const i = Math.floor(hNormalized);
    const f = hNormalized - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0:
            r = v;
            g = t;
            b = p;
            break;
        case 1:
            r = q;
            g = v;
            b = p;
            break;
        case 2:
            r = p;
            g = v;
            b = t;
            break;
        case 3:
            r = p;
            g = q;
            b = v;
            break;
        case 4:
            r = t;
            g = p;
            b = v;
            break;
        case 5:
            r = v;
            g = p;
            b = q;
            break;
    }

    return {
        b: Math.round(b * 255),
        g: Math.round(g * 255),
        r: Math.round(r * 255),
    };
}

function rgbToHex({ b, g, r }: { b: number; g: number; r: number }): string {
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsv({ b, g, r }: { b: number; g: number; r: number }): {
    h: number;
    s: number;
    v: number;
} {
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    let h = 0;
    const v = max;
    const d = max - min;
    const s = max === 0 ? 0 : d / max;

    if (max !== min) {
        switch (max) {
            case bNorm:
                h = (rNorm - gNorm) / d + 4;
                break;
            case gNorm:
                h = (bNorm - rNorm) / d + 2;
                break;
            case rNorm:
                h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
                break;
        }
        h /= 6;
    }

    return { h: h * 360, s, v };
}

function toHex(c: number): string {
    return `0${Math.round(c).toString(16)}`.slice(-2);
}

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

export function getColors(count: number): { backgroundColors: string[]; borderColors: string[] } {
    const backgroundColors: string[] = [];
    const borderColors: string[] = [];

    for (let i = 0; i < count; i += 1) {
        let baseColor: string;

        if (i < baseColors.length) {
            baseColor = baseColors[i];
        } else {
            const colorIndex = i % baseColors.length;
            const angle = Math.floor(i / baseColors.length) * 30;
            baseColor = rotateHue(baseColors[colorIndex], angle);
        }

        backgroundColors.push(adjustColorOpacity(baseColor, 0.7));
        borderColors.push(adjustColorOpacity(baseColor, 1));
    }

    return { backgroundColors, borderColors };
}

function adjustColorOpacity(hexColor: string, opacity: number): string {
    return changeAlpha(hexColor, opacity);
}

function rotateHue(hexColor: string, angle: number): string {
    const rgb = hexToRgb(hexColor);
    const hsv = rgbToHsv(rgb);

    let newH = (hsv.h + angle) % 360;
    newH = newH < 0 ? 360 + newH : newH;

    const newRgb = hsvToRgb({ h: newH, s: hsv.s, v: hsv.v });
    return rgbToHex(newRgb);
}
