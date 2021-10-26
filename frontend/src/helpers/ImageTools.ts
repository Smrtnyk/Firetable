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
                    (receivedFile: Blob, success: boolean) => {
                        success
                            ? resolve(receivedFile)
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
        if (!file.type.match(/image.*/)) {
            callback(file, false);
        }

        if (file.type.match(/image\/gif/)) {
            // Not attempting, could be an animated gif
            callback(file, false);
        }

        const image = document.createElement("img");

        image.onload = () => {
            let width = image.width;
            let height = image.height;
            let isTooLarge = false;

            if (
                (width >= height && width > maxDimensions.width) ||
                height > maxDimensions.height
            ) {
                isTooLarge = true;
            }

            if (!isTooLarge) {
                // early exit; no need to resize
                callback(file, false);
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
                callback(blob, true);
            }, file.type);
        };

        loadImage(image, file);
    }
}

function loadImage(image: HTMLImageElement, file: Blob) {
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
