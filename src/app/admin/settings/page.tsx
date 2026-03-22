"use client";

import { useState, useEffect } from "react";
import { Plus, Shield, UserCog } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import type { Profile } from "@/lib/types";

export default function SettingsPage() {
  const supabase = createClient();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at");
    setProfiles((data as Profile[]) || []);
    setLoading(false);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    // Use admin API via edge function or direct call
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: newEmail,
        password: newPassword,
        fullName: newName,
      }),
    });

    if (res.ok) {
      setShowForm(false);
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      fetchProfiles();
    } else {
      alert("Erreur lors de la création du compte");
    }

    setCreating(false);
  }

  async function toggleRole(profile: Profile) {
    const newRole =
      profile.role === "super_admin" ? "project_manager" : "super_admin";
    await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", profile.id);
    fetchProfiles();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-heading font-semibold text-dark">
          Paramètres
        </h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" />
          Ajouter un compte
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-heading font-semibold text-dark mb-4">
            Nouveau compte
          </h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                id="newName"
                label="Nom complet"
                placeholder="Jean Dupont"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <Input
                id="newEmail"
                label="Email"
                type="email"
                placeholder="jean@agenceshort.fr"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
              <Input
                id="newPassword"
                label="Mot de passe"
                type="password"
                placeholder="Min. 6 caractères"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={creating}>
                Créer le compte
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForm(false)}
              >
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                Nom
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                Email
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                Rôle
              </th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                  Chargement...
                </td>
              </tr>
            ) : (
              profiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-gray-100/50">
                  <td className="px-6 py-4 text-sm font-medium text-dark">
                    {profile.full_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {profile.email}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-medium ${
                        profile.role === "super_admin"
                          ? "bg-primary-light text-primary"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {profile.role === "super_admin" ? (
                        <Shield className="w-3 h-3" />
                      ) : (
                        <UserCog className="w-3 h-3" />
                      )}
                      {profile.role === "super_admin"
                        ? "Super Admin"
                        : "Chef de projet"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleRole(profile)}
                      className="text-sm text-primary hover:text-primary-dark font-medium cursor-pointer"
                    >
                      {profile.role === "super_admin"
                        ? "Rétrograder"
                        : "Promouvoir admin"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
