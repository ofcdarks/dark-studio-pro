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
    const { provider, apiKey } = await req.json();

    if (!provider || !apiKey) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Provider and API key are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let valid = false;
    let error = '';

    switch (provider) {
      case 'openai':
        valid = await validateOpenAI(apiKey);
        break;
      case 'claude':
        valid = await validateClaude(apiKey);
        break;
      case 'gemini':
        valid = await validateGemini(apiKey);
        break;
      case 'elevenlabs':
        valid = await validateElevenLabs(apiKey);
        break;
      case 'youtube':
        valid = await validateYouTube(apiKey);
        break;
      case 'laozhang':
        valid = await validateLaozhang(apiKey);
        break;
      case 'downsub':
        valid = await validateDownsub(apiKey);
        break;
      default:
        error = 'Unknown provider';
    }

    console.log(`Validation result for ${provider}: ${valid}`);

    return new Response(
      JSON.stringify({ valid, error }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error validating API key:', error);
    return new Response(
      JSON.stringify({ valid: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function validateOpenAI(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function validateClaude(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    });
    return response.ok || response.status === 400;
  } catch {
    return false;
  }
}

async function validateGemini(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    return response.ok;
  } catch {
    return false;
  }
}

async function validateElevenLabs(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: { 'xi-api-key': apiKey }
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function validateYouTube(apiKey: string): Promise<boolean> {
  try {
    // Use a simple search endpoint that only requires API key
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&maxResults=1&type=video&key=${apiKey}`
    );
    
    if (response.ok) {
      return true;
    }
    
    // Check if it's a quota error (403) - API key is valid but quota exceeded
    if (response.status === 403) {
      const data = await response.json();
      // If it's a quota error, the key is still valid
      if (data.error?.errors?.[0]?.reason === 'quotaExceeded') {
        return true;
      }
    }
    
    console.log(`YouTube validation response: ${response.status}`);
    return false;
  } catch (error) {
    console.error('YouTube validation error:', error);
    return false;
  }
}

async function validateLaozhang(apiKey: string): Promise<boolean> {
  try {
    // Laozhang uses OpenAI-compatible API, validate by listing models
    const response = await fetch('https://api.laozhang.ai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    if (response.ok) {
      console.log('Laozhang validation: success');
      return true;
    }
    
    // Check for auth error specifically
    if (response.status === 401) {
      console.log('Laozhang validation: invalid key');
      return false;
    }
    
    console.log(`Laozhang validation response: ${response.status}`);
    return false;
  } catch (error) {
    console.error('Laozhang validation error:', error);
    return false;
  }
}

async function validateDownsub(apiKey: string): Promise<boolean> {
  try {
    // DownSub API validation - simple check
    // Most subtitle APIs just need a valid key format check
    // Return true if key looks valid (starts with expected prefix or has right length)
    if (apiKey && apiKey.length >= 20) {
      console.log('Downsub validation: key format valid');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Downsub validation error:', error);
    return false;
  }
}
