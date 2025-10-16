import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { FileCode } from 'lucide-react';

interface XmlInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const XmlInput = ({ value, onChange }: XmlInputProps) => {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileCode className="h-5 w-5 text-primary" />
          </div>
          <Label htmlFor="xml-input" className="text-base font-semibold">
            Cole o XML completo da NFe
          </Label>
        </div>
        <Textarea
          id="xml-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Cole aqui o conteúdo XML completo da nota fiscal..."
          className="min-h-[200px] font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          O XML completo é necessário para gerar o PDF da DANFE
        </p>
      </div>
    </Card>
  );
};
