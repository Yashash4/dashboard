/**
 * API code examples for the API Access Manager.
 * Extracted from api-access-manager.tsx for maintainability (59_MED_29).
 */

export function getCodeExamples(endpoint: string, baseUrl: string) {
  return {
    chat: {
      curl: `# Send a message
curl -X POST "${endpoint}" \\
  -H "Authorization: Bearer clw_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello!", "agent": "default"}'

# Streaming response
curl -X POST "${endpoint}" \\
  -H "Authorization: Bearer clw_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello!", "agent": "default", "stream": true}'

# With session persistence
curl -X POST "${endpoint}" \\
  -H "Authorization: Bearer clw_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Follow up question", "session_id": "my-session-1"}'`,
      python: `import requests

# Basic chat
response = requests.post(
    "${endpoint}",
    headers={"Authorization": "Bearer clw_your_key_here"},
    json={"message": "Hello!", "agent": "default"},
)
print(response.json()["response"])

# Streaming
import json
response = requests.post(
    "${endpoint}",
    headers={"Authorization": "Bearer clw_your_key_here"},
    json={"message": "Hello!", "stream": True},
    stream=True,
)
for line in response.iter_lines():
    if line and line.startswith(b"data: "):
        data = line[6:]
        if data == b"[DONE]":
            break
        chunk = json.loads(data)
        print(chunk.get("content", ""), end="", flush=True)`,
      javascript: `// Basic chat
const response = await fetch("${endpoint}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer clw_your_key_here",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ message: "Hello!", agent: "default" }),
});
const { response: reply } = await response.json();

// Streaming
const stream = await fetch("${endpoint}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer clw_your_key_here",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ message: "Hello!", stream: true }),
});
const reader = stream.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  // Parse SSE data lines
  for (const line of chunk.split("\\n")) {
    if (line.startsWith("data: ") && line !== "data: [DONE]") {
      const { content } = JSON.parse(line.slice(6));
      process.stdout.write(content);
    }
  }
}`,
      powershell: `# Basic chat
$response = Invoke-RestMethod \`
  -Uri "${endpoint}" \`
  -Method POST \`
  -Headers @{
    "Authorization" = "Bearer clw_your_key_here"
    "Content-Type"  = "application/json"
  } \`
  -Body '{"message": "Hello!", "agent": "default"}'

$response.response`,
    },
    health: {
      curl: `# Health check — validate your key without using tokens
curl -H "Authorization: Bearer clw_your_key_here" \\
  "${baseUrl}/api/v1/health"

# Response: {"status":"ok","plan":"pro","key_name":"...","rate_limit":60,"agents":["agent1"]}`,
      python: `# Health check
response = requests.get(
    "${baseUrl}/api/v1/health",
    headers={"Authorization": "Bearer clw_your_key_here"},
)
info = response.json()
print(f"Plan: {info['plan']}, Agents: {info['agents']}")`,
      javascript: `// Health check
const health = await fetch("${baseUrl}/api/v1/health", {
  headers: { "Authorization": "Bearer clw_your_key_here" },
});
const info = await health.json();
console.log(info.status, info.agents);`,
      powershell: `# Health check
$health = Invoke-RestMethod \`
  -Uri "${baseUrl}/api/v1/health" \`
  -Headers @{ "Authorization" = "Bearer clw_your_key_here" }

$health | ConvertTo-Json`,
    },
    conversations: {
      curl: `# List conversations
curl -H "Authorization: Bearer clw_your_key_here" \\
  "${baseUrl}/api/v1/conversations?limit=10"

# Get messages for a conversation
curl -H "Authorization: Bearer clw_your_key_here" \\
  "${baseUrl}/api/v1/conversations/CONVERSATION_ID/messages?limit=50"`,
      python: `# List conversations
convos = requests.get(
    "${baseUrl}/api/v1/conversations",
    headers={"Authorization": "Bearer clw_your_key_here"},
    params={"limit": 10, "agent": "default"},
).json()

# Get messages
messages = requests.get(
    f"${baseUrl}/api/v1/conversations/{convos['conversations'][0]['id']}/messages",
    headers={"Authorization": "Bearer clw_your_key_here"},
).json()`,
      javascript: `// List conversations
const convos = await fetch(
  "${baseUrl}/api/v1/conversations?limit=10",
  { headers: { "Authorization": "Bearer clw_your_key_here" } }
).then(r => r.json());

// Get messages
const msgs = await fetch(
  \`${baseUrl}/api/v1/conversations/\${convos.conversations[0].id}/messages\`,
  { headers: { "Authorization": "Bearer clw_your_key_here" } }
).then(r => r.json());`,
      powershell: `# List conversations
$convos = Invoke-RestMethod \`
  -Uri "${baseUrl}/api/v1/conversations?limit=10" \`
  -Headers @{ "Authorization" = "Bearer clw_your_key_here" }

$convos.conversations`,
    },
  };
}
