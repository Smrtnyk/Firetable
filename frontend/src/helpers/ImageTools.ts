const hasBlobConstructor =
    typeof Blob !== "undefined" &&
    (function () {
        try {
            return Boolean(new Blob());
        } catch (e) {
            return false;
        }
    })();

const hasArrayBufferViewSupport =
    hasBlobConstructor &&
    typeof Uint8Array !== "undefined" &&
    (function () {
        try {
            return new Blob([new Uint8Array(100)]).size === 100;
        } catch (e) {
            return false;
        }
    })();

const hasToBlobSupport =
    typeof HTMLCanvasElement !== "undefined"
        ? HTMLCanvasElement.prototype.toBlob
        : false;

const hasBlobSupport =
    hasToBlobSupport ||
    (typeof Uint8Array !== "undefined" &&
        typeof ArrayBuffer !== "undefined" &&
        typeof atob !== "undefined");

const hasReaderSupport =
    typeof FileReader !== "undefined" || typeof URL !== "undefined";

export class ImageTools {
    static resize(
        file: File,
        maxDimensions: { width: number; height: number }
    ): Promise<never | Blob> {
        return new Promise((resolve, reject) => {
            try {
                ImageTools.resizeSync(
                    file,
                    maxDimensions,
                    (file: Blob, success: boolean) => {
                        success
                            ? resolve(file)
                            : reject(
                                  new Error(
                                      "An error ocurred while processing the image!"
                                  )
                              );
                    }
                );
            } catch (e) {
                reject(e);
            }
        });
    }

    static resizeSync(
        file: File,
        maxDimensions: { width: number; height: number },
        callback: (file: Blob, success: boolean) => unknown
    ) {
        if (typeof maxDimensions === "function") {
            callback = maxDimensions;
            maxDimensions = {
                width: 640,
                height: 480,
            };
        }

        // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
        if (!ImageTools.isSupported() || !file.type.match(/image.*/)) {
            callback(file, false);
        }

        // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
        if (file.type.match(/image\/gif/)) {
            // Not attempting, could be an animated gif
            callback(file, false);
            // TODO: use https://github.com/antimatter15/whammy to convert gif to webm
        }

        const image = document.createElement("img");

        image.onload = () => {
            let width = image.width;
            let height = image.height;
            let isTooLarge = false;

            if (width >= height && width > maxDimensions.width) {
                isTooLarge = true;
            } else if (height > maxDimensions.height) {
                isTooLarge = true;
            }

            if (!isTooLarge) {
                // early exit; no need to resize
                callback(file, false);
            }

            const scaleRatio = maxDimensions.width / width;

            // TODO number of resampling steps
            // const steps = Math.ceil(Math.log(width / (width * scaleRatio)) / Math.log(2));

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

            if (hasToBlobSupport) {
                canvas.toBlob((blob) => {
                    if (!blob) return;
                    callback(blob, true);
                }, file.type);
            } else {
                const blob = ImageTools._toBlob(canvas, file.type);
                callback(blob, true);
            }
        };

        ImageTools._loadImage(image, file);
    }

    static _toBlob(canvas: HTMLCanvasElement, type: string) {
        const dataURI = canvas.toDataURL(type);
        const dataURIParts = dataURI.split(",");
        let byteString;
        if (dataURIParts[0].indexOf("base64") >= 0) {
            // Convert base64 to raw binary data held in a string:
            byteString = atob(dataURIParts[1]);
        } else {
            // Convert base64/URLEncoded data component to raw binary data:
            byteString = decodeURIComponent(dataURIParts[1]);
        }
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const intArray = new Uint8Array(arrayBuffer);

        for (let i = 0; i < byteString.length; i += 1) {
            intArray[i] = byteString.charCodeAt(i);
        }

        const mimeString = dataURIParts[0].split(":")[1].split(";")[0];
        let blob;

        if (hasBlobConstructor) {
            blob = new Blob(
                [hasArrayBufferViewSupport ? intArray : arrayBuffer],
                { type: mimeString }
            );
        } else {
            blob = new Blob([arrayBuffer]);
        }
        return blob;
    }

    static _loadImage(image: HTMLImageElement, file: Blob) {
        if (typeof URL === "undefined") {
            const reader = new FileReader();
            reader.onload = function (evt) {
                if (!evt.target?.result) return;
                image.src = evt.target.result as string;
            };
            reader.readAsDataURL(file);
        } else {
            image.src = URL.createObjectURL(file);
        }
    }

    static isSupported() {
        return (
            typeof HTMLCanvasElement !== "undefined" &&
            hasBlobSupport &&
            hasReaderSupport
        );
    }
}
