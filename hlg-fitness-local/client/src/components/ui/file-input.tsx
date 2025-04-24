import { useRef, useState, ChangeEvent } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, X } from 'lucide-react';

interface FileInputProps {
  id: string;
  onChange: (file: File | null) => void;
  value?: File | string | null;
  className?: string;
  accept?: string;
  maxSize?: number; // in bytes
  label?: string;
}

export function FileInput({
  id,
  onChange,
  value,
  className,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB default
  label = "Imagem"
}: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(
    typeof value === "string" ? (value.startsWith('data:') ? value : `/${value}`) : null
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Validate file size
      if (file.size > maxSize) {
        setError(`Arquivo muito grande. Tamanho máximo: ${maxSize / 1024 / 1024}MB`);
        if (inputRef.current) inputRef.current.value = '';
        return;
      }
      
      setError(null);
      onChange(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
      onChange(null);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleRemove = () => {
    if (inputRef.current) inputRef.current.value = '';
    setPreview(null);
    onChange(null);
    setError(null);
  };

  return (
    <div className={className}>
      <Label htmlFor={id} className="block text-sm font-medium mb-1">{label}</Label>
      
      <div className="mt-1">
        <Input
          id={id}
          type="file"
          ref={inputRef}
          onChange={handleFileChange}
          accept={accept}
          className="hidden"
        />
        
        {preview ? (
          <div className="relative w-full h-40 bg-muted rounded-md overflow-hidden">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div 
            className={cn(
              "flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer",
              error ? "border-destructive" : "border-muted-foreground/20 hover:border-muted-foreground/50"
            )}
            onClick={handleClick}
          >
            <div className="space-y-1 text-center">
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="flex text-sm text-muted-foreground">
                <span className="relative cursor-pointer bg-white rounded-md font-medium text-secondary hover:text-secondary-light">
                  Fazer upload de arquivo
                </span>
                <p className="pl-1">ou arraste e solte</p>
              </div>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF até {maxSize / 1024 / 1024}MB
              </p>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
