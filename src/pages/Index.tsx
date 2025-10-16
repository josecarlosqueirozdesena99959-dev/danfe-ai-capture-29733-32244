import { useState } from 'react';
import { ImageUpload } from '@/components/ImageUpload';
import { ExtractedDataDisplay } from '@/components/ExtractedDataDisplay';
import { CopyButton } from '@/components/CopyButton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Sparkles, Key, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ExtractedData {
  chave: string;
  empresa: string;
  numero: string;
  dataEmissao: string;
  valorTotal: string;
}

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    setExtractedData(null);
  };

  const handleClear = () => {
    setSelectedImage(null);
    setExtractedData(null);
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processImage = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    
    try {
      const imageBase64 = await convertImageToBase64(selectedImage);
      
      console.log('Calling extract-danfe function...');
      const { data, error } = await supabase.functions.invoke('extract-danfe', {
        body: { imageBase64 }
      });

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      console.log('Function response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Erro ao processar imagem');
      }

      setExtractedData(data.data);
      
      toast({
        title: "Sucesso!",
        description: "Dados da DANFE extraídos com sucesso.",
      });
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível processar a imagem.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPdf = async () => {
    if (!extractedData?.chave) {
      toast({
        title: "Chave necessária",
        description: "Por favor, processe uma imagem primeiro para extrair a chave de acesso.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    
    try {
      console.log('Downloading PDF using access key...');
      const { data, error } = await supabase.functions.invoke('download-danfe-pdf', {
        body: { chaveAcesso: extractedData.chave }
      });

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao gerar PDF');
      }

      // Convert base64 to blob and download
      const base64Data = data.pdf.base64;
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = data.pdf.filename || 'danfe.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Sucesso!",
        description: "PDF da DANFE baixado com sucesso.",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível gerar o PDF.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-primary-glow rounded-lg">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Extrator de Chave DANFE</h1>
              <p className="text-sm text-muted-foreground">
                Extraia chaves de NFe com inteligência artificial
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </div>
              <h2 className="text-xl font-semibold">Envie a imagem da DANFE</h2>
            </div>
            <ImageUpload
              onImageSelect={handleImageSelect}
              selectedImage={selectedImage}
              onClear={handleClear}
            />
            {selectedImage && !isProcessing && !extractedData && (
              <Button
                onClick={processImage}
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Processar com IA
              </Button>
            )}
          </div>

          {/* Processing State */}
          {isProcessing && (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                <p className="text-lg font-medium">Processando imagem...</p>
                <p className="text-sm text-muted-foreground">
                  Extraindo dados da DANFE com IA
                </p>
              </div>
            </Card>
          )}

          {/* Results Section */}
          {extractedData && !isProcessing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground text-sm font-bold">
                    2
                  </div>
                  <h2 className="text-xl font-semibold">Dados Extraídos</h2>
                </div>
                <CopyButton 
                  text={extractedData.chave} 
                  label="Copiar Chave"
                />
              </div>
              
              <ExtractedDataDisplay data={extractedData} />

              {/* Download Section */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    3
                  </div>
                  <h2 className="text-xl font-semibold">Baixar PDF da DANFE</h2>
                </div>
                
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    Clique no botão abaixo para baixar o PDF da DANFE usando a chave de acesso extraída.
                  </p>
                  <Button
                    onClick={downloadPdf}
                    disabled={isDownloading}
                    size="lg"
                    className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90 transition-opacity"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    {isDownloading ? 'Baixando PDF...' : 'Baixar PDF da DANFE'}
                  </Button>
                </Card>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!selectedImage && !isProcessing && !extractedData && (
            <Card className="p-8 text-center border-dashed border-2">
              <div className="flex flex-col items-center gap-4">
                <div className="p-6 rounded-full bg-muted">
                  <Key className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-muted-foreground">
                  Aguardando imagem
                </p>
                <p className="text-sm text-muted-foreground">
                  Envie uma foto da DANFE para extrair os dados
                </p>
              </div>
            </Card>
          )}

          {/* Info Card */}
          <div className="mt-12 p-6 bg-card/50 backdrop-blur-sm rounded-lg border">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Como funciona
            </h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li>1. Tire uma foto da DANFE ou selecione uma imagem do seu dispositivo</li>
              <li>2. Clique em "Processar com IA" para extrair automaticamente a chave de acesso</li>
              <li>3. Baixe o PDF da DANFE diretamente usando a chave extraída</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-4">
              <strong>Nota:</strong> Este sistema usa IA avançada do Gemini para extrair dados automaticamente.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
