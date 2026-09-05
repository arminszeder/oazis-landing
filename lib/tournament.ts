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

// Entrants come from the tri-border area, so the dial code is a choice rather
// than an assumption. Picking the country fills the prefix in for them.
export const PHONE_COUNTRIES = [
  { code: "HU", name: "Magyarország", prefix: "+36", example: "20 611 3608" },
  { code: "AT", name: "Ausztria", prefix: "+43", example: "660 1234567" },
  { code: "SK", name: "Szlovákia", prefix: "+421", example: "901 234 567" },
] as const;

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
export type CountryCode = (typeof PHONE_COUNTRIES)[number]["code"];

export const CATEGORY_NAMES: readonly string[] = CATEGORIES.map((c) => c.name);
export const SOURCE_VALUES: readonly string[] = SOURCES.map((s) => s.value);
export const PHONE_PREFIXES: readonly string[] = PHONE_COUNTRIES.map((c) => c.prefix);
