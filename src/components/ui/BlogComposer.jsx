/**
 * BlogComposer Component
 * Markdown editor with live preview and formatting toolbar.
 * Uses useUndoRedo for Ctrl+Z/Y support.
 *
 * Follows the "local state as scratchpad, backend as ledger" pattern:
 * - Content accumulates in local state
 * - Explicit save/publish sends to backend
 */

import { useState, useCallback, useRef } from 'react';
import Markdown from 'react-markdown';
import { useUndoRedo } from '../../hooks';
import Button from './Button';
import './BlogComposer.css';

// Advanced markdown syntax reference (complex/niche items only)
const ADVANCED_SYNTAX = [
  { element: 'Table', syntax: '| Syntax | Description |\n| ----------- | ----------- |\n| Header | Title |\n| Paragraph | Text |' },
  { element: 'Footnote', syntax: 'Here\'s a sentence with a footnote. [^1]\n\n[^1]: This is the footnote.' },
  { element: 'Heading ID', syntax: '### My Great Heading {#custom-id}' },
  { element: 'Definition List', syntax: 'term\n: definition' },
];

// Formatting button definitions
const FORMATTING_BUTTONS = [
  { id: 'h1', label: 'H1', title: 'Heading 1', prefix: '# ', suffix: '', block: true },
  { id: 'h2', label: 'H2', title: 'Heading 2', prefix: '## ', suffix: '', block: true },
  { id: 'h3', label: 'H3', title: 'Heading 3', prefix: '### ', suffix: '', block: true },
  { id: 'divider1', divider: true },
  { id: 'bold', label: 'B', title: 'Bold (Ctrl+B)', prefix: '**', suffix: '**', className: 'format-bold' },
  { id: 'italic', label: 'I', title: 'Italic (Ctrl+I)', prefix: '*', suffix: '*', className: 'format-italic' },
  { id: 'strikethrough', label: 'S', title: 'Strikethrough', prefix: '~~', suffix: '~~', className: 'format-strike' },
  { id: 'code', label: '</>', title: 'Inline Code', prefix: '`', suffix: '`' },
  { id: 'divider2', divider: true },
  { id: 'codeblock', label: '```', title: 'Code Block', prefix: '```\n', suffix: '\n```', block: true },
  { id: 'blockquote', label: '❝', title: 'Blockquote', prefix: '> ', suffix: '', block: true },
  { id: 'divider3', divider: true },
  { id: 'ul', label: '•', title: 'Bullet List', prefix: '- ', suffix: '', block: true },
  { id: 'ol', label: '1.', title: 'Numbered List', prefix: '1. ', suffix: '', block: true },
  { id: 'task', label: '☐', title: 'Task List', prefix: '- [ ] ', suffix: '', block: true },
  { id: 'divider4', divider: true },
  { id: 'hr', label: '—', title: 'Horizontal Rule', prefix: '\n---\n', suffix: '', block: true, noWrap: true },
  { id: 'divider5', divider: true },
  { id: 'link', label: '🔗', title: 'Insert Link', special: 'link' },
  { id: 'image', label: '🖼', title: 'Insert Image', special: 'image' },
  { id: 'divider6', divider: true },
  { id: 'sub', label: 'X₂', title: 'Subscript', prefix: '~', suffix: '~' },
  { id: 'sup', label: 'X²', title: 'Superscript', prefix: '^', suffix: '^' },
];

export default function BlogComposer({
  initialTitle = '',
  initialContent = '',
  maxTitleLength = 100,
  maxContentLength = 10000,
  onSave,
  onPublish,
  saving = false,
  className = '',
}) {
  // Title with undo/redo
  const title = useUndoRedo(initialTitle, { maxHistory: 50 });

  // Content with undo/redo
  const content = useUndoRedo(initialContent, { maxHistory: 100 });

  // Textarea ref for selection manipulation
  const textareaRef = useRef(null);

  // Preview mode toggle
  const [showPreview, setShowPreview] = useState(false);

  // Advanced syntax toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Link/Image popover state
  const [popover, setPopover] = useState({ type: null, url: '', text: '' });

  // Track if dirty (has unsaved changes)
  const isDirty = title.value !== initialTitle || content.value !== initialContent;

  // Handle save draft
  const handleSave = useCallback(() => {
    onSave?.({
      title: title.value,
      content: content.value,
      isDraft: true,
    });
  }, [title.value, content.value, onSave]);

  // Handle publish
  const handlePublish = useCallback(() => {
    onPublish?.({
      title: title.value,
      content: content.value,
      isDraft: false,
    });
  }, [title.value, content.value, onPublish]);

  // Get current selection from textarea
  const getSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return { start: 0, end: 0, text: '' };
    return {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
      text: textarea.value.substring(textarea.selectionStart, textarea.selectionEnd),
    };
  }, []);

  // Set cursor position or selection
  const setSelection = useCallback((start, end = start) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    textarea.setSelectionRange(start, end);
  }, []);

  // Check if selection is wrapped with given prefix/suffix
  const isWrapped = useCallback((prefix, suffix) => {
    const textarea = textareaRef.current;
    if (!textarea) return false;
    const { start, end } = getSelection();
    const before = textarea.value.substring(start - prefix.length, start);
    const after = textarea.value.substring(end, end + suffix.length);
    return before === prefix && after === suffix;
  }, [getSelection]);

  // Apply formatting
  const applyFormat = useCallback((btn) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { start, end, text } = getSelection();
    const { prefix, suffix, block, noWrap } = btn;
    const currentValue = content.value;

    // For items that just insert (like hr)
    if (noWrap) {
      const newValue = currentValue.substring(0, start) + prefix + currentValue.substring(end);
      content.setValue(newValue);
      setTimeout(() => setSelection(start + prefix.length), 0);
      return;
    }

    // Check if we should toggle off (unwrap)
    if (suffix && isWrapped(prefix, suffix)) {
      // Remove the wrapping
      const newValue = 
        currentValue.substring(0, start - prefix.length) +
        text +
        currentValue.substring(end + suffix.length);
      content.setValue(newValue);
      setTimeout(() => setSelection(start - prefix.length, end - prefix.length), 0);
      return;
    }

    // For block-level items, check if we're at line start
    let actualPrefix = prefix;
    if (block && start > 0 && currentValue[start - 1] !== '\n') {
      actualPrefix = '\n' + prefix;
    }

    // Wrap or insert
    if (text) {
      // Wrap selected text
      const newValue = 
        currentValue.substring(0, start) +
        actualPrefix + text + suffix +
        currentValue.substring(end);
      content.setValue(newValue);
      setTimeout(() => {
        const newStart = start + actualPrefix.length;
        const newEnd = newStart + text.length;
        setSelection(newStart, newEnd);
      }, 0);
    } else {
      // Insert placeholder
      const placeholder = block ? 'text' : 'text';
      const newValue = 
        currentValue.substring(0, start) +
        actualPrefix + placeholder + suffix +
        currentValue.substring(end);
      content.setValue(newValue);
      setTimeout(() => {
        const newStart = start + actualPrefix.length;
        const newEnd = newStart + placeholder.length;
        setSelection(newStart, newEnd);
      }, 0);
    }
  }, [content, getSelection, isWrapped, setSelection]);

  // Handle formatting button click
  const handleFormat = useCallback((btn) => {
    if (btn.special === 'link') {
      const { text } = getSelection();
      setPopover({ type: 'link', url: '', text: text || 'link text' });
    } else if (btn.special === 'image') {
      setPopover({ type: 'image', url: '', text: 'alt text' });
    } else {
      applyFormat(btn);
    }
  }, [applyFormat, getSelection]);

  // Insert link or image from popover
  const insertLinkOrImage = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { start, end } = getSelection();
    const currentValue = content.value;
    
    let insertion;
    if (popover.type === 'link') {
      insertion = `[${popover.text}](${popover.url})`;
    } else {
      insertion = `![${popover.text}](${popover.url})`;
    }

    const newValue = currentValue.substring(0, start) + insertion + currentValue.substring(end);
    content.setValue(newValue);
    setPopover({ type: null, url: '', text: '' });
    setTimeout(() => setSelection(start + insertion.length), 0);
  }, [content, getSelection, popover, setSelection]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        const btn = FORMATTING_BUTTONS.find(b => b.id === 'bold');
        if (btn) applyFormat(btn);
      } else if (e.key === 'i') {
        e.preventDefault();
        const btn = FORMATTING_BUTTONS.find(b => b.id === 'italic');
        if (btn) applyFormat(btn);
      }
    }
  }, [applyFormat]);

  return (
    <div className={`blog-composer ${className}`}>
      {/* Main Toolbar */}
      <div className="blog-composer-toolbar">
        <div className="blog-composer-toolbar-left">
          <Button
            size="sm"
            variant="ghost"
            onClick={title.undo}
            disabled={!title.canUndo}
            title="Undo (Ctrl+Z)"
          >
            ↩
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={title.redo}
            disabled={!title.canRedo}
            title="Redo (Ctrl+Y)"
          >
            ↪
          </Button>
          <span className="blog-composer-divider" />
          <Button
            size="sm"
            variant={showPreview ? 'secondary' : 'ghost'}
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Edit' : 'Preview'}
          </Button>
          <Button
            size="sm"
            variant={showAdvanced ? 'secondary' : 'ghost'}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide Advanced' : 'Advanced Syntax'}
          </Button>
        </div>
        <div className="blog-composer-toolbar-right">
          {isDirty && (
            <span className="blog-composer-dirty">Unsaved changes</span>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSave}
            disabled={saving || !isDirty}
            loading={saving}
          >
            Save Draft
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handlePublish}
            disabled={saving || !title.value.trim() || !content.value.trim()}
          >
            Publish
          </Button>
        </div>
      </div>

      {/* Formatting Toolbar */}
      {!showPreview && (
        <div className="blog-composer-format-bar">
          {FORMATTING_BUTTONS.map((btn) => 
            btn.divider ? (
              <span key={btn.id} className="blog-composer-format-divider" />
            ) : (
              <button
                key={btn.id}
                type="button"
                className={`blog-composer-format-btn ${btn.className || ''}`}
                title={btn.title}
                onClick={() => handleFormat(btn)}
              >
                {btn.label}
              </button>
            )
          )}
        </div>
      )}

      {/* Link/Image Popover */}
      {popover.type && (
        <div className="blog-composer-popover">
          <div className="blog-composer-popover-content">
            <div className="blog-composer-popover-title">
              {popover.type === 'link' ? 'Insert Link' : 'Insert Image'}
            </div>
            <input
              type="text"
              placeholder={popover.type === 'link' ? 'Link text' : 'Alt text'}
              value={popover.text}
              onChange={(e) => setPopover({ ...popover, text: e.target.value })}
              className="blog-composer-popover-input"
              autoFocus
            />
            <input
              type="url"
              placeholder="https://..."
              value={popover.url}
              onChange={(e) => setPopover({ ...popover, url: e.target.value })}
              className="blog-composer-popover-input"
            />
            <div className="blog-composer-popover-actions">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPopover({ type: null, url: '', text: '' })}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={insertLinkOrImage}
                disabled={!popover.url}
              >
                Insert
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Editor / Preview */}
      <div className="blog-composer-content">
        {showPreview ? (
          <div className="blog-composer-preview">
            <h1 className="blog-composer-preview-title">
              {title.value || 'Untitled'}
            </h1>
            <div className="blog-composer-preview-body">
              <Markdown>{content.value || '*No content yet*'}</Markdown>
            </div>
          </div>
        ) : (
          <div className="blog-composer-editor">
            {/* Title input */}
            <input
              type="text"
              value={title.value}
              onChange={(e) => title.setValue(e.target.value)}
              placeholder="Post title..."
              className="blog-composer-title-input"
              maxLength={maxTitleLength}
            />
            <div className="blog-composer-title-count">
              {title.value.length}/{maxTitleLength}
            </div>

            {/* Content textarea */}
            <textarea
              ref={textareaRef}
              value={content.value}
              onChange={(e) => content.setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write your post in Markdown..."
              className="blog-composer-content-input"
            />
            <div className="blog-composer-content-count">
              {content.value.length}/{maxContentLength}
              <span className="blog-composer-hint">
                Ctrl+B bold • Ctrl+I italic • Use toolbar above for more
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Syntax Section (below composer) */}
      {showAdvanced && (
        <div className="blog-composer-advanced">
          <div className="blog-composer-advanced-header">
            Advanced Syntax Reference
            <span className="blog-composer-advanced-note">
              Complex elements — copy syntax manually
            </span>
          </div>
          <table className="blog-composer-guide-table">
            <thead>
              <tr>
                <th>Element</th>
                <th>Syntax</th>
              </tr>
            </thead>
            <tbody>
              {ADVANCED_SYNTAX.map(({ element, syntax }) => (
                <tr key={element}>
                  <td className="guide-element">{element}</td>
                  <td className="guide-syntax">
                    <pre>{syntax}</pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
