"use client";

import { useRef, useState } from "react";
import { downloadText } from "@/lib/download";

/**
 * Export / Import config toolbar — drops into any generator page so an event can
 * be saved to JSON and re-imported to edit & re-run later. Encapsulates the
 * hidden file input, parse-error handling, and the download. The page supplies
 * its type's `toPortable`/`fromPortable` and handles the imported config.
 */
export default function ConfigPortIO<T>({
  config,
  filename,
  toPortable,
  fromPortable,
  onImport,
  exportDisabled,
  hint,
}: {
  config: T;
  /** Suggested download file name, e.g. `${slug}.safari.json`. */
  filename: string;
  toPortable: (c: T) => string;
  fromPortable: (text: string) => T;
  onImport: (c: T) => void;
  exportDisabled?: boolean;
  /** Optional helper line shown under the buttons when there's no error. */
  hint?: string;
}) {
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const doImport = (file: File) => {
    file
      .text()
      .then((txt) => {
        onImport(fromPortable(txt));
        setError("");
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "could not read that file"));
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          className="btn-ghost px-2.5 py-1 text-xs"
          onClick={() => downloadText(toPortable(config), filename)}
          disabled={exportDisabled}
          title="Save this as a JSON you can re-import later"
        >
          ⬇ Export config
        </button>
        <button
          className="btn-ghost px-2.5 py-1 text-xs"
          onClick={() => fileInput.current?.click()}
          title="Load a saved config (or the *_config.json from a downloaded bundle)"
        >
          ⬆ Import config
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) doImport(f);
            e.target.value = "";
          }}
        />
      </div>
      {error ? (
        <p className="text-[11px] text-red-300">⚠ Import failed: {error}</p>
      ) : hint ? (
        <p className="text-[11px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
