import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from "discord-interactions";
import "dotenv/config";
import express from "express";
import { DiscordRequest } from "./discord.js";
import { chat } from "./openai.js";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));
function VerifyDiscordRequest(clientKey) {
  return function (req, res, buf, encoding) {
    const signature = req.get("X-Signature-Ed25519");
    const timestamp = req.get("X-Signature-Timestamp");

    const isValidRequest = verifyKey(buf, signature, timestamp, clientKey);
    if (!isValidRequest) {
      res.status(401).send("Bad request signature");
      throw new Error("Bad request signature");
    }
  };
}

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post("/interactions", async function (req, res) {
  // Interaction type and data
  const { type, id, data } = req.body;
  console.log(req.body);

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }
  /**
   * Handle command requests
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    if (data.name === "chat") {
      const userMessage = Object.values(data.resolved.messages)?.[0].content;
      res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "thinking...",
        },
      });

      const botMessage = await chat([
        {
          role: "user",
          content: userMessage,
        },
      ]);

      const response = await DiscordRequest(
        `webhooks/${process.env.APP_ID}/${req.body.token}/messages/@original`,
        {
          method: "PATCH",
          body: {
            content: botMessage,
          },
        }
      );
      console.log(response.statusText);
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
