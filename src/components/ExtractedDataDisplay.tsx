import { Card } from '@/components/ui/card';
import { Building2, FileText, Calendar, DollarSign, Key } from 'lucide-react';

interface ExtractedData {
  chave: string;
  empresa: string;
  numero: string;
  dataEmissao: string;
  valorTotal: string;
}

interface ExtractedDataDisplayProps {
  data: ExtractedData;
}

export const ExtractedDataDisplay = ({ data }: ExtractedDataDisplayProps) => {
  const fields = [
    { icon: Key, label: 'Chave de Acesso', value: data.chave, mono: true },
    { icon: Building2, label: 'Empresa', value: data.empresa },
    { icon: FileText, label: 'Número da Nota', value: data.numero },
    { icon: Calendar, label: 'Data de Emissão', value: data.dataEmissao },
    { icon: DollarSign, label: 'Valor Total', value: data.valorTotal },
  ];

  return (
    <div className="grid gap-4">
      {fields.map((field, index) => {
        const Icon = field.icon;
        return (
          <Card key={index} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {field.label}
                </p>
                <p className={`text-base font-semibold break-all ${
                  field.mono ? 'font-mono text-sm' : ''
                }`}>
                  {field.value}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
