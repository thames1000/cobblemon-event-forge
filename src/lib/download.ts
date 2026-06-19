"use client";

/** Browser download helpers. Kept out of the pure lib so node/tests don't pull in DOM. */

export function downloadBlob(data: BlobPart, filename: string, type: string) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // give the browser a tick to start the download before revoking
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(text: string, filename: string) {
  downloadBlob(text, filename, "text/plain;charset=utf-8");
}

export function downloadZip(bytes: Uint8Array, filename: string) {
  // copy into a fresh ArrayBuffer so the Blob gets a clean, correctly sized buffer
  const ab = bytes.slice().buffer;
  downloadBlob(ab, filename, "application/zip");
}
