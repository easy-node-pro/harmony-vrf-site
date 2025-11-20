# Harmony VRF API - Cloudflare Worker

A production-ready Cloudflare Worker API that generates cryptographically secure, verifiable random numbers using Harmony ONE blockchain's native VRF (Verifiable Random Function). This project provides a simple REST API for generating random numbers with blockchain-backed proof of randomness.

**Created by [EasyNodePro](https://easynodepro.com)** - Making blockchain infrastructure accessible.

**🚀 [Live Demo Available](https://vrf.easynodepro.com)**

## Features

- 🎲 **Cryptographically Secure Randomness** - Uses Harmony ONE's native VRF precompiled contract
- ✅ **Verifiable Proofs** - Each random number includes blockchain proof for verification
- 🚀 **Fast & Scalable** - Runs on Cloudflare's global edge network
- 🔒 **Built-in Rate Limiting** - Configurable per-IP rate limits
- 🌐 **CORS Enabled** - Ready for cross-origin requests
- 💰 **Cost Effective** - Leverages Harmony's free native VRF (no gas fees for VRF calls)
- 📝 **Full TypeScript** - Type-safe codebase with comprehensive validation

## How It Works

This API leverages Harmony ONE's unique native VRF feature, which is built into every block via a precompiled contract at address `0xff`. Unlike traditional VRF solutions that require paying gas fees and waiting for multiple transactions, Harmony's native VRF:

- Provides instant randomness from the current block
- Requires no transaction fees
- Is cryptographically secure and verifiable on-chain
- Mixes block VRF with timestamps for uniqueness per request

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (installed via npm)

### Installation

1. **Clone or download this repository:**

```bash
git clone https://github.com/patrickmogul/harmony-vrf-site.git
cd harmony-vrf-site
```

2. **Install dependencies:**

```bash
npm install
```

3. **Test locally:**

```bash
npm run dev
```

The API will be available at `http://localhost:8787`

4. **Test the endpoint:**

```bash
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"min": 1, "max": 100}'
```

## Customization for Your Domain

To customize this API for your own domain, you'll need to update a few configuration files:

### 1. Update `wrangler.toml`

Replace `yourdomain.com` with your actual domain:

```toml
name = "harmony-vrf-worker"
main = "src/index.ts"
compatibility_date = "2023-12-01"

[vars]
RATE_LIMIT_PER_MINUTE = "60"

# Replace yourdomain.com with your actual domain
routes = [
  { pattern = "yourdomain.com", custom_domain = true }
]

[env.production]
name = "harmony-vrf-api"
routes = [
  { pattern = "yourdomain.com", custom_domain = true }
]

[env.production.vars]
RATE_LIMIT_PER_MINUTE = "100"
```

**Example:** If your domain is `api.example.com`, change both route patterns to `"api.example.com"`.

### 2. Update the Landing Page (Optional)

Edit `src/index.ts` around line 99-107 to customize the HTML landing page that appears when someone visits your API root URL in a browser:

```typescript
<h1>🎲 Your Custom Title</h1>
<p>Your custom description</p>
<a href="https://yourdomain.com">Your Link</a>
```

### 3. Configure Environment Variables (Optional)

If you want to use a custom Harmony RPC endpoint:

```bash
# Copy the example file
cp .dev.vars.example .dev.vars

# Edit .dev.vars and uncomment/set:
HARMONY_RPC=https://api.harmony.one
RATE_LIMIT_PER_MINUTE=60
```

**Note:** The `.dev.vars` file is gitignored and only used for local development.

### 4. Update Package Metadata (Optional)

Edit `package.json` to reflect your project details:

```json
{
  "name": "your-project-name",
  "description": "Your description",
  "author": "Your Name"
}
```

## Deployment to Cloudflare Workers

### Step 1: Login to Cloudflare

```bash
npx wrangler login
```

This opens a browser window to authorize Wrangler with your Cloudflare account.

### Step 2: Configure Your Domain

**Important:** Before deploying, ensure your domain is added to Cloudflare:

1. Go to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Add your domain to Cloudflare (if not already added)
3. Update your domain's nameservers to point to Cloudflare
4. Wait for DNS propagation (usually a few minutes)

### Step 3: Deploy

```bash
npm run deploy
```

Cloudflare will automatically:
- Build and upload your Worker
- Provision an SSL certificate for your domain
- Configure DNS records
- Deploy to Cloudflare's global edge network

### Step 4: Verify Deployment

Test your deployed API:

```bash
curl -X POST https://yourdomain.com \
  -H "Content-Type: application/json" \
  -d '{"min": 1, "max": 100}'
```

Expected response:

```json
{
  "randomNumber": 42,
  "proof": "{\"method\":\"harmony-native-vrf\",\"blockNumber\":12345,...}",
  "requestId": "0x...",
  "min": 1,
  "max": 100,
  "timestamp": 1234567890
}
```

## API Usage

### Endpoint

**POST** `/` - Generate a verifiable random number

### Request Body

```json
{
  "min": 1,
  "max": 100
}
```

**Parameters:**
- `min` (number, required): Minimum value (inclusive, must be a positive integer)
- `max` (number, required): Maximum value (inclusive, must be a positive integer greater than min)

### Response

```json
{
  "randomNumber": 42,
  "proof": "{...}",
  "requestId": "0x...",
  "min": 1,
  "max": 100,
  "timestamp": 1234567890
}
```

**Fields:**
- `randomNumber`: The generated random number within your specified range
- `proof`: JSON string containing cryptographic proof and verification details
- `requestId`: Unique identifier for this request
- `min`: Echo of the minimum value requested
- `max`: Echo of the maximum value requested
- `timestamp`: Unix timestamp when the number was generated

### Proof Object

The `proof` field contains a JSON string with verification details:

```json
{
  "method": "harmony-native-vrf",
  "blockNumber": 12345,
  "vrfData": "0x...",
  "vrfRandomness": "123456789...",
  "uniqueSeed": "0x...",
  "timestamp": 1234567890,
  "chain": "harmony-one",
  "verifiable": true,
  "verifyUrl": "https://explorer.harmony.one/block/12345",
  "description": "Uses Harmony's native VRF..."
}
```

You can verify the randomness by checking the block on [Harmony Explorer](https://explorer.harmony.one/).

### Error Responses

```json
{
  "error": "Error message description"
}
```

**Common Errors:**
- `400` - Validation errors (invalid min/max values)
- `405` - Method not allowed (only POST is accepted)
- `429` - Rate limit exceeded
- `500` - Internal server error

See [EXAMPLES.md](./EXAMPLES.md) for code examples in multiple languages.

## Configuration

### Rate Limiting

Configure rate limits in `wrangler.toml`:

```toml
[vars]
RATE_LIMIT_PER_MINUTE = "60"  # Development: 60 requests/minute

[env.production.vars]
RATE_LIMIT_PER_MINUTE = "100"  # Production: 100 requests/minute
```

Rate limits are per-IP address and reset every minute.

### Custom Harmony RPC

To use a custom Harmony RPC endpoint:

**For local development:**
```bash
echo 'HARMONY_RPC=https://your-custom-rpc.com' > .dev.vars
```

**For production (via Cloudflare dashboard):**
1. Go to Workers & Pages → Your Worker → Settings → Variables
2. Add environment variable: `HARMONY_RPC` = `https://your-custom-rpc.com`
3. Or use Wrangler:
```bash
npx wrangler secret put HARMONY_RPC
# Enter your RPC URL when prompted
```

## Development

### Local Development

```bash
npm run dev
```

Starts local development server at `http://localhost:8787`

### Build TypeScript

```bash
npm run build
```

Compiles TypeScript to check for errors.

### Run Tests

```bash
npm test
```

Runs the validation test suite with Vitest.

### Project Structure

```
harmony-vrf-site/
├── src/
│   └── index.ts          # Main Worker code
├── test/
│   └── api.test.ts       # Validation tests
├── wrangler.toml         # Cloudflare Worker configuration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vitest.config.ts      # Test configuration
├── EXAMPLES.md           # Code examples in multiple languages
├── .env.example          # Example environment variables
├── .dev.vars.example     # Example local dev variables
└── README.md             # This file
```

## Monitoring & Maintenance

### View Logs

```bash
npx wrangler tail
```

Shows real-time logs from your deployed Worker.

### Analytics

View usage analytics in your Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your Worker
3. View the Analytics tab for:
   - Request counts
   - Error rates
   - CPU usage
   - Response times

### Updating Your Worker

After making changes to your code:

```bash
npm run deploy
```

Changes are deployed instantly to all edge locations.

## Cloudflare Workers Limits

**Free Tier:**
- 100,000 requests per day
- 10ms CPU time per request
- Unlimited bandwidth

**Paid Tier ($5/month):**
- 10 million requests per month (additional requests $0.50/million)
- 50ms CPU time per request
- No daily limits

For most use cases, the free tier is sufficient. [Learn more about pricing](https://developers.cloudflare.com/workers/platform/pricing/).

## Troubleshooting

### "Domain not found" error during deployment

Ensure your domain is added to Cloudflare and DNS is active:
- Check your Cloudflare dashboard
- Verify nameservers are pointed to Cloudflare
- Wait a few minutes for DNS propagation

### Rate limit errors in development

Edit `.dev.vars` to increase the development rate limit:
```
RATE_LIMIT_PER_MINUTE=1000
```

### "Failed to connect" errors

Check your Harmony RPC endpoint:
- Default: `https://api.harmony.one`
- Try an alternative RPC if needed
- Verify network connectivity

### TypeScript errors

```bash
npm install
npm run build
```

## Advanced Customization

### Modify CORS Settings

Edit `src/index.ts` function `handleCORS()` to restrict origins:

```typescript
function handleCORS(): Response {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': 'https://yourdomain.com', // Restrict to your domain
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
```

### Add API Key Authentication

Add authentication by checking for an API key header:

```typescript
const apiKey = request.headers.get('X-API-Key');
if (apiKey !== env.API_KEY) {
  return jsonResponse({ error: 'Unauthorized' }, 401);
}
```

Then set `API_KEY` as a secret:
```bash
npx wrangler secret put API_KEY
```

### Store Results in a Database

Cloudflare Workers can integrate with:
- [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite)
- [Cloudflare KV](https://developers.cloudflare.com/kv/) (Key-Value store)
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- External databases via HTTP APIs

## Resources

- [Harmony ONE Documentation](https://docs.harmony.one/)
- [Harmony VRF Specification](https://docs.harmony.one/home/developers/harmony-specifics/native-vrf)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Code Examples](./EXAMPLES.md) - Multi-language integration examples

## Contributing

Contributions are welcome! Feel free to:
- Open issues for bugs or feature requests
- Submit pull requests with improvements
- Share your use cases and feedback

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Credits

Created and maintained by [EasyNodePro](https://easynodepro.com) - Your trusted partner for blockchain infrastructure.

Built with ❤️ using Harmony ONE blockchain and Cloudflare Workers.

---

**Need help?** Open an issue on GitHub or visit [easynodepro.com](https://easynodepro.com) for professional blockchain infrastructure support.
