import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFileSelect?: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  compact?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  accept = 'image/*',
  maxSizeMB = 10,
  className,
  compact = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (files: FileList | null) => {
    if (!files?.length) {
      setPreviewName(null);
      onFileSelect?.(null);
      return;
    }
    const file = files[0];

    // Check initial size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File must be smaller than ${maxSizeMB}MB`);
      return;
    }

    try {
      // Compress Image logic
      setError(null);
      setPreviewName("Compressing...");

      const compressedFile = await compressImage(file);
      setPreviewName(compressedFile.name); // Restore name after compression
      onFileSelect?.(compressedFile);
    } catch (err) {
      console.error("Compression failed:", err);
      setError("Image processing failed. Using original.");
      setPreviewName(file.name);
      onFileSelect?.(file);
    }
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              // Create a new File object from the compressed blob
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              // If compressed is bigger, return original (unlikely but possible for tiny optimized PNGs)
              if (compressedFile.size > file.size) {
                resolve(file);
              } else {
                resolve(compressedFile);
              }
            } else {
              reject(new Error("Canvas blob creation failed"));
            }
          }, 'image/jpeg', 0.8); // 80% quality
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFileChange(event.dataTransfer.files);
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'mt-1 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors',
          compact ? 'p-2 flex items-center justify-center gap-2' : 'p-6',
          error ? 'border-destructive text-destructive' : 'border-border text-muted-foreground',
          className
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <Upload className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">{previewName ?? 'Click to upload or drag and drop photos'}</p>
        <p className="text-xs mt-1">PNG, JPG up to {maxSizeMB}MB</p>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept={accept}
        onChange={(event) => handleFileChange(event.target.files)}
      />
    </div>
  );
};

export default FileUploader;

