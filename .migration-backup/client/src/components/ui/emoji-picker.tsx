import { useState, useRef, useEffect } from "react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function EmojiPicker({ 
  onEmojiSelect, 
  disabled = false, 
  className = "",
  triggerClassName = "" 
}: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  
  const handleEmojiSelect = (emoji: any) => {
    onEmojiSelect(emoji.native);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          className={triggerClassName}
          data-testid="button-emoji-picker"
        >
          <Smile className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={`w-auto p-0 border-0 shadow-lg ${className}`} 
        side="top" 
        align="start"
        sideOffset={8}
      >
        <Picker
          data={data}
          onEmojiSelect={handleEmojiSelect}
          theme="light"
          previewPosition="none"
          skinTonePosition="none"
          searchPosition="top"
          navPosition="bottom"
          perLine={8}
          maxFrequentRows={2}
        />
      </PopoverContent>
    </Popover>
  );
}

interface EmojiInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function EmojiInput({ 
  value, 
  onChange, 
  placeholder = "Type a message...",
  disabled = false,
  className = ""
}: EmojiInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  useEffect(() => {
    if (cursorPosition !== null && inputRef.current) {
      inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      setCursorPosition(null);
    }
  }, [cursorPosition]);

  const handleEmojiSelect = (emoji: string) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newValue = value.slice(0, start) + emoji + value.slice(end);
      onChange(newValue);
      setCursorPosition(start + emoji.length);
      input.focus();
    } else {
      onChange(value + emoji);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1"
        data-testid="input-emoji-text"
      />
      <EmojiPicker onEmojiSelect={handleEmojiSelect} disabled={disabled} />
    </div>
  );
}

interface EmojiTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  className?: string;
}

export function EmojiTextarea({ 
  value, 
  onChange, 
  placeholder = "Type a message...",
  disabled = false,
  rows = 3,
  className = ""
}: EmojiTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  useEffect(() => {
    if (cursorPosition !== null && textareaRef.current) {
      textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
      setCursorPosition(null);
    }
  }, [cursorPosition]);

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const newValue = value.slice(0, start) + emoji + value.slice(end);
      onChange(newValue);
      setCursorPosition(start + emoji.length);
      textarea.focus();
    } else {
      onChange(value + emoji);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className="w-full pr-10 resize-none"
        data-testid="textarea-emoji"
      />
      <div className="absolute bottom-2 right-2">
        <EmojiPicker onEmojiSelect={handleEmojiSelect} disabled={disabled} />
      </div>
    </div>
  );
}
