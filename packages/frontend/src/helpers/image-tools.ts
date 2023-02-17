export function resizeImage(
    file: File,
    maxDimensions: { width: number; height: number }
): Promise<never | Blob> {
    return new Promise((resolve, reject) => {
        try {
            resizeSync(file, maxDimensions, resolve);
        } catch (e) {
            reject(e);
        }
    });
}

function resizeSync(
    file: File,
    maxDimensions: { width: number; height: number },
    callback: (file: Blob) => void
) {
    // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
    if (!file.type.match(/image.*/)) {
        throw new Error("An error occurred while processing the image!");
    }

    if (file.type.match(/image\/gif/)) {
        // Not attempting, could be an animated gif
        throw new Error("An error occurred while processing the image!");
    }

    const image = document.createElement("img");

    image.onload = () => {
        let width = image.width;
        let height = image.height;
        let isTooLarge = false;

        if ((width >= height && width > maxDimensions.width) || height > maxDimensions.height) {
            isTooLarge = true;
        }

        if (!isTooLarge) {
            throw new Error("Image is smaller than it needs to be resized to!");
        }

        const scaleRatio = maxDimensions.width / width;

        width *= scaleRatio;
        height *= scaleRatio;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(image, 0, 0, width, height);

        canvas.toBlob((blob) => {
            if (!blob) return;
            callback(blob);
        }, file.type);
    };

    image.src = URL.createObjectURL(file);
}
