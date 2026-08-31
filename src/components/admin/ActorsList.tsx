"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Eye, CheckCircle2, Circle, ChevronDown, Ban, Play, ArrowUpDown } from "lucide-react";
import { Tag } from "@/components/ui/Tag";
import { VideoModal } from "@/components/client/VideoModal";
import { CopyActorLinkButton } from "@/components/admin/CopyActorLinkButton";
import { AGE_RANGES, PROFILE_TYPES, PROFILE_TYPE_EMOJIS, BLACKLIST_REASONS, type Actor, type BlacklistReason, type UserRole } from "@/lib/types";
import { abbreviateLanguage } from "@/lib/utils";

function ProfileTypeEmojis({ profileTypes }: { profileTypes: string[] }) {
  if (profileTypes.length === 0) return <span className="text-gray-400 text-xs">—</span>;
  return (
    <span className="inline-flex items-center gap-0.5" title={profileTypes.join(", ")}>
      {profileTypes.map((pt) => (
        <span key={pt}>{PROFILE_TYPE_EMOJIS[pt as keyof typeof PROFILE_TYPE_EMOJIS] ?? ""}</span>
      ))}
    </span>
  );
}

interface ActorsListProps {
  actors: Actor[];
  role: UserRole;
  latestBlacklistReasons?: Record<string, { reason: string; reason_detail: string | null }>;
}

function VideoCell({ actor }: { actor: Actor }) {
  const [showIndex, setShowIndex] = useState<number | null>(null);
  const allVideos = [
    ...(actor.video_urls || []),
    ...(actor.video_url && !(actor.video_urls || []).includes(actor.video_url)
      ? [actor.video_url]
      : []),
  ].filter(Boolean);

  if (allVideos.length === 0) {
    return <span className="text-gray-400 text-xs">—</span>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowIndex(0)}
        className="flex items-center gap-1 text-sm text-primary hover:underline cursor-pointer"
      >
        <Play className="w-3.5 h-3.5" />
        {allVideos.length}
      </button>
      {showIndex !== null && (
        <VideoModal
          open={true}
          onClose={() => setShowIndex(null)}
          videoUrl={allVideos[showIndex]}
          actorName={actor.display_name || actor.name}
        />
      )}
    </>
  );
}

function MultiSelectDropdown({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <details className="relative">
      <summary
        className="flex items-center gap-2 px-3 py-1.5 rounded-btn border border-gray-200 bg-white text-sm text-dark cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-primary/30 [&::-webkit-details-marker]:hidden [&::marker]:hidden"
      >
        {selected.length === 0
          ? "Toutes"
          : `${selected.length} sélectionnée${selected.length > 1 ? "s" : ""}`}
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </summary>
      <div className="absolute z-10 mt-1 min-w-[200px] max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-btn shadow-lg p-2 space-y-0.5">
        {options.length === 0 ? (
          <p className="text-xs text-gray-400 px-2 py-1.5">Aucune option disponible</p>
        ) : (
          options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 px-2 py-1.5 rounded-btn hover:bg-gray-100 cursor-pointer text-sm text-dark"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => onToggle(opt)}
                className="cursor-pointer"
              />
              {opt}
            </label>
          ))
        )}
      </div>
    </details>
  );
}

function BlacklistReasonPicker({
  onConfirm,
}: {
  onConfirm: (reason: BlacklistReason, detail: string) => void;
}) {
  const [detailsRef, setDetailsRef] = useState<HTMLDetailsElement | null>(null);
  const [reason, setReason] = useState<BlacklistReason>(BLACKLIST_REASONS[0]);
  const [detail, setDetail] = useState("");

  function handleConfirm() {
    if (reason === "Autre" && !detail.trim()) return;
    onConfirm(reason, detail.trim());
    setReason(BLACKLIST_REASONS[0]);
    setDetail("");
    if (detailsRef) detailsRef.open = false;
  }

  return (
    <details ref={setDetailsRef} className="relative">
      <summary
        title="Blacklister cet acteur"
        className="p-1.5 rounded-btn text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden [&::marker]:hidden"
      >
        <Ban className="w-4 h-4" />
      </summary>
      <div className="absolute z-10 right-0 mt-1 w-64 bg-white border border-gray-200 rounded-btn shadow-lg p-3 space-y-2">
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
          Motif
        </label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value as BlacklistReason)}
          className="w-full px-3 py-1.5 rounded-btn border border-gray-200 bg-white text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
        >
          {BLACKLIST_REASONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        {reason === "Autre" && (
          <input
            type="text"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Précisez le motif"
            className="w-full px-3 py-1.5 rounded-btn border border-gray-200 bg-white text-sm text-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        )}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={reason === "Autre" && !detail.trim()}
          className="w-full px-3 py-1.5 rounded-btn text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Blacklister
        </button>
      </div>
    </details>
  );
}

export function ActorsList({ actors, role, latestBlacklistReasons = {} }: ActorsListProps) {
  const router = useRouter();
  const isReadOnly = role === "catalogue";
  const [tab, setTab] = useState<"all" | "blacklisted">("all");
  const [search, setSearch] = useState("");
  const [filterSex, setFilterSex] = useState<"Femme" | "Homme" | null>(null);
  const [filterOrigin, setFilterOrigin] = useState<"fr" | "uae" | null>(null);
  const [filterProfileTypes, setFilterProfileTypes] = useState<string[]>([]);
  const [filterAge, setFilterAge] = useState<string[]>([]);
  const [filterCity, setFilterCity] = useState<string | null>(null);
  const [filterLanguages, setFilterLanguages] = useState<string[]>([]);
  const [filterWorked, setFilterWorked] = useState<boolean | null>(null);
  const [sortOrder, setSortOrder] = useState<"recent" | "ancien" | "phone">("recent");
  const [workedWith, setWorkedWith] = useState<Record<string, boolean>>(
    () => Object.fromEntries(actors.map((a) => [a.id, a.has_worked_with_us]))
  );
  const [blacklisted, setBlacklisted] = useState<Record<string, boolean>>(
    () => Object.fromEntries(actors.map((a) => [a.id, a.is_blacklisted]))
  );

  const allCities = Array.from(new Set(actors.flatMap((a) => a.cities))).sort();
  const allLanguages = Array.from(new Set(actors.flatMap((a) => a.languages || []))).sort();

  const hasActiveFilters = filterSex !== null || filterOrigin !== null || filterProfileTypes.length > 0 || filterAge.length > 0 || filterCity !== null || filterLanguages.length > 0 || filterWorked !== null;

  const blacklistedCount = actors.filter((a) => blacklisted[a.id]).length;
  const nonBlacklistedCount = actors.length - blacklistedCount;

  const baseList = actors.filter((actor) =>
    tab === "blacklisted" ? blacklisted[actor.id] : !blacklisted[actor.id]
  );

  const filtered = baseList.filter((actor) => {
    if (tab === "all") {
      if (filterSex && actor.sex !== filterSex) return false;
      if (filterOrigin && actor.origin !== filterOrigin) return false;
      if (filterProfileTypes.length > 0 && !filterProfileTypes.some((pt) => (actor.profile_types as string[]).includes(pt))) return false;
      if (filterAge.length > 0 && !filterAge.some((r) => actor.age_ranges.includes(r))) return false;
      if (filterCity && !actor.cities.includes(filterCity)) return false;
      if (filterLanguages.length > 0 && !filterLanguages.some((l) => (actor.languages || []).includes(l))) return false;
      if (filterWorked !== null && workedWith[actor.id] !== filterWorked) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        actor.name.toLowerCase().includes(q) ||
        (actor.display_name && actor.display_name.toLowerCase().includes(q)) ||
        actor.cities.some((c) => c.toLowerCase().includes(q)) ||
        (actor.phone && actor.phone.toLowerCase().includes(q))
      );
    }
    return true;
  }).sort((a, b) => {
    if (sortOrder === "phone") {
      if (!a.phone && !b.phone) return 0;
      if (!a.phone) return 1;
      if (!b.phone) return -1;
      return a.phone.localeCompare(b.phone);
    }
    return sortOrder === "recent"
      ? +new Date(b.created_at) - +new Date(a.created_at)
      : +new Date(a.created_at) - +new Date(b.created_at);
  });

  async function unblacklistActor(actorId: string) {
    setBlacklisted((prev) => ({ ...prev, [actorId]: false }));
    const res = await fetch(`/api/actors/${actorId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_blacklisted: false }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      setBlacklisted((prev) => ({ ...prev, [actorId]: true }));
    }
  }

  async function blacklistActor(actorId: string, reason: BlacklistReason, detail: string) {
    setBlacklisted((prev) => ({ ...prev, [actorId]: true }));
    const res = await fetch(`/api/actors/${actorId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        is_blacklisted: true,
        reason,
        reason_detail: reason === "Autre" ? detail : undefined,
      }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      setBlacklisted((prev) => ({ ...prev, [actorId]: false }));
    }
  }

  async function toggleWorkedWith(actorId: string) {
    const current = workedWith[actorId];
    setWorkedWith((prev) => ({ ...prev, [actorId]: !current }));
    const res = await fetch(`/api/actors/${actorId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ has_worked_with_us: !current }),
    });
    if (!res.ok) {
      setWorkedWith((prev) => ({ ...prev, [actorId]: current }));
    }
  }

  return (
    <>
      {/* Onglets */}
      {!isReadOnly && (
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {([
            ["all", `Tous (${nonBlacklistedCount})`],
            ["blacklisted", `Blacklistés (${blacklistedCount})`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
                tab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Filtres */}
      {tab === "all" && (
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        {/* Sexe */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Sexe</span>
          <div className="flex gap-1">
            {(["Femme", "Homme"] as const).map((sex) => (
              <button
                key={sex}
                type="button"
                onClick={() => setFilterSex(filterSex === sex ? null : sex)}
                className={`px-3 py-1.5 rounded-btn text-sm font-medium transition-colors cursor-pointer ${
                  filterSex === sex
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {sex}
              </button>
            ))}
          </div>
        </div>

        {/* Origine */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Origine</span>
          <div className="flex gap-1">
            {([
              ["fr", "France"],
              ["uae", "UAE"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilterOrigin(filterOrigin === value ? null : value)}
                className={`px-3 py-1.5 rounded-btn text-sm font-medium transition-colors cursor-pointer ${
                  filterOrigin === value
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Type de profil */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Type de profil</span>
          <MultiSelectDropdown
            options={PROFILE_TYPES}
            selected={filterProfileTypes}
            onToggle={(pt) =>
              setFilterProfileTypes((prev) =>
                prev.includes(pt) ? prev.filter((p) => p !== pt) : [...prev, pt]
              )
            }
          />
        </div>

        {/* Âge */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Âge</span>
          <MultiSelectDropdown
            options={AGE_RANGES}
            selected={filterAge}
            onToggle={(range) =>
              setFilterAge((prev) =>
                prev.includes(range) ? prev.filter((r) => r !== range) : [...prev, range]
              )
            }
          />
        </div>

        {/* Ville */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Ville</span>
          <select
            value={filterCity ?? ""}
            onChange={(e) => setFilterCity(e.target.value || null)}
            className="px-3 py-1.5 rounded-btn border border-gray-200 bg-white text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
          >
            <option value="">Toutes</option>
            {allCities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Langues */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Langues</span>
          <MultiSelectDropdown
            options={allLanguages}
            selected={filterLanguages}
            onToggle={(lang) =>
              setFilterLanguages((prev) =>
                prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
              )
            }
          />
        </div>

        {/* A tourné */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Expérience</span>
          <select
            value={filterWorked === null ? "" : String(filterWorked)}
            onChange={(e) => setFilterWorked(e.target.value === "" ? null : e.target.value === "true")}
            className="px-3 py-1.5 rounded-btn border border-gray-200 bg-white text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
          >
            <option value="">Toutes</option>
            <option value="true">A tourné</option>
            <option value="false">Jamais tourné</option>
          </select>
        </div>

        {/* Réinitialiser */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => { setFilterSex(null); setFilterOrigin(null); setFilterProfileTypes([]); setFilterAge([]); setFilterCity(null); setFilterLanguages([]); setFilterWorked(null); }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-600 cursor-pointer self-end"
          >
            <X className="w-3.5 h-3.5" />
            Réinitialiser
          </button>
        )}
      </div>
      )}

      {/* Barre de recherche + tri */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-btn border border-gray-200 bg-white text-sm text-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
          {search && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="relative flex-shrink-0">
          <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "recent" | "ancien" | "phone")}
            className="pl-9 pr-4 py-3 rounded-btn border border-gray-200 bg-white text-sm text-gray-600 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer appearance-none"
          >
            <option value="recent">Plus récents</option>
            <option value="ancien">Plus anciens</option>
            <option value="phone">Numéro de téléphone</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-card border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Photo</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Nom</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Sexe</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Âge</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Ville</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Langues</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Vidéo</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Tourné</th>
              {tab === "blacklisted" && (
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Motif</th>
              )}
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((actor) => (
              <tr key={actor.id} className="hover:bg-gray-100/50 transition-colors">
                <td className="px-6 py-4">
                  {actor.photo_url ? (
                    <Image
                      src={actor.photo_url}
                      alt={actor.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-heading font-semibold text-sm">
                      {actor.name[0]}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-dark text-sm">{actor.name}</p>
                    <ProfileTypeEmojis profileTypes={actor.profile_types} />
                    {actor.origin === "uae" && (
                      <span className="px-2 py-0.5 rounded-pill bg-blue-50 text-blue-600 text-xs font-medium">
                        🇦🇪 UAE
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Tag variant={actor.sex === "Femme" ? "female" : "male"}>{actor.sex}</Tag>
                </td>
                <td className="px-6 py-4">
                  {actor.age_ranges[0] ? (
                    <Tag variant="age">{actor.age_ranges[0]}</Tag>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {actor.cities[0] ? (
                    <Tag variant="city">{actor.cities[0]}</Tag>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {(actor.languages || []).length === 0 ? (
                    <span className="text-gray-400 text-xs">—</span>
                  ) : (
                    <span className="text-sm text-dark">
                      {(actor.languages || []).map(abbreviateLanguage).join(" · ")}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <VideoCell actor={actor} />
                </td>
                <td className="px-6 py-4">
                  {isReadOnly ? (
                    <Tag variant="experience">
                      {workedWith[actor.id] ? "A tourné" : "Jamais tourné"}
                    </Tag>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleWorkedWith(actor.id)}
                      title={workedWith[actor.id] ? "A tourné avec nous — cliquer pour retirer" : "N'a pas encore tourné — cliquer pour confirmer"}
                      className="cursor-pointer"
                    >
                      {workedWith[actor.id] ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                      )}
                    </button>
                  )}
                </td>
                {tab === "blacklisted" && (
                  <td className="px-6 py-4">
                    {latestBlacklistReasons[actor.id] ? (
                      <span className="text-sm text-dark">
                        {latestBlacklistReasons[actor.id].reason}
                        {latestBlacklistReasons[actor.id].reason === "Autre" &&
                          latestBlacklistReasons[actor.id].reason_detail &&
                          ` — ${latestBlacklistReasons[actor.id].reason_detail}`}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                )}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {!isReadOnly && (
                      blacklisted[actor.id] ? (
                        <button
                          type="button"
                          onClick={() => unblacklistActor(actor.id)}
                          title="Blacklisté — cliquer pour retirer"
                          className="p-1.5 rounded-btn text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <BlacklistReasonPicker
                          onConfirm={(reason, detail) => blacklistActor(actor.id, reason, detail)}
                        />
                      )
                    )}
                    <a
                      href={`/a/${actor.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-btn text-gray-400 hover:text-primary hover:bg-primary-light transition-colors"
                      title="Voir le profil public"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    <CopyActorLinkButton actorId={actor.id} />
                    {!isReadOnly && (
                      <Link
                        href={`/admin/actors/${actor.id}`}
                        className="text-sm text-primary hover:text-primary-dark font-medium"
                      >
                        Modifier
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={tab === "blacklisted" ? 10 : 9} className="px-6 py-12 text-center text-gray-400">
                  {search || hasActiveFilters
                    ? "Aucun acteur trouvé pour ces critères."
                    : tab === "blacklisted"
                      ? "Aucun acteur blacklisté."
                      : "Aucun acteur pour le moment."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}
