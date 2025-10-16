import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { KeyRound } from 'lucide-react';

interface CodeInputProps {
  onCodeSubmit: (code: string) => void;
  isLoading?: boolean;
}

export const CodeInput = ({ onCodeSubmit, isLoading }: CodeInputProps) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onCodeSubmit(code.trim().toUpperCase());
    }
  };

  return (
    <Card className="p-8">
      <div className="flex flex-col items-center gap-6">
        <div className="p-4 rounded-full bg-primary/10">
          <KeyRound className="h-12 w-12 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Digite o Código de Acesso</h2>
          <p className="text-muted-foreground">
            Insira o código de 6 dígitos recebido no celular
          </p>
        </div>
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
          <Input
            type="text"
            placeholder="Exemplo: ABC123"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="text-center text-2xl tracking-widest font-mono"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!code.trim() || isLoading}
          >
            {isLoading ? 'Buscando...' : 'Acessar Dados'}
          </Button>
        </form>
      </div>
    </Card>
  );
};
