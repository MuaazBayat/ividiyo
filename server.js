const { TopicRole, CredentialProvider, AuthClient, CacheRole, ExpiresIn } = require("@gomomento/sdk");
const express = require('express');
const { config } = require('dotenv');
config();

const authToken = process.env.MOMENTO_AUTH_TOKEN;
if (!authToken) {
  throw new Error("MOMENTO_AUTH_TOKEN is not set in environment variables");
}
const credentials = CredentialProvider.fromString({ apiKey: authToken });
const momentoAuthClient = new AuthClient({ credentialProvider: credentials });

const app = express();
app.use(express.json());

async function generateVisitorToken(visitorId, agentId) {
  const permissions = [
    {
      role: TopicRole.PublishOnly,
      cache: "test",
      topic: `agent:${agentId}:inbox`
    },
    {
      role: TopicRole.SubscribeOnly,
      cache: "test",
      topic: `visitor:${visitorId}:inbox`
    },
    {
      role: CacheRole.ReadOnly,
      cache: "agent",
      item: { key: `${agentId}-online` }
    }
  ];
  const result = await momentoAuthClient.generateDisposableToken({ permissions }, ExpiresIn.minutes(10));
  return result.authToken;
}

async function generateAgentToken(agentId) {
  const permissions = [
    {
      role: TopicRole.SubscribeOnly,
      cache: "test",
      topic: `agent:${agentId}:inbox`
    },
    {
      role: TopicRole.PublishOnly,
      cache: "test",
      topic: "*"
    },
    {
      role: CacheRole.WriteOnly,
      cache: "agent",
      item: { key: `${agentId}-online` }
    }
  ];
  const result = await momentoAuthClient.generateDisposableToken({ permissions }, ExpiresIn.minutes(10));
  return result.authToken;
}

app.get('/token', async (req, res) => {
  const { visitorId, agentId } = req.query;

  if (!agentId) {
    return res.status(400).json({ error: "Missing agentId" });
  }

  try {
    let token;
    if (visitorId) {
      token = await generateVisitorToken(visitorId, agentId);
    } else {
      token = await generateAgentToken(agentId);
    }
    res.json({ token });
  } catch (err) {
    console.error('Error generating token:', err);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

module.exports = app;
