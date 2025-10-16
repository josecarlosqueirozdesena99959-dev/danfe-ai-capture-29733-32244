import { Card } from '@/components/ui/card';
import { CopyButton } from '@/components/CopyButton';
import { CheckCircle2, Clock } from 'lucide-react';

interface CodeDisplayProps {
  code: string;
}

export const CodeDisplay = ({ code }: CodeDisplayProps) => {
  return (
    <Card className="p-8 border-2 border-primary">
      <div className="flex flex-col items-center gap-6">
        <div className="p-4 rounded-full bg-green-500/10">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Dados Salvos com Sucesso!</h2>
          <p className="text-muted-foreground">
            Use este código para acessar no computador
          </p>
        </div>
        <div className="w-full max-w-md">
          <div className="bg-muted rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Código de Acesso</p>
            <p className="text-4xl font-bold tracking-widest font-mono text-primary">
              {code}
            </p>
          </div>
          <div className="mt-4 flex justify-center">
            <CopyButton text={code} label="Copiar Código" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Válido por 24 horas</span>
        </div>
      </div>
    </Card>
  );
};
