import { useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStored(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  };

  return [stored, setValue];
}

export function useRecentSearches() {
  const MAX = 5;
  const KEY = 'bookkaroo_recent_searches';
  const [searches, setSearches] = useLocalStorage<string[]>(KEY, []);

  const add = (query: string) => {
    const updated = [query, ...searches.filter((s) => s !== query)].slice(0, MAX);
    setSearches(updated);
  };

  const clear = () => setSearches([]);

  return { searches, add, clear };
}
