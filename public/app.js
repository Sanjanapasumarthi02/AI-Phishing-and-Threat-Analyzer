/**
 * Frontend Application Controller for AegisAI
 * Handles UI interactions, modal states, scan steps, and hybrid routing.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const threatInput = document.getElementById('threatInput');
  const charCount = document.getElementById('charCount');
  const clearBtn = document.getElementById('clearBtn');
  const analyzeBtn = document.getElementById('analyzeBtn');
  
  const scanningProgress = document.getElementById('scanningProgress');
  const progressTitle = document.getElementById('progressTitle');
  const progressSub = document.getElementById('progressSub');
  const progressBar = document.getElementById('progressBar');
  
  const resultCard = document.getElementById('resultCard');
  const riskBadge = document.getElementById('riskBadge');
  const riskLabel = document.getElementById('riskLabel');
  const threatExplanation = document.getElementById('threatExplanation');
  const redFlagsList = document.getElementById('redFlagsList');
  const recommendationsList = document.getElementById('recommendationsList');
  const resetBtn = document.getElementById('resetBtn');
  
  const configBtn = document.getElementById('configBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const directClientToggle = document.getElementById('directClientToggle');
  const saveKeyBtn = document.getElementById('saveKeyBtn');
  const clearKeyBtn = document.getElementById('clearKeyBtn');
  const apiModeLabel = document.getElementById('apiModeLabel');

  // Load Settings from LocalStorage
  let storedApiKey = localStorage.getItem('AEGIS_GEMINI_API_KEY') || '';
  let useDirectClient = localStorage.getItem('AEGIS_USE_DIRECT_CLIENT') === 'true';

  // Initialize UI State based on stored config
  apiKeyInput.value = storedApiKey;
  directClientToggle.checked = useDirectClient;
  updateModeBadge();

  // Character Counter Event
  threatInput.addEventListener('input', () => {
    charCount.textContent = threatInput.value.length;
  });

  // Clear Input Button
  clearBtn.addEventListener('click', () => {
    threatInput.value = '';
    charCount.textContent = '0';
    threatInput.focus();
  });

  // Modal Settings Button Actions
  configBtn.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
  });

  closeModalBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });

  // Close modal when clicking background overlay
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.add('hidden');
    }
  });

  // Save Settings Clicked
  saveKeyBtn.addEventListener('click', () => {
    storedApiKey = apiKeyInput.value.trim();
    useDirectClient = directClientToggle.checked;

    localStorage.setItem('AEGIS_GEMINI_API_KEY', storedApiKey);
    localStorage.setItem('AEGIS_USE_DIRECT_CLIENT', useDirectClient.toString());
    
    updateModeBadge();
    settingsModal.classList.add('hidden');
    
    showNotification('Settings saved successfully!');
  });

  // Clear Settings Clicked
  clearKeyBtn.addEventListener('click', () => {
    storedApiKey = '';
    useDirectClient = false;
    apiKeyInput.value = '';
    directClientToggle.checked = false;

    localStorage.removeItem('AEGIS_GEMINI_API_KEY');
    localStorage.removeItem('AEGIS_USE_DIRECT_CLIENT');
    
    updateModeBadge();
    settingsModal.classList.add('hidden');
    
    showNotification('Local API key cleared.');
  });

  // Function to Update Footer API Connection Mode Badge
  function updateModeBadge() {
    if (useDirectClient && storedApiKey) {
      apiModeLabel.textContent = 'Direct Client';
      apiModeLabel.className = 'mode-tag badge-client';
    } else {
      apiModeLabel.textContent = 'Serverless';
      apiModeLabel.className = 'mode-tag badge-server';
    }
  }

  // Temporary Custom Notification Banner
  function showNotification(message) {
    const notifyDiv = document.createElement('div');
    notifyDiv.style.position = 'fixed';
    notifyDiv.style.bottom = '20px';
    notifyDiv.style.right = '20px';
    notifyDiv.style.background = '#0f172a';
    notifyDiv.style.border = '1px solid var(--color-primary)';
    notifyDiv.style.color = '#fff';
    notifyDiv.style.padding = '0.75rem 1.5rem';
    notifyDiv.style.borderRadius = '8px';
    notifyDiv.style.fontSize = '0.85rem';
    notifyDiv.style.zIndex = '1000';
    notifyDiv.style.fontFamily = 'var(--font-mono)';
    notifyDiv.style.boxShadow = '0 4px 12px rgba(0, 242, 254, 0.2)';
    notifyDiv.textContent = `[INFO] ${message.toUpperCase()}`;
    
    document.body.appendChild(notifyDiv);
    
    setTimeout(() => {
      notifyDiv.style.opacity = '0';
      notifyDiv.style.transition = 'opacity 0.5s ease';
      setTimeout(() => notifyDiv.remove(), 500);
    }, 2500);
  }

  // Scanning Stages Simulation
  const scanStages = [
    { title: 'Initializing Aegis threat scan engine...', sub: 'CONNECTING SECURE SANDBOX', progress: 15 },
    { title: 'Deconstructing text and harvesting anchors...', sub: 'EXTRACTING LINKS & HEADERS', progress: 40 },
    { title: 'Analyzing reputation database and DNS paths...', sub: 'CONTACTING APEX REPUTATION SERVER', progress: 65 },
    { title: 'Running Gemini AI Phishing Intelligence model...', sub: 'EVALUATING SENSITIVE RED FLAGS', progress: 85 },
    { title: 'Completing telemetry analysis report...', sub: 'PARSING STRUCTURAL SIGNATURES', progress: 98 }
  ];

  // Primary Run Scanner Event
  analyzeBtn.addEventListener('click', async () => {
    const content = threatInput.value.trim();
    if (!content) {
      alert('Error: Please enter a suspicious email or URL to run analysis.');
      return;
    }

    // Hide previous results and show scanner panel
    resultCard.classList.add('hidden');
    scanningProgress.classList.remove('shadow-cyber');
    scanningProgress.classList.remove('hidden');
    analyzeBtn.disabled = true;

    // Simulate scanning stages before making the API call
    for (const stage of scanStages) {
      progressTitle.textContent = stage.title;
      progressSub.textContent = stage.sub;
      progressBar.style.width = `${stage.progress}%`;
      // Pause slightly for aesthetic micro-animations
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    try {
      let analysisResult;

      // Determine Routing Mode
      if (useDirectClient && storedApiKey) {
        // Direct Client Fallback (Queries Gemini API directly from browser)
        analysisResult = await analyzeViaClient(content, storedApiKey);
      } else {
        // Default: Queries the local serverless function endpoint
        analysisResult = await analyzeViaServer(content);
      }

      displayResult(analysisResult);

    } catch (err) {
      alert(`Threat Analysis Failed:\n${err.message}`);
      progressBar.style.width = '0%';
      scanningProgress.classList.add('hidden');
    } finally {
      analyzeBtn.disabled = false;
    }
  });

  // Reset Scanning Form
  resetBtn.addEventListener('click', () => {
    resultCard.classList.add('hidden');
    threatInput.value = '';
    charCount.textContent = '0';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => threatInput.focus(), 300);
  });

  // API Call - SERVERLESS ENDPOINT ROUTE
  async function analyzeViaServer(content) {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.error || `Server responded with code ${response.status}`);
    }

    return await response.json();
  }

  // API Call - DIRECT CLIENT FALLBACK ROUTE
  async function analyzeViaClient(content, apiKey) {
    const model = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const systemInstruction = `You are an expert cybersecurity analyst specializing in threat intelligence, security operations center (SOC) analysis, and phishing email/URL detection.
Your task is to analyze the provided text (which could be an email body, raw email headers, a suspicious link, or a website URL) and determine if it represents a threat (phishing, social engineering, business email compromise (BEC), credential harvesting, spam, or malicious link).
Provide a structured JSON output matching the requested schema. Ensure your explanations are concise, professional, and directly useful in security training or analysis.`;

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
              enum: ['Low', 'Medium', 'High']
            },
            redFlags: {
              type: 'ARRAY',
              items: {
                type: 'STRING'
              }
            },
            explanation: {
              type: 'STRING'
            },
            recommendations: {
              type: 'ARRAY',
              items: {
                type: 'STRING'
              }
            }
          },
          required: ['riskScore', 'redFlags', 'explanation', 'recommendations']
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson?.error?.message || `Gemini connection failed: ${response.status}`);
    }

    const responseData = await response.json();
    const candidateText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!candidateText) {
      throw new Error('Threat intelligence response parse error.');
    }

    return JSON.parse(candidateText);
  }

  // Display structured intelligence response on the UI
  function displayResult(result) {
    // Hide scanning progress
    scanningProgress.classList.add('hidden');
    progressBar.style.width = '0%';

    // Reset card classes
    resultCard.className = 'card result-card';

    const score = (result.riskScore || 'low').toLowerCase();
    
    // Add threat-level specific class styles
    if (score === 'high') {
      resultCard.classList.add('risk-high');
      riskBadge.textContent = 'CRITICAL THREAT DETECTED';
      riskLabel.textContent = 'HIGH';
    } else if (score === 'medium') {
      resultCard.classList.add('risk-medium');
      riskBadge.textContent = 'SUSPICIOUS INDICATORS';
      riskLabel.textContent = 'MEDIUM';
    } else {
      resultCard.classList.add('risk-low');
      riskBadge.textContent = 'NO THREAT DETECTED';
      riskLabel.textContent = 'LOW';
    }

    // Set explanation
    threatExplanation.textContent = result.explanation || 'No details provided.';

    // Populate Red Flags List
    redFlagsList.innerHTML = '';
    if (result.redFlags && result.redFlags.length > 0) {
      result.redFlags.forEach(flag => {
        const li = document.createElement('li');
        li.textContent = flag;
        redFlagsList.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = 'No obvious malicious indicators or red flags identified.';
      redFlagsList.appendChild(li);
    }

    // Populate Recommendations List
    recommendationsList.innerHTML = '';
    if (result.recommendations && result.recommendations.length > 0) {
      result.recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.textContent = rec;
        recommendationsList.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = 'No emergency actions required. Keep observing standard security awareness.';
      recommendationsList.appendChild(li);
    }

    // Reveal Result Card and Scroll it into view
    resultCard.classList.remove('hidden');
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});
