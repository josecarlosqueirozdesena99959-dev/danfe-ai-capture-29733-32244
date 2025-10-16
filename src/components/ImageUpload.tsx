import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  selectedImage: File | null;
  onClear: () => void;
}

export const ImageUpload = ({ onImageSelect, selectedImage, onClear }: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      if (files[0].type.startsWith('image/')) {
        onImageSelect(files[0]);
      } else {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, envie apenas imagens.",
          variant: "destructive",
        });
      }
    }
  }, [onImageSelect, toast]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      if (files[0].type.startsWith('image/')) {
        onImageSelect(files[0]);
      } else {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, envie apenas imagens.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg border-2">
      {selectedImage ? (
        <div className="relative">
          <img
            src={URL.createObjectURL(selectedImage)}
            alt="DANFE Preview"
            className="w-full h-auto max-h-96 object-contain"
          />
          <Button
            onClick={onClear}
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`p-12 text-center transition-all duration-300 ${
            isDragging ? 'bg-primary/5 border-primary' : 'bg-muted/30'
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className={`p-6 rounded-full transition-all duration-300 ${
              isDragging ? 'bg-primary/10 scale-110' : 'bg-primary/5'
            }`}>
              {isDragging ? (
                <ImageIcon className="h-12 w-12 text-primary animate-pulse" />
              ) : (
                <Upload className="h-12 w-12 text-primary" />
              )}
            </div>
            <div>
              <p className="text-lg font-semibold mb-2">
                {isDragging ? 'Solte a imagem aqui' : 'Envie a foto da DANFE'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Arraste e solte ou clique para selecionar
              </p>
              <label htmlFor="file-upload">
                <Button variant="default" asChild>
                  <span className="cursor-pointer">
                    Selecionar Arquivo
                  </span>
                </Button>
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
