export function resizeImage(
    file: File,
    maxDimensions: { width: number; height: number },
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const imageTypePattern = /^image\//;

        if (!imageTypePattern.exec(file.type)) {
            return reject(new Error("Provided file is not an image"));
        }

        const image = new Image();

        image.onload = () => {
            try {
                const resizedBlob = performResize(image, maxDimensions, file.type);
                resolve(resizedBlob);
            } catch (error) {
                reject(error);
            }
        };

        image.onerror = () => {
            reject(new Error("Error loading the image"));
        };

        image.src = URL.createObjectURL(file);
    });
}

function performResize(
    image: HTMLImageElement,
    maxDimensions: { width: number; height: number },
    mimeType: string,
): Blob {
    const { width, height } = calculateNewDimensions(image, maxDimensions);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas context is not available");

    context.drawImage(image, 0, 0, width, height);

    const dataUrl = canvas.toDataURL(mimeType);
    const resizedBlob = dataURLToBlob(dataUrl, mimeType);
    return resizedBlob;
}

function calculateNewDimensions(
    image: HTMLImageElement,
    maxDimensions: { width: number; height: number },
) {
    let { width, height } = image;
    const aspectRatio = width / height;

    if (width > maxDimensions.width) {
        width = maxDimensions.width;
        height = width / aspectRatio;
    }

    if (height > maxDimensions.height) {
        height = maxDimensions.height;
        width = height * aspectRatio;
    }

    return { width, height };
}

function dataURLToBlob(dataUrl: string, mimeType: string): Blob {
    const byteString = atob(dataUrl.split(",")[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
    }

    return new Blob([uint8Array], { type: mimeType });
}
