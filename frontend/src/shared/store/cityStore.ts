import { create } from 'zustand';
import type { City } from '@/shared/types';

const STORAGE_KEY = 'bookkaroo_city';

interface CityState {
  selectedCity: City | null;
  cities: City[];
}

interface CityActions {
  setCity: (city: City) => void;
  loadCities: (cities: City[]) => void;
  initFromStorage: () => void;
}

export const useCityStore = create<CityState & CityActions>((set) => ({
  selectedCity: null,
  cities: [],

  setCity: (city) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(city));
    } catch { /* ignore quota errors */ }
    set({ selectedCity: city });
  },

  loadCities: (cities) => set({ cities }),

  initFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) set({ selectedCity: JSON.parse(raw) as City });
    } catch { /* ignore parse errors */ }
  },
}));
