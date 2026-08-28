const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
const FILE_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

// Défensif : d'anciens fichiers créés avant le fix upload (multer) peuvent avoir un
// base64 brut stocké dans fileUrl au lieu d'un chemin relatif — souvent tronqué par une
// colonne STRING (VARCHAR 255), ce qui casse l'URL. On ne renvoie un lien que si fileUrl
// ressemble à un chemin/URL valide ; sinon on masque silencieusement plutôt que de générer
// un lien cassé.
export function resolveFileUrl(fileUrl: string | null | undefined): string | null {
  if (!fileUrl) return null;
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) return fileUrl;
  if (fileUrl.startsWith("data:")) return null; // legacy corrompu, probablement tronqué
  return `${FILE_ORIGIN}${fileUrl}`;
}