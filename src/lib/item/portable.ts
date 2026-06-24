import { makePortable } from "../portable";
import { DEFAULT_VERSION } from "../datapack/packMeta";
import type { ItemConfig } from "./types";

/** Round-trippable Item Designer config (export to JSON, re-import to edit/re-run). */
const portable = makePortable<ItemConfig>({
  kind: "items",
  version: 1,
  defaults: (): ItemConfig => ({
    title: "Custom Items",
    items: [],
    packFormat: DEFAULT_VERSION.packFormat,
  }),
});

export const ITEM_PORTABLE_TYPE = portable.type;
export const toPortableItems = portable.toPortable;
export const fromPortableItems = portable.fromPortable;
export const normalizeItemConfig = portable.normalize;
