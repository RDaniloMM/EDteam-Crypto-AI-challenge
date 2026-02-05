"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import Image from "next/image";

interface CryptoSuggestion {
  id: string;
  name: string;
  symbol: string;
  thumb?: string;
  market_cap_rank?: number | null;
}

interface CryptoAutocompleteProps {
  onSelect: (crypto: CryptoSuggestion) => void;
  placeholder?: string;
}

export function CryptoAutocomplete({
  onSelect,
  placeholder = "Buscar criptomoneda...",
}: CryptoAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CryptoSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Búsqueda con debounce
  const searchCryptos = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.coins || []);
      }
    } catch (error) {
      console.error("Error searching cryptos:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce la búsqueda
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchCryptos(query);
      }, 300);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchCryptos]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Manejo de teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (crypto: CryptoSuggestion) => {
    onSelect(crypto);
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div
      ref={containerRef}
      className='relative'
    >
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
        <input
          ref={inputRef}
          type='text'
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className='w-full pl-9 pr-9 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'
          aria-label='Buscar criptomoneda'
          aria-expanded={isOpen && suggestions.length > 0}
          aria-controls='crypto-suggestions-list'
          aria-autocomplete='list'
          role='combobox'
        />
        {isLoading && (
          <Loader2 className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin' />
        )}
      </div>

      {/* Dropdown de sugerencias */}
      {isOpen && suggestions.length > 0 && (
        <ul
          id='crypto-suggestions-list'
          className='absolute z-50 w-full mt-1 py-1 bg-background border rounded-lg shadow-lg max-h-64 overflow-y-auto'
          role='listbox'
        >
          {suggestions.slice(0, 10).map((crypto, index) => (
            <li
              key={crypto.id}
              onClick={() => handleSelect(crypto)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                selectedIndex === index
                  ? "bg-amber-100 dark:bg-amber-900/30"
                  : "hover:bg-muted"
              }`}
              role='option'
              aria-selected={selectedIndex === index}
            >
              {crypto.thumb && (
                <Image
                  src={crypto.thumb}
                  alt={crypto.name}
                  width={24}
                  height={24}
                  className='rounded-full'
                />
              )}
              <div className='flex-1 min-w-0'>
                <div className='font-medium text-sm truncate'>
                  {crypto.name}
                </div>
                <div className='text-xs text-muted-foreground'>
                  {crypto.symbol.toUpperCase()}
                  {crypto.market_cap_rank && (
                    <span className='ml-2'>#{crypto.market_cap_rank}</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Mensaje cuando no hay resultados */}
      {isOpen &&
        query.length >= 2 &&
        !isLoading &&
        suggestions.length === 0 && (
          <div className='absolute z-50 w-full mt-1 py-3 px-4 bg-background border rounded-lg shadow-lg text-sm text-muted-foreground text-center'>
            No se encontraron criptomonedas
          </div>
        )}
    </div>
  );
}
