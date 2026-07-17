import { useState, useEffect } from "react";
import { CarFront } from "lucide-react";
import { cn } from "@/lib/utils";

interface VehicleImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  iconClassName?: string;
}

// <img> avec repli : si l'URL est vide ou que le chargement échoue
// (lien mort, base64 mal formé, hors-ligne...), affiche une icône
// plutôt que l'icône d'image cassée du navigateur.
export function VehicleImage({ src, alt, className, iconClassName }: VehicleImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}>
        <CarFront className={cn("h-6 w-6 opacity-40", iconClassName)} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}