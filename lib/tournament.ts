// Single source of truth for everything the page, the form and the API route
// need to agree on. Change a start time here and it changes in all three.

export const CATEGORIES = [
  { name: "Női", time: "Szeptember 27. 15:00" },
  { name: "Kezdő", time: "Szeptember 27. 9:00" },
  { name: "Középhaladó", time: "Szeptember 26. 9:00" },
  { name: "Haladó", time: "Szeptember 26. 15:00" },
] as const;

// The panel on the right lists them by day rather than by prestige.
export const SCHEDULE = [
  { name: "Kezdő", time: "Szeptember 27. 9:00" },
  { name: "Női", time: "Szeptember 27. 15:00" },
  { name: "Középhaladó", time: "Szeptember 26. 9:00" },
  { name: "Haladó", time: "Szeptember 26. 15:00" },
] as const;

export const SIZES = ["S", "M", "L", "XL"] as const;

export const SOURCES = [
  { value: "social", label: "Közösségi médián (Facebook vagy Instagram)" },
  { value: "messenger", label: "Messenger csoportban" },
  { value: "referral", label: "Valaki ajánlásából / meghívásából" },
] as const;

export const ENTRY_FEE = "12 000 Ft / fő";
export const VENUE = "Oázis Padel, Mosonmagyaróvár, Éger utca 2.";
export const PHONE = "06 20 611 3608";
export const PHONE_HREF = "tel:+36206113608";

export type CategoryName = (typeof CATEGORIES)[number]["name"];
export type Size = (typeof SIZES)[number];
export type SourceValue = (typeof SOURCES)[number]["value"];
export type Mode = "pair" | "solo";

export const CATEGORY_NAMES: readonly string[] = CATEGORIES.map((c) => c.name);
export const SOURCE_VALUES: readonly string[] = SOURCES.map((s) => s.value);
