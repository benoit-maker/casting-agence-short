import { cn } from "@/lib/utils";

type TagVariant = "female" | "male" | "age" | "city";

interface TagProps {
  variant: TagVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<TagVariant, string> = {
  female: "bg-tag-female-bg text-tag-female-text",
  male: "bg-tag-male-bg text-tag-male-text",
  age: "bg-tag-age-bg text-tag-age-text",
  city: "bg-tag-city-bg text-tag-city-text",
};

const icons: Record<TagVariant, string> = {
  female: "♀",
  male: "♂",
  age: "",
  city: "📍",
};

export function Tag({ variant, children, className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {icons[variant] && <span>{icons[variant]}</span>}
      {children}
    </span>
  );
}
