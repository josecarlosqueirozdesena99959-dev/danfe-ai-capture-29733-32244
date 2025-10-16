import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface CopyButtonProps {
  text: string;
  label?: string;
}

export const CopyButton = ({ text, label = "Copiar" }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    if (!text) return;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "Texto copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleCopy}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copiado!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
};
