const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_INPUT_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_EDGE = 1024;
const OUTPUT_TYPE = "image/jpeg";
const OUTPUT_QUALITY = 0.82;

export class AiMirrorImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiMirrorImageError";
  }
}

function readImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new AiMirrorImageError("We could not read this image."));
    };
    image.src = objectUrl;
  });
}

function calculateSize(width: number, height: number) {
  const longestEdge = Math.max(width, height);

  if (longestEdge <= MAX_EDGE) {
    return { width, height };
  }

  const scale = MAX_EDGE / longestEdge;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

export async function prepareAiMirrorImage(file: File): Promise<{
  dataUrl: string;
  previewUrl: string;
}> {
  if (!file.size) {
    throw new AiMirrorImageError("Please choose a non-empty image.");
  }

  if (file.size > MAX_INPUT_SIZE_BYTES) {
    throw new AiMirrorImageError("Please choose an image smaller than 8MB.");
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new AiMirrorImageError("Please upload a JPEG, PNG, or WebP image.");
  }

  const image = await readImage(file);
  const { width, height } = calculateSize(image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new AiMirrorImageError("Image processing is not available.");
  }

  context.drawImage(image, 0, 0, width, height);
  const dataUrl = canvas.toDataURL(OUTPUT_TYPE, OUTPUT_QUALITY);

  return {
    dataUrl,
    previewUrl: URL.createObjectURL(file),
  };
}
