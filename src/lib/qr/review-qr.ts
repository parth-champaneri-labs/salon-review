import { readFile } from "node:fs/promises";
import { join } from "node:path";
import QRCode from "qrcode";
import { siteConfig } from "@/config/site";

export const REVIEW_QR_TARGET = siteConfig.qrRedirectUrl;
export const REVIEW_QR_OPTIONS = {
  type: "svg",
  errorCorrectionLevel: "H",
  margin: 4,
  color: { dark: "#191916", light: "#FFFFFF" },
} as const;
export const QR_LOGO_PLATE_RATIO = 0.18;
export const QR_LOGO_IMAGE_RATIO = 0.14;
export const QR_LOGO_ASSET = join(process.cwd(), "public", "logo", "qr-logo.png");

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function isValidPng(buffer: Buffer): boolean {
  return buffer.length >= 24 && buffer.subarray(0, 8).equals(pngSignature) &&
    buffer.readUInt32BE(16) > 0 && buffer.readUInt32BE(20) > 0;
}

export async function createReviewQrSvg(loadLogo: () => Promise<Buffer> = () => readFile(QR_LOGO_ASSET)): Promise<string> {
  const svg = await QRCode.toString(REVIEW_QR_TARGET, REVIEW_QR_OPTIONS);
  let logo: Buffer;

  try {
    logo = await loadLogo();
    if (!isValidPng(logo)) throw new Error("Invalid PNG logo");
  } catch {
    console.warn("Review QR logo unavailable; returning a plain QR.");
    return svg;
  }

  const viewBox = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  if (!viewBox || viewBox[1] !== viewBox[2]) throw new Error("Unexpected QR SVG dimensions.");

  const width = Number(viewBox[1]);
  const plate = width * QR_LOGO_PLATE_RATIO;
  const inset = width * 0.15;
  const image = width * QR_LOGO_IMAGE_RATIO;
  const centered = (size: number) => ((width - size) / 2).toFixed(3);
  const logoMarkup = `<rect x="${centered(plate)}" y="${centered(plate)}" width="${plate.toFixed(3)}" height="${plate.toFixed(3)}" rx="0.6" fill="#FFFFFF"/>` +
    `<rect x="${centered(inset)}" y="${centered(inset)}" width="${inset.toFixed(3)}" height="${inset.toFixed(3)}" rx="0.4" fill="#191916"/>` +
    `<image x="${centered(image)}" y="${centered(image)}" width="${image.toFixed(3)}" height="${image.toFixed(3)}" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,${logo.toString("base64")}"/>`;

  return svg.replace("</svg>", `${logoMarkup}</svg>`);
}
