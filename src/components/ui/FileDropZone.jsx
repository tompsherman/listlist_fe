/**
 * FileDropZone Component
 * Drag files from desktop onto a target area.
 * Different from reordering - handles native file drops.
 */

import { useState, useRef, useCallback } from 'react';
import './FileDropZone.css';

export default function FileDropZone({
  onDrop,
  accept,
  maxSize,
  maxFiles = 1,
  multiple = false,
  disabled = false,
  children,
  className = '',
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const validateFile = useCallback((file) => {
    // Check file type
    if (accept) {
      const acceptedTypes = accept.split(',').map((t) => t.trim());
      const fileType = file.type;
      const fileExt = `.${file.name.split('.').pop()}`;
      
      const isValid = acceptedTypes.some((type) => {
        if (type.startsWith('.')) return fileExt.toLowerCase() === type.toLowerCase();
        if (type.endsWith('/*')) return fileType.startsWith(type.replace('/*', '/'));
        return fileType === type;
      });
      
      if (!isValid) {
        return `File type not accepted: ${file.name}`;
      }
    }

    // Check file size
    if (maxSize && file.size > maxSize) {
      const sizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return `File too large: ${file.name} (max ${sizeMB}MB)`;
    }

    return null;
  }, [accept, maxSize]);

  const handleFiles = useCallback((files) => {
    setError(null);
    const fileArray = Array.from(files);

    // Check max files
    if (fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed`);
      return;
    }

    // Validate each file
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    onDrop?.(multiple ? fileArray : fileArray[0]);
  }, [onDrop, maxFiles, multiple, validateFile]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer?.files;
    if (files?.length) {
      handleFiles(files);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleInputChange = (e) => {
    const files = e.target.files;
    if (files?.length) {
      handleFiles(files);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  return (
    <div
      className={`file-drop-zone ${isDragging ? 'file-drop-zone-active' : ''} ${disabled ? 'file-drop-zone-disabled' : ''} ${error ? 'file-drop-zone-error' : ''} ${className}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="file-drop-zone-input"
        disabled={disabled}
      />

      {children || (
        <div className="file-drop-zone-content">
          <div className="file-drop-zone-icon">📁</div>
          <div className="file-drop-zone-text">
            {isDragging ? (
              'Drop files here'
            ) : (
              <>
                <strong>Click to upload</strong> or drag and drop
              </>
            )}
          </div>
          {accept && (
            <div className="file-drop-zone-hint">
              Accepted: {accept}
            </div>
          )}
          {maxSize && (
            <div className="file-drop-zone-hint">
              Max size: {(maxSize / (1024 * 1024)).toFixed(1)}MB
            </div>
          )}
        </div>
      )}

      {error && <div className="file-drop-zone-error-text">{error}</div>}
    </div>
  );
}
