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
    const { chaveAcesso } = await req.json();
    const MEUDANFE_API_KEY = Deno.env.get("MEUDANFE_API_KEY");

    if (!chaveAcesso) {
      throw new Error("Chave de acesso is required");
    }

    if (!MEUDANFE_API_KEY) {
      throw new Error("MEUDANFE_API_KEY not configured");
    }

    console.log('Fetching DANFE using access key:', chaveAcesso);

    // Step 1: Add the NFe to user's area using the access key
    const addResponse = await fetch(`https://api.meudanfe.com.br/v2/fd/add/${chaveAcesso}`, {
      method: "PUT",
      headers: {
        "Api-Key": MEUDANFE_API_KEY,
      }
    });

    if (!addResponse.ok) {
      const errorText = await addResponse.text();
      console.error("Error adding NFe:", errorText);
      // Continue anyway - it might already be added
    } else {
      console.log('NFe added to user area');
    }

    // Step 2: Download the DANFE PDF
    const response = await fetch(`https://api.meudanfe.com.br/v2/fd/get/da/${chaveAcesso}`, {
      method: "GET",
      headers: {
        "Api-Key": MEUDANFE_API_KEY,
      }
    });

    console.log('API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error details:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('PDF fetched successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdf: {
          base64: data.data,
          filename: data.name
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
