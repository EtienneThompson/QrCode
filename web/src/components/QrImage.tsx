import QRCode from "qrcode";
import { useEffect, useState } from "react";

const OPTIONS = { margin: 2, errorCorrectionLevel: "M" as const };

export default function QrImage({ value, size = 220 }: { value: string; size?: number }) {
  const [src, setSrc] = useState<string>();

  useEffect(() => {
    QRCode.toDataURL(value, { ...OPTIONS, width: size * 2 }).then(setSrc);
  }, [value, size]);

  return src ? (
    <img className="qr" src={src} width={size} height={size} alt={`QR code for ${value}`} />
  ) : (
    <div className="qr" style={{ width: size, height: size }} />
  );
}

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
}

export async function downloadPng(value: string, filename: string) {
  download(await QRCode.toDataURL(value, { ...OPTIONS, width: 1024 }), `${filename}.png`);
}

export async function downloadSvg(value: string, filename: string) {
  const svg = await QRCode.toString(value, { ...OPTIONS, type: "svg" });
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  download(url, `${filename}.svg`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
