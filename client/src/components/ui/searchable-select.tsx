import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface SelectOption {
  id: number;
  name: string;
  code?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: number | null;
  onSelect: (value: number | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  "data-testid"?: string;
}

export function SearchableSelect({
  options,
  value,
  onSelect,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled = false,
  isLoading = false,
  className,
  "data-testid": testId,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((option) => option.id === value);

  const filteredOptions = searchQuery
    ? options.filter(
        (option) =>
          option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (option.code && option.code.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearchQuery("");
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleSelect = (optionId: number) => {
    onSelect(optionId === value ? null : optionId);
    setOpen(false);
    setSearchQuery("");
  };

  const handleToggle = () => {
    if (!disabled && !isLoading) {
      setOpen(!open);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        onClick={handleToggle}
        className={cn(
          "w-full justify-between font-normal",
          !value && "text-muted-foreground",
          className
        )}
        disabled={disabled || isLoading}
        data-testid={testId}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </span>
        ) : selectedOption ? (
          <span className="truncate">
            {selectedOption.name}
            {selectedOption.code && ` (${selectedOption.code})`}
          </span>
        ) : (
          placeholder
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              ref={inputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              data-testid={testId ? `${testId}-search` : undefined}
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === option.id && "bg-accent"
                  )}
                  onClick={() => handleSelect(option.id)}
                  data-testid={testId ? `${testId}-option-${option.id}` : undefined}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option.name}</span>
                  {option.code && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {option.code}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
