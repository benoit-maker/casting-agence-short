export type UserRole = "super_admin" | "project_manager" | "catalogue";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export type Availability = "flexible" | "weekdays" | "weekends";
export type MicroEntrepreneurStatus = "yes" | "no" | "can_create";

export const PROFILE_TYPES = ["Acteurs", "UGC", "Whitelisting"] as const;
export type ProfileType = typeof PROFILE_TYPES[number];

export const PROFILE_TYPE_EMOJIS: Record<ProfileType, string> = {
  Acteurs: "🎬",
  UGC: "🤳🏻",
  Whitelisting: "📲",
};

export const BLACKLIST_REASONS = ["Indisponible", "Inactif", "Mauvais acting", "Mauvais comportement", "Autre"] as const;
export type BlacklistReason = typeof BLACKLIST_REASONS[number];

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  flexible: "Flexible / À mon compte",
  weekdays: "Certains jours de semaine seulement",
  weekends: "Uniquement le week-end",
};

export const MICRO_ENTREPRENEUR_LABELS: Record<MicroEntrepreneurStatus, string> = {
  yes: "Oui",
  no: "Non",
  can_create: "Non, mais je peux le faire si besoin",
};

export interface Actor {
  id: string;
  name: string;
  display_name: string | null;
  sex: "Femme" | "Homme";
  profile_types: ProfileType[];
  age_ranges: string[];
  cities: string[];
  phone: string | null;
  email: string | null;
  rate: string | null;
  photo_url: string | null;
  video_url: string | null;
  video_urls: string[];
  brands: string[];
  notes: string;
  notion_id: string | null;
  is_active: boolean;
  is_blacklisted: boolean;
  availability: Availability[];
  accepts_rate: boolean | null;
  portfolio_link: string | null;
  micro_entrepreneur_status: MicroEntrepreneurStatus | null;
  languages: string[];
  date_of_birth: string | null;
  has_worked_with_us: boolean;
  referral_source: string | null;
  origin: "fr" | "uae";
  created_at: string;
  updated_at: string;
}

export interface Casting {
  id: string;
  slug: string;
  client_name: string;
  project_name: string | null;
  project_manager_id: string;
  status: "pending" | "selected" | "expired";
  selected_actor_id: string | null;
  selected_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CastingActor {
  id: string;
  casting_id: string;
  actor_id: string;
  position: number;
}

// Type renvoyé par la RPC get_casting_by_slug (côté client public)
export interface PublicActor {
  id: string;
  display_name: string;
  sex: "Femme" | "Homme";
  profile_types: ProfileType[];
  age_ranges: string[];
  cities: string[];
  photo_url: string | null;
  video_url: string | null;
  video_urls: string[];
}

export interface PublicCasting {
  id: string;
  client_name: string;
  project_name: string | null;
  status: "pending" | "selected" | "expired";
  selected_actor_id: string | null;
  actors: PublicActor[];
}

// Casting avec infos jointes pour le back-office
export interface CastingWithDetails extends Casting {
  profiles?: Profile;
  casting_actors?: (CastingActor & { actors?: Actor })[];
  selected_actor?: Actor;
}

export const REFERRAL_SOURCE_LABELS: Record<string, string> = {
  facebook:         "Un groupe Facebook",
  publicite:        "Une publicité",
  bouche_a_oreille: "Le bouche-à-oreille",
  recommandation:   "La recommandation d'une connaissance",
};

export const AGE_RANGES = ["Moins de 18 ans", "18-25 ans", "25-40 ans", "40-55 ans", "55+"] as const;

export const DEFAULT_LANGUAGES = ["Français", "Espagnol", "Anglais"] as const;

export const DEFAULT_CITIES = [
  "Paris", "Marseille", "Lyon", "Toulouse", "Nice",
  "Nantes", "Montpellier", "Strasbourg", "Bordeaux", "Lille",
] as const;

export const RATE_OPTIONS = [
  "30€ vidéos solo / 25€ vidéos duo",
  "40€ vidéos solo / 35€ vidéos duo",
  "50€ vidéos solo / 45€ vidéos duo",
] as const;

export const UAE_CITIES = [
  "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain",
] as const;

export const UAE_AVAILABILITY_LABELS: Record<Availability, string> = {
  flexible: "Flexible / Self-employed",
  weekdays: "Weekdays only",
  weekends: "Weekends only",
};

export const UAE_MICRO_STATUS_LABELS: Record<MicroEntrepreneurStatus, string> = {
  yes:        "Yes, I have a freelance / employment visa",
  no:         "No, I don't have the appropriate visa",
  can_create: "No, but I can obtain one if needed",
};

export const UAE_REFERRAL_SOURCE_LABELS: Record<string, string> = {
  facebook:         "A Facebook group",
  publicite:        "An advertisement",
  bouche_a_oreille: "Word of mouth",
  recommandation:   "A personal recommendation",
};
