const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  const event = req.body.events[0];

  if (!event || event.type !== "message") {
    return res.sendStatus(200);
  }

  const userMessage = event.message.text;

  console.log("OpenAIに送信します:", userMessage);

  try {
    const aiRes = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: userMessage
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = aiRes.data.choices[0].message.content;

    await axios.post(
      "https://api.line.me/v2/bot/message/reply",
      {
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text: reply
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("返信成功");
    res.sendStatus(200);

  } catch (error) {
    console.log("====== エラー発生 ======");
    console.log(error.response?.data || error.message);
    console.log("======================");

    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("running on " + PORT);
});
