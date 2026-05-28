import { Camera } from "lucide-react";
import { BASE_URL } from "@/lib/http";

type Props = {
  imagemUrl?: string | null;
  alt?: string;
  className?: string;
};

export function ProdutoImagem({ imagemUrl, alt = "", className = "h-10 w-10 rounded object-cover" }: Props) {
  if (imagemUrl) {
    return (
      <img
        src={imagemUrl.startsWith("blob:") ? imagemUrl : `${BASE_URL}${imagemUrl}`}
        alt={alt}
        className={className}
      />
    );
  }

  return (
    <div className={`${className} flex items-center justify-center rounded bg-muted text-muted-foreground/40`}>
      <Camera className="h-1/2 w-1/2" />
    </div>
  );
}
