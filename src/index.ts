import { ethers } from 'ethers';

interface RequestBody {
  min: number;
  max: number;
}

interface VRFResponse {
  randomNumber: number;
  proof: string;
  requestId: string;
  min: number;
  max: number;
  timestamp: number;
}

interface Env {
  HARMONY_RPC?: string;
  RATE_LIMIT_PER_MINUTE?: string;
}

// Simple in-memory rate limiter (resets on Worker restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    // New entry or expired window
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 }); // 60 second window
    return true;
  }

  if (entry.count >= limit) {
    return false; // Rate limit exceeded
  }

  entry.count++;
  return true;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // Root path - show interactive frontend
    if (url.pathname === '/' && request.method === 'GET') {
      return new Response(
        `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harmony VRF - Random Number Generator</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 600px;
      width: 100%;
      padding: 2.5rem;
    }
    h1 {
      color: #333;
      font-size: 2rem;
      margin-bottom: 0.5rem;
      text-align: center;
    }
    .subtitle {
      color: #666;
      text-align: center;
      margin-bottom: 2rem;
      font-size: 0.95rem;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    label {
      display: block;
      color: #444;
      font-weight: 600;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }
    input[type="number"] {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }
    input[type="number"]:focus {
      outline: none;
      border-color: #667eea;
    }
    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }
    input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
    .checkbox-group label {
      margin: 0;
      font-weight: 500;
      cursor: pointer;
    }
    button {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .result {
      margin-top: 2rem;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 8px;
      display: none;
    }
    .result.show {
      display: block;
      animation: slideIn 0.3s ease-out;
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .result-number {
      font-size: 3rem;
      font-weight: 700;
      color: #667eea;
      text-align: center;
      margin: 1rem 0;
    }
    .result-label {
      text-align: center;
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }
    .proof-container {
      margin-top: 1rem;
      padding: 1rem;
      background: white;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
    }
    .proof-title {
      font-weight: 600;
      color: #333;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }
    .proof-content {
      font-family: 'Courier New', monospace;
      font-size: 0.8rem;
      color: #555;
      background: #f8f9fa;
      padding: 0.75rem;
      border-radius: 4px;
      word-break: break-all;
      max-height: 200px;
      overflow-y: auto;
    }
    .error {
      background: #fee;
      border: 1px solid #fcc;
      color: #c33;
      padding: 1rem;
      border-radius: 6px;
      margin-top: 1rem;
      display: none;
    }
    .error.show {
      display: block;
    }
    .footer {
      margin-top: 2rem;
      text-align: center;
      color: #999;
      font-size: 0.85rem;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .loading {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255,255,255,.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎲 Random Number Generator</h1>
    <p class="subtitle">Powered by Harmony ONE Blockchain VRF</p>
    
    <form id="vrfForm">
      <div class="form-group">
        <label for="min">Minimum Value</label>
        <input type="number" id="min" name="min" value="1" required min="0">
      </div>
      
      <div class="form-group">
        <label for="max">Maximum Value</label>
        <input type="number" id="max" name="max" value="100" required min="1">
      </div>
      
      <div class="checkbox-group">
        <input type="checkbox" id="showProof" name="showProof">
        <label for="showProof">Show VRF Proof</label>
      </div>
      
      <button type="submit" id="submitBtn">
        Generate Random Number
      </button>
    </form>
    
    <div class="error" id="errorDiv"></div>
    
    <div class="result" id="resultDiv">
      <div class="result-label">Your Random Number</div>
      <div class="result-number" id="randomNumber">-</div>
      <div class="proof-container" id="proofContainer" style="display: none;">
        <div class="proof-title">🔐 Cryptographic Proof</div>
        <div class="proof-content" id="proofContent"></div>
      </div>
    </div>
    
    <div class="footer">
      Verifiable randomness via <a href="https://docs.harmony.one/home/developers/harmony-specifics/native-vrf" target="_blank">Harmony VRF</a>
      <br>
      <a href="https://github.com/patrickmogul/harmony-vrf-site" target="_blank">View on GitHub</a>
    </div>
  </div>

  <script>
    const form = document.getElementById('vrfForm');
    const submitBtn = document.getElementById('submitBtn');
    const resultDiv = document.getElementById('resultDiv');
    const errorDiv = document.getElementById('errorDiv');
    const randomNumber = document.getElementById('randomNumber');
    const proofContainer = document.getElementById('proofContainer');
    const proofContent = document.getElementById('proofContent');
    const showProofCheckbox = document.getElementById('showProof');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const min = parseInt(document.getElementById('min').value);
      const max = parseInt(document.getElementById('max').value);
      const showProof = showProofCheckbox.checked;
      
      // Validation
      if (min >= max) {
        showError('Minimum must be less than maximum');
        return;
      }
      
      if (min < 0 || max < 0) {
        showError('Values must be positive');
        return;
      }
      
      // Hide previous results/errors
      resultDiv.classList.remove('show');
      errorDiv.classList.remove('show');
      
      // Show loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loading"></span>';
      
      try {
        const response = await fetch('/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ min, max })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate random number');
        }
        
        // Show result
        randomNumber.textContent = data.randomNumber;
        resultDiv.classList.add('show');
        
        // Show proof if checkbox is checked
        if (showProof && data.proof) {
          const proofData = JSON.parse(data.proof);
          proofContent.textContent = JSON.stringify(proofData, null, 2);
          proofContainer.style.display = 'block';
        } else {
          proofContainer.style.display = 'none';
        }
        
      } catch (error) {
        showError(error.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Generate Random Number';
      }
    });
    
    function showError(message) {
      errorDiv.textContent = message;
      errorDiv.classList.add('show');
      resultDiv.classList.remove('show');
    }
    
    // Toggle proof visibility when checkbox changes
    showProofCheckbox.addEventListener('change', () => {
      if (proofContent.textContent && resultDiv.classList.contains('show')) {
        proofContainer.style.display = showProofCheckbox.checked ? 'block' : 'none';
      }
    });
  </script>
</body>
</html>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
          },
        }
      );
    }

    // Only accept POST requests for API
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed. Use POST to generate random numbers.' }, 405);
    }

    // Rate limiting
    const rateLimit = parseInt(env.RATE_LIMIT_PER_MINUTE || '60');
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    
    if (!checkRateLimit(clientIP, rateLimit)) {
      return jsonResponse({ 
        error: 'Rate limit exceeded', 
        message: `Maximum ${rateLimit} requests per minute` 
      }, 429);
    }

    try {
      // Parse request body
      const body = await request.json() as RequestBody;
      
      // Validate input
      const { min, max } = body;
      
      if (typeof min !== 'number' || typeof max !== 'number') {
        return jsonResponse({ error: 'min and max must be numbers' }, 400);
      }

      if (!Number.isInteger(min) || !Number.isInteger(max)) {
        return jsonResponse({ error: 'min and max must be whole numbers' }, 400);
      }

      if (min >= max) {
        return jsonResponse({ error: 'min must be less than max' }, 400);
      }

      if (min < 0 || max < 0) {
        return jsonResponse({ error: 'min and max must be positive numbers' }, 400);
      }

      // Generate random number using Harmony's native VRF
      const result = await generateHarmonyVRF(min, max, env);
      
      return jsonResponse(result, 200);
    } catch (error) {
      console.error('Error processing request:', error);
      return jsonResponse({ 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  },
};

function handleCORS(): Response {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// Use Harmony's native VRF (free, built into every block)
async function generateHarmonyVRF(
  min: number,
  max: number,
  env: Env
): Promise<VRFResponse> {
  const HARMONY_RPC = env.HARMONY_RPC || 'https://api.harmony.one';
  
  // Create provider with explicit network config to avoid ENS lookups
  // Using Network.from() to create a network without ENS support
  const network = new ethers.Network('harmony-one', 1666600000);
  const provider = new ethers.JsonRpcProvider(HARMONY_RPC, network, {
    staticNetwork: network // Use staticNetwork to prevent ENS lookups
  });

  // Get current block number for proof metadata
  const blockNumber = await provider.getBlockNumber();
  
  // Access Harmony's native VRF via precompiled contract at 0xff
  // IMPORTANT: The precompile takes NO PARAMETERS - it returns VRF for the current block
  // Use full address format to avoid ENS lookup: 0x00000000000000000000000000000000000000ff
  const vrfContractAddress = '0x00000000000000000000000000000000000000ff';
  
  // Call the VRF precompile with NO DATA (empty calldata)
  // It automatically returns the VRF for the block being executed
  const vrfData = await provider.call({
    to: vrfContractAddress,
    data: '0x' // Empty data - no parameters needed
  });

  // Convert VRF output (32 bytes) to BigInt
  const vrfRandomness = ethers.toBigInt(vrfData);
  
  // Add timestamp for uniqueness - multiple requests in same block will get different results
  const timestamp = Date.now();
  
  // Mix VRF with timestamp to ensure uniqueness per request
  const uniqueSeed = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'uint256'],
      [vrfData, timestamp]
    )
  );
  const uniqueRandomness = ethers.toBigInt(uniqueSeed);
  
  // Calculate random number in range [min, max]
  const range = BigInt(max - min + 1);
  const randomInRange = Number((uniqueRandomness % range) + BigInt(min));

  // Create request ID for tracking
  const requestId = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['uint256', 'uint256', 'uint256', 'uint256'],
      [blockNumber, BigInt(min), BigInt(max), timestamp]
    )
  );

  // Build proof object
  const proof = {
    method: 'harmony-native-vrf',
    blockNumber: blockNumber,
    vrfData: vrfData,
    vrfRandomness: vrfRandomness.toString(),
    uniqueSeed: uniqueSeed,
    timestamp: timestamp,
    chain: 'harmony-one',
    verifiable: true,
    verifyUrl: `https://explorer.harmony.one/block/${blockNumber}`,
    description: 'Uses Harmony\'s native VRF from precompiled contract at 0xff (current block VRF) mixed with timestamp for uniqueness'
  };

  return {
    randomNumber: randomInRange,
    proof: JSON.stringify(proof),
    requestId: requestId,
    min: min,
    max: max,
    timestamp: Date.now()
  };
}
