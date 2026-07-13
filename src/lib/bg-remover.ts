/**
 * Interactive Background Remover Utility
 * 
 * Includes:
 * 1. Automatic background removal based on dominant color keying (chroma keying)
 * 2. Fine-tuning brush erasure mechanics
 */

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Automatically detects the dominant background color (by sampling corner pixels)
 * and turns it transparent.
 */
export function autoRemoveBackground(
  imageSrc: string,
  tolerance = 30
): Promise<{ url: string; dominantColor: RGBA }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const isCrossOrigin = typeof window !== "undefined" && imageSrc.startsWith("http") && !imageSrc.startsWith(window.location.origin);
    if (isCrossOrigin) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context could not be created"));
        return;
      }
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Sample 4 corners to estimate the background color
      const corners = [
        getPixel(imgData, 0, 0),
        getPixel(imgData, canvas.width - 1, 0),
        getPixel(imgData, 0, canvas.height - 1),
        getPixel(imgData, canvas.width - 1, canvas.height - 1),
      ];

      // Use average corner color as the key background color
      const keyBg = {
        r: Math.round(corners.reduce((sum, c) => sum + c.r, 0) / 4),
        g: Math.round(corners.reduce((sum, c) => sum + c.g, 0) / 4),
        b: Math.round(corners.reduce((sum, c) => sum + c.b, 0) / 4),
        a: 255,
      };

      // Loop through all pixels and transparentize matching ones
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Euclidean distance in RGB space
        const dist = Math.sqrt(
          Math.pow(r - keyBg.r, 2) +
          Math.pow(g - keyBg.g, 2) +
          Math.pow(b - keyBg.b, 2)
        );

        if (dist < tolerance) {
          data[i + 3] = 0; // set alpha to 0 (transparent)
        }
      }

      ctx.putImageData(imgData, 0, 0);
      resolve({
        url: canvas.toDataURL(),
        dominantColor: keyBg,
      });
    };
    img.onerror = (err) => reject(err);
    img.src = imageSrc;
  });
}

function getPixel(imgData: ImageData, x: number, y: number): RGBA {
  const idx = (y * imgData.width + x) * 4;
  return {
    r: imgData.data[idx],
    g: imgData.data[idx + 1],
    b: imgData.data[idx + 2],
    a: imgData.data[idx + 3],
  };
}

/**
 * Erase canvas pixels using a brush coordinate sweep.
 */
export function eraseAt(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  brushSize = 20
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  
  ctx.save();
  ctx.globalCompositeOperation = "destination-out"; // erases destination pixels
  ctx.beginPath();
  ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
