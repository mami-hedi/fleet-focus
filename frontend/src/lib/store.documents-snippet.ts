// ─────────────────────────────────────────────────────────────────
// À FUSIONNER À LA MAIN dans frontend/src/lib/store.ts existant.
// Ce n'est PAS un fichier de remplacement : je n'ai pas vu le contenu
// actuel de votre store.ts (autres slices : vehicles, etc.), donc je
// ne peux pas générer le fichier complet sans écraser ce qui existe.
// ─────────────────────────────────────────────────────────────────

import * as documentService from "@/lib/documentService";
import type { DocumentDTO, DocumentInput } from "@/lib/documentService";

// 1) Ajoutez ces champs à votre interface d'état existante (ex: FleetState) :
//
// documents: DocumentDTO[];
// documentsLoading: boolean;
// documentsError: string | null;
// fetchDocuments: () => Promise<void>;
// addDocument: (input: DocumentInput) => Promise<void>;
// editDocument: (id: number, input: Partial<DocumentInput>) => Promise<void>;
// removeDocument: (id: number) => Promise<void>;

// 2) Ajoutez ces valeurs/actions dans le create<FleetState>((set, get) => ({ ... }))
//    de votre store, à côté des autres slices (vehicles, etc.) :

  documents: [],
  documentsLoading: false,
  documentsError: null,

  fetchDocuments: async () => {
    set({ documentsLoading: true, documentsError: null });
    try {
      const documents = await documentService.getDocuments();
      set({ documents, documentsLoading: false });
    } catch (err: any) {
      set({ documentsError: err.message ?? "Erreur de chargement", documentsLoading: false });
    }
  },

  addDocument: async (input: DocumentInput) => {
    const created = await documentService.createDocument(input);
    set((state: any) => ({ documents: [...state.documents, created] }));
  },

  editDocument: async (id: number, input: Partial<DocumentInput>) => {
    const updated = await documentService.updateDocument(id, input);
    set((state: any) => ({
      documents: state.documents.map((d: DocumentDTO) => (d.id === id ? updated : d)),
    }));
  },

  removeDocument: async (id: number) => {
    await documentService.deleteDocument(id);
    set((state: any) => ({
      documents: state.documents.filter((d: DocumentDTO) => d.id !== id),
    }));
  },