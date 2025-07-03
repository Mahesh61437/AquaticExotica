import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, List, ListOrdered, Quote, Heading2, Link, Undo, Redo } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const getSelectedText = () => {
    const textarea = textareaRef.current;
    if (!textarea) return '';
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    return value.substring(start, end);
  };

  const replaceSelectedText = (replacement: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  };

  const wrapSelectedText = (before: string, after: string) => {
    const selectedText = getSelectedText();
    if (selectedText) {
      replaceSelectedText(before + selectedText + after);
    } else {
      // If no text is selected, just insert the tags
      replaceSelectedText(before + after);
    }
  };

  const insertAtCursor = (text: string) => {
    replaceSelectedText(text);
  };

  const formatAction = (action: string) => {
    switch (action) {
      case 'bold':
        wrapSelectedText('<strong>', '</strong>');
        break;
      case 'italic':
        wrapSelectedText('<em>', '</em>');
        break;
      case 'bullet':
        insertAtCursor('\n<ul>\n<li>• </li>\n</ul>');
        break;
      case 'numbered':
        insertAtCursor('\n<ol>\n<li>1. </li>\n</ol>');
        break;
      case 'quote':
        wrapSelectedText('<blockquote>', '</blockquote>');
        break;
      case 'heading':
        wrapSelectedText('<h3>', '</h3>');
        break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) {
          wrapSelectedText(`<a href="${url}" target="_blank" rel="noopener noreferrer">`, '</a>');
        }
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save selection on key events
    const textarea = textareaRef.current;
    if (textarea) {
      setSelection({
        start: textarea.selectionStart,
        end: textarea.selectionEnd
      });
    }
  };

  const handleClick = () => {
    // Save selection on click
    const textarea = textareaRef.current;
    if (textarea) {
      setSelection({
        start: textarea.selectionStart,
        end: textarea.selectionEnd
      });
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border border-input rounded-md bg-muted/50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatAction('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatAction('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatAction('bullet')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatAction('numbered')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatAction('quote')}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatAction('heading')}
          title="Heading"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatAction('link')}
          title="Link"
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        placeholder={placeholder || "Enter product description..."}
        className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
      />

      {/* Preview */}
      {value && (
        <div className="mt-4 p-4 border border-input rounded-md bg-muted/30">
          <p className="text-xs font-medium text-muted-foreground mb-2">Preview:</p>
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        </div>
      )}
    </div>
  );
} 