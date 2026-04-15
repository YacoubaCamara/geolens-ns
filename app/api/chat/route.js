export const maxDuration = 60;

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const anthropic = new Anthropic({ apiKey: process.env.GEOLENS_ANTHROPIC_API_KEY });

async function getEmbedding(text) {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.VOYAGE_GEOLENS_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "voyage-3",
      input: [text],
    }),
  });
  const data = await res.json();
  return data.data[0].embedding;
}

async function retrieveContext(question) {
  const queryEmbedding = await getEmbedding(question);

  const { data: chunks, error } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_count: 5,
  });

  if (error) {
    console.error("Retrieval error:", error.message);
    return [];
  }

  return chunks ?? [];
}

export async function POST(req) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1].content;

  const chunks = await retrieveContext(lastMessage);

  const context = chunks
    .map((c, i) => `[Source ${i + 1}: ${c.metadata.source}]\n${c.content}`)
    .join("\n\n---\n\n");

  const systemPrompt = `You are a geoscience assistant for the Nova Scotia Prospectors Association.
Answer questions using ONLY the provided context below.
If the answer isn't in the context, say "I couldn't find that in the available reports."
Always cite which source(s) you used at the end of your answer.

Context:
${context}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await anthropic.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        });

        for await (const chunk of response) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } catch (err) {
        console.error("Stream error:", err.message);
        controller.enqueue(encoder.encode(`Error: ${err.message}`));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}