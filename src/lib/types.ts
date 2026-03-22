export type UserRole = "super_admin" | "project_manager";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Actor {
  id: string;
  name: string;
  display_name: string | null;
  sex: "Femme" | "Homme";
  age_ranges: string[];
  cities: string[];
  phone: string | null;
  rate: string | null;
  photo_url: string | null;
  video_url: string | null;
  notion_id: string | null;
  is_active: boolean;
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
  age_ranges: string[];
  cities: string[];
  photo_url: string | null;
  video_url: string | null;
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

export const AGE_RANGES = ["18-25 ans", "25-40 ans", "40-55 ans", "55+"] as const;

export const DEFAULT_CITIES = [
  "Paris", "Bordeaux", "Lyon", "Marseille", "Toulouse",
  "Nantes", "Lille", "Strasbourg", "Dax", "Bayonne",
] as const;
