import { ActorForm } from "@/components/admin/ActorForm";

export default function NewActorPage() {
  return (
    <div>
      <h1 className="text-2xl font-heading font-semibold text-dark mb-8">
        Ajouter un acteur
      </h1>
      <ActorForm />
    </div>
  );
}
