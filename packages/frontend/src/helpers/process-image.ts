interface ImageProcessingOptions {
    maxWidth: number;
    maxHeight: number;
    quality: number;
    maxFileSize: number;
    acceptedTypes: string[];
    preserveTransparency?: boolean;
}

export function processImage(file: File, options: ImageProcessingOptions): Promise<string> {
    return new Promise(function (resolve, reject) {
        if (!options.acceptedTypes.includes(file.type)) {
            reject(new Error("Invalid file type"));
            return;
        }

        const img = new Image();
        const reader = new FileReader();

        reader.addEventListener("load", function (e) {
            img.src = e.target?.result?.toString() ?? "";
        });

        img.addEventListener("load", function () {
            const canvas = document.createElement("canvas");
            let { width, height } = img;

            // Calculate new dimensions while maintaining aspect ratio
            if (width > options.maxWidth) {
                height = (height * options.maxWidth) / width;
                width = options.maxWidth;
            }
            if (height > options.maxHeight) {
                width = (width * options.maxHeight) / height;
                height = options.maxHeight;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d", { alpha: true });
            if (!ctx) {
                reject(new Error("Failed to get canvas context"));
                return;
            }

            // Clear canvas with transparency if needed
            if (options.preserveTransparency) {
                ctx.clearRect(0, 0, width, height);
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Use original format for transparency, otherwise jpeg
            const imageType = options.preserveTransparency ? file.type : "image/jpeg";
            const base64 = canvas.toDataURL(
                imageType,
                imageType === "image/jpeg" ? options.quality : undefined,
            );

            const size = Math.round(((base64.length - `data:${imageType};base64,`.length) * 3) / 4);
            if (size > options.maxFileSize) {
                reject(new Error("Processed image still too large"));
                return;
            }

            resolve(base64);
        });

        reader.readAsDataURL(file);
    });
}
