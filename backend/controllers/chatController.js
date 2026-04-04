import crypto from "crypto";
import { GoogleGenAI, Type } from "@google/genai";
import pool from "../config/db.js";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// ---- tool declaration ----
const queryToolDeclaration = {
    name: "search_forum",
    description: "Search for more relevant posts and answers from the forum based on a query string.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            query: {
                type: Type.STRING,
                description: "The search query to find relevant forum posts"
            }
        },
        required: ["query"]
    }
};

// ---- execute tool ----
const queryTool = async ({ query }) => {
    const embedding = await getEmbedding(query);
    const posts = await fetchContext(embedding, 3);  // fetch 3 more posts
    return { context: formatContext(posts) };
};

// ---- helpers ----
const sendEvent = (res, type, data) => {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
};

const getEmbedding = async (query) => {
    const response = await fetch(`${process.env.EMBEDDINGSERVICE_ENDPOINT}/generate_query_embedding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
    });
    const { embedding } = await response.json();
    return embedding;
};

const fetchContext = async (embedding, k = 5) => {
    const { rows: posts } = await pool.query(
        `SELECT post_id, title, body, embedding <=> $1 as similarity 
         FROM posts 
         ORDER BY similarity ASC 
         LIMIT $2`,
        [JSON.stringify(embedding), k]
    );

    for (const post of posts) {
        const { rows: answers } = await pool.query(
            `SELECT content FROM answers 
             WHERE post_id = $1 
             ORDER BY created_at DESC 
             LIMIT 3`,
            [post.post_id]
        );
        post.answers = answers;
    }
    return posts;
};

const formatContext = (posts) => {
    return posts.map(p => {
        const answersStr = p.answers.map(a => ` - ${a.content}`).join("\n");
        return `Post: ${p.title}\nContent: ${p.body}\nAnswers:\n${answersStr}`;
    }).join("\n\n---\n\n");
};

const getConversation = async (id, userId) => {
    const { rows } = await pool.query(
        `SELECT title, full_history, display_history FROM conversations 
         WHERE conversation_id = $1 AND user_id = $2`,
        [id, userId]
    );
    return rows[0];
};

const saveHistory = async (id, display, full) => {
    await pool.query(
        `UPDATE conversations 
         SET display_history = $1::jsonb, full_history = $2::jsonb 
         WHERE conversation_id = $3`,
        [JSON.stringify(display), JSON.stringify(full), id]
    );
};

const generateTitle = async (text) => {
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
            {
                role: "user",
                parts: [{ text }]
            }
        ],
        config: {
            systemInstruction: "Generate a concise and descriptive title for the following text.",
        }
    });
    return response.text;
};

// ---- controllers ----
export const initChat = async (req, res) => {
    const chat_id = `${Date.now()}${crypto.randomBytes(5).toString('hex')}`.substring(0, 30);
    try {
        const result = await pool.query(
            `INSERT INTO conversations (conversation_id, user_id) VALUES ($1, $2) RETURNING *`,
            [chat_id, req.user.user_id]
        );
        res.status(201).json({ conversation_id: result.rows[0].conversation_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const generateContent = async (req, res) => {
    const { conversation_id, query, images } = req.body;
    const userId = req.user.user_id;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
        sendEvent(res, "status", { message: "Analyzing..." });
        const embedding = await getEmbedding(query);

        sendEvent(res, "status", { message: "Retrieving context..." });
        const posts = await fetchContext(embedding);
        const context = formatContext(posts);

        const savedChat = await getConversation(conversation_id, userId);
        if (!savedChat) {
            sendEvent(res, "error", { message: "Conversation not found" });
            return res.end();
        }

        const { title, full_history, display_history } = savedChat;

        if (!title) {
            const newTitle = await generateTitle(query);
            await pool.query(
                `UPDATE conversations SET title = $1 WHERE conversation_id = $2`,
                [newTitle, conversation_id]
            );
        }


        const imageParts = images?.map(img => ({
            inlineData: { mimeType: img.mimeType, data: img.data }
        })) || [];

        sendEvent(res, "status", { message: "Thinking..." });
        const chat = ai.chats.create({
            model: "gemini-3-flash-preview",
            history: full_history || [],
            config: {
                systemInstruction: `
You are a highly reliable technical forum assistant. You answer user questions using retrieved context, tools, and your own knowledge — prioritizing them in that order.

---

## 📥 Context Handling

You always receive a \`context\` field with each user query. This may be:

- **Relevant** — posts, answers, or discussions that directly address the question
- **Partially relevant** — loosely related content that may still be useful
- **Null / empty** — no context was retrieved
- **Irrelevant** — context that does not match the question topic

**Rules:**
- If context is relevant → base your answer primarily on it, supplementing with your own knowledge where needed
- If context is null, empty, or irrelevant → answer entirely from your own knowledge and note it:
  > _No relevant context was retrieved for this query. Answering from general knowledge._
- Never hallucinate details not present in context or your training data
- Never say "I don't have enough information" when you can reasonably answer from general knowledge

---

## 🛠 Tool Usage

Use tools (e.g., \`search_forum\`) when:
- Context is missing AND you're unsure of the answer
- The question requires up-to-date or very specific information
- A broader search would meaningfully improve the answer

Do NOT call tools if the context or your own knowledge already answers the query well.

---

## 🧠 Conflict Resolution

When multiple answers or sources conflict:
1. Prefer **accepted answers** (if indicated)
2. Prefer **highly upvoted or detailed** responses
3. Prefer **consensus** across multiple sources
4. Fall back to your own knowledge, clearly attributed

---

## ✍️ Output Format

**Always respond in Markdown.** Structure your answers like a high-quality Stack Overflow response.

Use:
- \`##\` headings to organize multi-part answers
- \`\`\`language\`\`\` fenced code blocks for all code snippets
- Bullet points for lists of options, pros/cons, or steps
- **Bold** for emphasis on key terms
- \`>\` blockquotes for notes, warnings, or caveats
- Tables for comparisons

**For diagrams**, use **Mermaid** syntax inside fenced code blocks:

\`\`\`mermaid
graph TD
    A[Client] --> B[Load Balancer]
    B --> C[Server 1]
    B --> D[Server 2]
\`\`\`

Use Mermaid when visualizing:
- Flows and sequences (\`graph\`, \`sequenceDiagram\`)
- Entity relationships (\`erDiagram\`)
- State machines (\`stateDiagram-v2\`)
- Class hierarchies (\`classDiagram\`)
- Timelines and Gantt charts

---

## 💻 Code Handling

- Provide **correct, runnable** code whenever applicable
- Briefly explain key lines or concepts after the snippet
- Match the language of the question or context
- Use comments inside code only when they aid clarity

---

## ⚠️ Edge Cases

| Situation | Action |
|---|---|
| Multiple valid approaches | Present the best one first; briefly mention alternatives |
| Ambiguous question | Ask **one focused clarification question** before answering |
| Incorrect premise | Politely correct it, then answer the intended question |
| Broad / open-ended question | Scope the answer clearly; offer to go deeper on sub-topics |

---

## 🚫 Forbidden Behavior

- Do NOT fabricate APIs, functions, libraries, or documentation
- Do NOT assume context that is not present in the retrieved data or your training
- Do NOT ignore available tools when your knowledge is genuinely insufficient
- Do NOT produce walls of unstructured text — always use Markdown formatting

---

## 🎯 Answer Quality Bar

Every response should feel like:
✔ A **highly upvoted Stack Overflow answer**
✔ **Technically correct** and grounded in evidence
✔ **Well-structured** with Markdown and diagrams where helpful
✔ **Practical** — the user can act on it immediately`,
                tools: [{ functionDeclarations: [queryToolDeclaration] }]
            }
        });

        let response = await chat.sendMessage({
            message: [
                ...imageParts,
                { text: `Context from forum:\n\n${context}\n\nQuestion: ${query}` }
            ]
        });

        while (response.functionCalls?.length > 0) {
            sendEvent(res, "status", { message: "Fetching more context..." });
            const toolCall = response.functionCalls[0];
            const result = await queryTool(toolCall.args);
            response = await chat.sendMessage({
                message: [{ functionResponse: { name: toolCall.name, response: result } }]
            });
        }

        const responseText = response.text;

        const updatedDisplay = [
            ...(display_history || []),
            {
                role: "user",
                content: query,
                images: imageParts
            },
            { role: "model", content: responseText }
        ];

        await saveHistory(conversation_id, updatedDisplay, chat.getHistory(true));

        sendEvent(res, "status", { message: "Done!" });
        for (const word of responseText.split(" ")) {
            sendEvent(res, "chunk", { text: word + " " });
            await new Promise(r => setTimeout(r, 20));
        }

        sendEvent(res, "done", {});
        res.end();

    } catch (err) {
        console.error(err);
        sendEvent(res, "error", { message: err.message });
        res.end();
    }
};

export const getPastChats = async (req, res) => {
    const userId = req.user.user_id;
    try {
        const { rows: conversations } = await pool.query(
            `SELECT conversation_id, title, created_at, updated_at 
             FROM conversations 
             WHERE user_id = $1
             ORDER BY updated_at DESC`,
            [userId]
        );
        res.status(200).json(conversations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getConversationHistory = async (req, res) => {
    const userId = req.user.user_id;
    const conversationId = req.params.conversation_id;
    try {
        const { rows } = await pool.query(
            `SELECT display_history 
             FROM conversations 
             WHERE user_id = $1 AND conversation_id = $2`,
            [userId, conversationId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        res.status(200).json(rows[0].display_history || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
