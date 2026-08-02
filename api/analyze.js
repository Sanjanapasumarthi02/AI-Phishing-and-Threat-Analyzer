/**
 * Vercel Serverless Function: api/analyze.js
 * Analyzes email body or URL for phishing/social engineering threats using Gemini API.
 */

export default async function handler(req, res) {
  // CORS configuration to allow local file testing if necessary
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { content } = req.body || {};
  if (!content || typeof content !== 'string' || content.trim() === '') {
    return res.status(400).json({ error: 'Please provide email text or a URL to analyze.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'Gemini API key is not configured on the server. Please check environment variables.' 
    });
  }

  const systemInstruction = `You are an expert cybersecurity analyst specializing in threat intelligence, security operations center (SOC) analysis, and phishing email/URL detection.
Your task is to analyze the provided text (which could be an email body, raw email headers, a suspicious link, or a website URL) and determine if it represents a threat (phishing, social engineering, business email compromise (BEC), credential harvesting, spam, or malicious link).

You must analyze the text for indicators of compromise (IOCs) and security red flags, including:
1. Urgent or threatening tone.
2. Suspicious call-to-actions (e.g., updating credentials, downloading attachments, clicking unverified links).
3. Sender mismatches or domain anomalies (e.g., support@paypa1-security.com instead of paypal.com).
4. Generic greetings where a personalized one is expected.
5. Inconsistencies in the message structure.

Provide a structured JSON output matching the requested schema. Ensure your explanations are concise, professional, and directly useful in security training or analysis.`;

  try {
    const model = 'gemini-3.5-flash';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `Analyze the following suspicious email content or URL:\n\n"""\n${content}\n"""`
            }
          ]
        }
      ],
      systemInstruction: {
        parts: [
          {
            text: systemInstruction
          }
        ]
      },
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            riskScore: {
              type: 'STRING',
              description: 'The overall phishing risk level.',
              enum: ['Low', 'Medium', 'High']
            },
            redFlags: {
              type: 'ARRAY',
              description: 'Specific warning indicators or red flags found in the input (max 5 items).',
              items: {
                type: 'STRING'
              }
            },
            explanation: {
              type: 'STRING',
              description: 'A concise, 2-line explanation summarizing the threats detected or why the score is low.'
            },
            recommendations: {
              type: 'ARRAY',
              description: 'Actionable steps the user should take regarding this email/URL (max 3 items).',
              items: {
                type: 'STRING'
              }
            }
          },
          required: ['riskScore', 'redFlags', 'explanation', 'recommendations']
        }
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        errorJson = { error: { message: errorText } };
      }
      return res.status(response.status).json({ 
        error: `Gemini API Error: ${errorJson?.error?.message || 'Unknown Gemini error.'}` 
      });
    }

    const responseData = await response.json();
    
    // Parse the generated text from Gemini's response structure
    const candidateText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return res.status(500).json({ error: 'Empty or invalid response from threat intelligence model.' });
    }

    const threatAnalysis = JSON.parse(candidateText);
    return res.status(200).json(threatAnalysis);

  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({ 
      error: `Internal Server Error during threat analysis: ${error.message}` 
    });
  }
}
