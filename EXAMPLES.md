# API Examples

This document provides example code for using the VRF API in various programming languages and frameworks.

## JavaScript / Node.js

### Basic Usage

```javascript
async function getRandomNumber(min, max) {
  const response = await fetch('https://yourdomain.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ min, max })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    console.log('Random number:', data.randomNumber);
    console.log('Proof:', JSON.parse(data.proof));
    return data;
  } else {
    console.error('Error:', data.error);
    throw new Error(data.error);
  }
}

// Usage
getRandomNumber(1, 100)
  .then(result => console.log('Result:', result))
  .catch(error => console.error('Failed:', error));
```

### With Error Handling

```javascript
async function getVerifiableRandomNumber(min, max) {
  try {
    // Validate inputs
    if (typeof min !== 'number' || typeof max !== 'number') {
      throw new Error('min and max must be numbers');
    }
    
    if (!Number.isInteger(min) || !Number.isInteger(max)) {
      throw new Error('min and max must be integers');
    }
    
    if (min >= max) {
      throw new Error('min must be less than max');
    }
    
    const response = await fetch('https://yourdomain.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ min, max })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting random number:', error.message);
    throw error;
  }
}
```

### React Hook

```javascript
import { useState, useCallback } from 'react';

function useVRFRandom() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  
  const generateRandom = useCallback(async (min, max) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://yourdomain.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ min, max })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
        return data;
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { generateRandom, loading, error, result };
}

// Usage in component
function RandomNumberGenerator() {
  const { generateRandom, loading, error, result } = useVRFRandom();
  
  const handleGenerate = () => {
    generateRandom(1, 100);
  };
  
  return (
    <div>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Random Number'}
      </button>
      {error && <p>Error: {error}</p>}
      {result && <p>Random Number: {result.randomNumber}</p>}
    </div>
  );
}
```

## Python

```python
import requests
import json

def get_random_number(min_val, max_val):
    url = 'https://yourdomain.com'
    headers = {'Content-Type': 'application/json'}
    data = {'min': min_val, 'max': max_val}
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        
        result = response.json()
        print(f"Random number: {result['randomNumber']}")
        print(f"Request ID: {result['requestId']}")
        
        # Parse proof
        proof = json.loads(result['proof'])
        print(f"Block number: {proof['blockNumber']}")
        print(f"Chain: {proof['chain']}")
        
        return result
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        if hasattr(e.response, 'json'):
            print(f"Server error: {e.response.json()}")
        raise

# Usage
result = get_random_number(1, 100)
print(f"Got random number: {result['randomNumber']}")
```

## cURL

### Basic Request

```bash
curl -X POST https://yourdomain.com \
  -H "Content-Type: application/json" \
  -d '{"min": 1, "max": 100}'
```

### Pretty Printed Output

```bash
curl -X POST https://yourdomain.com \
  -H "Content-Type: application/json" \
  -d '{"min": 1, "max": 100}' \
  | jq '.'
```

### Extract Just the Random Number

```bash
curl -s -X POST https://yourdomain.com \
  -H "Content-Type: application/json" \
  -d '{"min": 1, "max": 100}' \
  | jq -r '.randomNumber'
```

## PHP

```php
<?php

function getRandomNumber($min, $max) {
    $url = 'https://yourdomain.com';
    $data = json_encode(['min' => $min, 'max' => $max]);
    
    $options = [
        'http' => [
            'header'  => "Content-Type: application/json\r\n",
            'method'  => 'POST',
            'content' => $data,
        ],
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    if ($result === false) {
        throw new Exception('Failed to get random number');
    }
    
    return json_decode($result, true);
}

// Usage
try {
    $result = getRandomNumber(1, 100);
    echo "Random number: " . $result['randomNumber'] . "\n";
    echo "Request ID: " . $result['requestId'] . "\n";
    
    $proof = json_decode($result['proof'], true);
    echo "Block number: " . $proof['blockNumber'] . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
```

## Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
)

type Request struct {
    Min int `json:"min"`
    Max int `json:"max"`
}

type Response struct {
    RandomNumber int    `json:"randomNumber"`
    Proof        string `json:"proof"`
    RequestID    string `json:"requestId"`
    Min          int    `json:"min"`
    Max          int    `json:"max"`
    Timestamp    int64  `json:"timestamp"`
}

func getRandomNumber(min, max int) (*Response, error) {
    url := "https://yourdomain.com"
    
    reqData := Request{Min: min, Max: max}
    jsonData, err := json.Marshal(reqData)
    if err != nil {
        return nil, err
    }
    
    resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }
    
    var result Response
    err = json.Unmarshal(body, &result)
    if err != nil {
        return nil, err
    }
    
    return &result, nil
}

func main() {
    result, err := getRandomNumber(1, 100)
    if err != nil {
        fmt.Printf("Error: %v\n", err)
        return
    }
    
    fmt.Printf("Random number: %d\n", result.RandomNumber)
    fmt.Printf("Request ID: %s\n", result.RequestID)
}
```

## Response Format

All successful requests return a JSON object with the following structure:

```json
{
  "randomNumber": 42,
  "proof": "{\"method\":\"harmony-native-vrf\",\"blockNumber\":12345,\"vrfData\":\"0x...\",\"timestamp\":1234567890,\"chain\":\"harmony-one\"}",
  "requestId": "0x...",
  "min": 1,
  "max": 100,
  "timestamp": 1234567890
}
```

### Proof Object

The `proof` field is a JSON string that can be parsed to get:

- `method`: The VRF method used (harmony-native-vrf)
- `blockNumber`: Blockchain block number at time of generation
- `vrfData`: The raw VRF data from Harmony's precompiled contract
- `vrfRandomness`: The randomness value as a string
- `uniqueSeed`: Unique seed for this request (VRF + timestamp)
- `timestamp`: Unix timestamp of generation
- `chain`: Blockchain network used (harmony-one)
- `verifiable`: Boolean indicating if the result is verifiable
- `verifyUrl`: URL to verify the block on Harmony explorer

## Error Responses

Error responses have the format:

```json
{
  "error": "Error message description"
}
```

Common errors:
- `"min and max must be numbers"` - Non-numeric input
- `"min and max must be whole numbers"` - Decimal numbers provided
- `"min must be less than max"` - Invalid range
- `"min and max must be positive numbers"` - Negative numbers provided
- `"Method not allowed"` - Non-POST request
- `"Rate limit exceeded"` - Too many requests per minute
