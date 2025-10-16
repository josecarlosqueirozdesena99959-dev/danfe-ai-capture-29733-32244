import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log('Processing DANFE image with Gemini...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analise esta imagem de DANFE (Documento Auxiliar da Nota Fiscal Eletrônica) e extraia EXATAMENTE as seguintes informações:

1. Chave de acesso da NFe (44 dígitos numéricos)
2. Nome da empresa emitente
3. Número da nota fiscal
4. Data de emissão (formato DD/MM/AAAA)
5. Valor total da nota (com ou sem desconto)

Retorne APENAS um JSON válido neste formato exato, sem texto adicional:
{
  "chave": "string com 44 dígitos",
  "empresa": "nome da empresa",
  "numero": "número da nota",
  "dataEmissao": "DD/MM/AAAA",
  "valorTotal": "R$ 0,00"
}

Se não conseguir extrair alguma informação, use "Não identificado" para aquele campo.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Settings -> Workspace -> Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', data);

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Extract JSON from response (in case there's extra text)
    let extractedData;
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        extractedData = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      console.error('Content:', content);
      throw new Error("Failed to parse AI response as JSON");
    }

    console.log('Extracted data:', extractedData);

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error in extract-danfe function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
