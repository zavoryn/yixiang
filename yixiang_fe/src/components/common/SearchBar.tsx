import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchService } from "@/services/searchService";

type SearchBarProps = {
  className?: string;
  autoFocus?: boolean;
};

export default function SearchBar({ className = "", autoFocus = false }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim()) {
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await searchService.suggest(value.trim());
          setSuggestions(res.items || []);
          setShowDropdown(true);
        } catch {
          setSuggestions([]);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleSearch = (q?: string) => {
    const term = q || query.trim();
    if (!term) return;
    navigate(`/search?q=${encodeURIComponent(term)}`);
    setShowDropdown(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="h-11 pl-10 pr-10 bg-slate-100 border-0 rounded-xl focus-visible:ring-primary"
          placeholder="搜索帖子、话题..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          autoFocus={autoFocus}
        />
        {query && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => { setQuery(""); setSuggestions([]); setShowDropdown(false); }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white rounded-xl border border-border shadow-lg z-50 py-2 max-h-60 overflow-auto">
          <p className="px-3 py-1 text-xs text-muted-foreground font-medium">搜索建议</p>
          {suggestions.map((s) => (
            <button
              key={s}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
              onClick={() => { setQuery(s); handleSearch(s); }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
