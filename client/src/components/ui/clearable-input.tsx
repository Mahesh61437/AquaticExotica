import React, { useState } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClearableInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  showClearButton?: boolean;
}

export function ClearableInput({ 
  value, 
  onChange, 
  onClear, 
  showClearButton = true,
  className,
  ...props 
}: ClearableInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && String(value).length > 0;

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Create a synthetic change event
    const syntheticEvent = {
      target: { value: "" }
    } as React.ChangeEvent<HTMLInputElement>;
    
    if (onChange) {
      onChange(syntheticEvent);
    }
    
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn("pr-8", className)}
        {...props}
      />
      {showClearButton && hasValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-2 py-1 hover:bg-transparent"
          onClick={handleClear}
        >
          <X className="h-4 w-4 opacity-50 hover:opacity-100" />
        </Button>
      )}
    </div>
  );
} 