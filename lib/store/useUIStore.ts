import { create } from "zustand";

interface UIState {
  // Common Modals
  isPatientFormOpen: boolean;
  isApptFormOpen: boolean;
  isDeleteConfirmOpen: boolean;
  isProfileOpen: boolean;
  isUserFormOpen: boolean;
  isCatalogFormOpen: boolean;
  isTaxonomyFormOpen: boolean;

  // Dashboard states
  showFilters: boolean;
  showAnalytics: boolean;
  showTodayOnly: boolean;

  // Actions
  setPatientFormOpen: (open: boolean) => void;
  setApptFormOpen: (open: boolean) => void;
  setDeleteConfirmOpen: (open: boolean) => void;
  setProfileOpen: (open: boolean) => void;
  setUserFormOpen: (open: boolean) => void;
  setCatalogFormOpen: (open: boolean) => void;
  setTaxonomyFormOpen: (open: boolean) => void;
  setShowFilters: (show: boolean) => void;
  setShowAnalytics: (show: boolean) => void;
  setShowTodayOnly: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isPatientFormOpen: false,
  isApptFormOpen: false,
  isDeleteConfirmOpen: false,
  isProfileOpen: false,
  isUserFormOpen: false,
  isCatalogFormOpen: false,
  isTaxonomyFormOpen: false,
  showFilters: false,
  showAnalytics: true,
  showTodayOnly: false,

  setPatientFormOpen: (open) => set({ isPatientFormOpen: open }),
  setApptFormOpen: (open) => set({ isApptFormOpen: open }),
  setDeleteConfirmOpen: (open) => set({ isDeleteConfirmOpen: open }),
  setProfileOpen: (open) => set({ isProfileOpen: open }),
  setUserFormOpen: (open) => set({ isUserFormOpen: open }),
  setCatalogFormOpen: (open) => set({ isCatalogFormOpen: open }),
  setTaxonomyFormOpen: (open) => set({ isTaxonomyFormOpen: open }),
  setShowFilters: (show) => set({ showFilters: show }),
  setShowAnalytics: (show) => set({ showAnalytics: show }),
  setShowTodayOnly: (show) => set({ showTodayOnly: show }),
}));
