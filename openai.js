import { Configuration, OpenAIApi } from "openai";

export async function chat(messages) {
  const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
  const openai = new OpenAIApi(config);

  const result = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages,
    temperature: 0,
  });
  return result.data.choices[0].message?.content;
}
