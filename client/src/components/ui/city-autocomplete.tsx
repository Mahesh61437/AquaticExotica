import React, { useState, useEffect, useRef } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { autocompleteCity } from "@/lib/india-states-cities";

interface CityAutocompleteProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  stateName: string | undefined;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CityAutocomplete({
  value = "",
  onValueChange,
  stateName = "",
  placeholder = "Select city...",
  disabled = false,
  className,
}: CityAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [filteredCities, setFilteredCities] = useState<{ name: string; state: string }[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset input value when state changes
  useEffect(() => {
    setInputValue(value || "");
  }, [value, stateName]);

  // Get cities for the selected state
  useEffect(() => {
    if (stateName) {
      const cities = autocompleteCity(stateName, inputValue);
      setFilteredCities(cities);
    } else {
      setFilteredCities([]);
    }
  }, [stateName, inputValue]);

  // Reset selected index when filtered cities change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [filteredCities]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onValueChange(newValue);
    setOpen(true);
  };

  // Handle city selection
  const handleCitySelect = (cityName: string) => {
    setInputValue(cityName);
    onValueChange(cityName);
    setOpen(false);
    setSelectedIndex(-1);
  };

  // Handle dropdown toggle
  const handleDropdownToggle = () => {
    if (!open && stateName) {
      setOpen(true);
      // When opening, show all cities for the state
      const allCities = autocompleteCity(stateName, "");
      setFilteredCities(allCities);
    } else {
      setOpen(false);
      setSelectedIndex(-1);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        handleDropdownToggle();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < filteredCities.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredCities.length) {
          handleCitySelect(filteredCities[selectedIndex].name);
        } else if (inputValue && filteredCities.length === 0) {
          // Allow custom city entry
          setOpen(false);
        }
        break;
      case "Escape":
        setOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (stateName) {
              setOpen(true);
              // Show all cities when focusing
              const allCities = autocompleteCity(stateName, "");
              setFilteredCities(allCities);
            }
          }}
          placeholder={stateName ? placeholder : "Select state first"}
          disabled={disabled || !stateName}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={handleDropdownToggle}
          disabled={disabled || !stateName}
        >
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </div>

      {open && filteredCities.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredCities.map((city, index) => (
            <button
              key={city.name}
              type="button"
              className={cn(
                "w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none",
                selectedIndex === index && "bg-gray-100",
                value === city.name && "bg-primary/10"
              )}
              onClick={() => handleCitySelect(city.name)}
            >
              <div className="flex items-center justify-between">
                <span className="truncate">{city.name}</span>
                {value === city.name && <Check className="h-4 w-4 text-primary" />}
              </div>
            </button>
          ))}
        </div>
      )}

      {open && inputValue && filteredCities.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3">
          <div className="flex items-center text-sm text-gray-500">
            <Search className="h-4 w-4 mr-2" />
            No cities found. Press Enter to use "{inputValue}"
          </div>
        </div>
      )}
    </div>
  );
} 