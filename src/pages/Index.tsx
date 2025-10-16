import { useState } from 'react';
import { ImageUpload } from '@/components/ImageUpload';
import { ExtractedDataDisplay } from '@/components/ExtractedDataDisplay';
import { CopyButton } from '@/components/CopyButton';
import { CodeInput } from '@/components/CodeInput';
import { CodeDisplay } from '@/components/CodeDisplay';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Sparkles, Key, Download, Smartphone, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDeviceType } from '@/hooks/useDeviceType';
import { generateAccessCode } from '@/utils/codeGenerator';

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
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const { toast } = useToast();
  const deviceType = useDeviceType();

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    setExtractedData(null);
  };

  const handleClear = () => {
    setSelectedImage(null);
    setExtractedData(null);
    setGeneratedCode(null);
  };

  const handleNewNote = () => {
    setSelectedImage(null);
    setExtractedData(null);
    setGeneratedCode(null);
    setIsProcessing(false);
    setIsDownloading(false);
    toast({
      title: "Pronto!",
      description: "Você pode processar uma nova nota fiscal.",
    });
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
      
      // If on mobile, save to database with code
      if (deviceType === 'mobile') {
        const code = generateAccessCode();
        const imageBase64String = imageBase64.split(',')[1] || imageBase64;
        
        const { error: insertError } = await supabase
          .from('danfe_extractions')
          .insert({
            access_code: code,
            chave: data.data.chave,
            empresa: data.data.empresa,
            numero: data.data.numero,
            data_emissao: data.data.dataEmissao,
            valor_total: data.data.valorTotal,
            image_data: imageBase64String
          });

        if (insertError) {
          console.error('Error saving to database:', insertError);
          throw new Error('Erro ao salvar dados no banco');
        }

        setGeneratedCode(code);
        toast({
          title: "Sucesso!",
          description: `Dados salvos! Código: ${code}`,
        });
      } else {
        toast({
          title: "Sucesso!",
          description: "Dados da DANFE extraídos com sucesso.",
        });
      }
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

  const handleCodeSubmit = async (code: string) => {
    setIsLoadingCode(true);
    
    try {
      const { data, error } = await supabase
        .from('danfe_extractions')
        .select('*')
        .eq('access_code', code)
        .single();

      if (error || !data) {
        throw new Error('Código não encontrado ou expirado');
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        throw new Error('Este código expirou');
      }

      setExtractedData({
        chave: data.chave,
        empresa: data.empresa || 'Não identificado',
        numero: data.numero || 'Não identificado',
        dataEmissao: data.data_emissao || 'Não identificado',
        valorTotal: data.valor_total || 'Não identificado'
      });

      toast({
        title: "Sucesso!",
        description: "Dados carregados com sucesso.",
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Código inválido ou expirado.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCode(false);
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
      <main className="container mx-auto px-4 py-6 md:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Device Type Indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            {deviceType === 'mobile' ? (
              <>
                <Smartphone className="h-4 w-4" />
                <span>Modo Mobile - Tire foto e receba o código</span>
              </>
            ) : (
              <>
                <Monitor className="h-4 w-4" />
                <span>Modo Desktop - Digite o código para acessar</span>
              </>
            )}
          </div>

          {/* Desktop: Code Input Section */}
          {deviceType === 'desktop' && !extractedData && (
            <CodeInput onCodeSubmit={handleCodeSubmit} isLoading={isLoadingCode} />
          )}

          {/* Mobile: Upload Section */}
          {deviceType === 'mobile' && !generatedCode && (
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
          )}

          {/* Mobile: Code Display After Processing */}
          {deviceType === 'mobile' && generatedCode && (
            <CodeDisplay code={generatedCode} />
          )}

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
                <div className="flex gap-2">
                  <CopyButton 
                    text={extractedData.chave} 
                    label="Copiar Chave"
                  />
                  <Button 
                    onClick={handleNewNote}
                    variant="outline"
                    size="sm"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Nova Nota
                  </Button>
                </div>
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

          {/* Empty State - Only on Mobile */}
          {deviceType === 'mobile' && !selectedImage && !isProcessing && !extractedData && !generatedCode && (
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
          <div className="mt-12 p-4 md:p-6 bg-card/50 backdrop-blur-sm rounded-lg border">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Como funciona
            </h3>
            {deviceType === 'mobile' ? (
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li>1. Tire uma foto da DANFE com seu celular</li>
                <li>2. Clique em "Processar com IA" para extrair os dados</li>
                <li>3. Receba um código de 6 dígitos válido por 24 horas</li>
                <li>4. Use o código no computador para acessar os dados e baixar o PDF</li>
              </ol>
            ) : (
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li>1. Receba o código de 6 dígitos do celular</li>
                <li>2. Digite o código acima para acessar os dados</li>
                <li>3. Visualize as informações extraídas da DANFE</li>
                <li>4. Baixe o PDF da DANFE diretamente</li>
              </ol>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              <strong>Nota:</strong> Sistema com IA para sincronização entre dispositivos. Códigos válidos por 24 horas.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
