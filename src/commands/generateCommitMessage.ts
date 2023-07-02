// generateCommitMessage.ts
import { OpenAIApi } from "openai"; // Adjust according to your OpenAI SDK import
import { get_encoding, encoding_for_model } from "@dqbd/tiktoken";

const enc = get_encoding("cl100k_base");

export async function generateCommitMessage(
  stagedChanges: { [key: string]: string },
  openai: OpenAIApi // replace with the correct type according to your OpenAI wrapper
): Promise<string> {
  try {
    const allDifs = Object.values(stagedChanges).join("-------\n");

    const tokenCount = enc.encode(allDifs).length;

    if (tokenCount > 4096) {
      throw new Error(
        `The commit message is too long. It has ${tokenCount} tokens. It should have less than 4096 tokens.`
      );
    } else {
      const chatCompletion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo-16k-0613",
        messages: [
          {
            role: "system",
            content: `You are a git user. You have staged changes. You want to commit them. You want to write a commit message.`,
          },
          { role: "user", content: allDifs },
        ],
        functions: [
          {
            name: "generate_commit",
            description: "Generate commit based on allDifs",
            parameters: {
              type: "object",
              properties: {
                changeType: {
                  type: "string",
                  enum: [
                    "docs",
                    "feat",
                    "fix",
                    "refactor",
                    "test",
                    "style",
                    "chore",
                    "ci",
                    "perf",
                    "build",
                    "revert",
                    "other",
                  ],
                },
                emoji: {
                  type: "string",
                  enum: [
                    "🎨",
                    "⚡",
                    "🔥",
                    "🐛",
                    "✅",
                    "🔒",
                    "⬆️",
                    "⬇️",
                    "🗑️",
                    "🛂",
                    "🩹",
                    "🧐",
                    "⚰️",
                    "🧪",
                    "👔",
                    "🩺",
                    "🧱",
                    "👨‍💻",
                    "💸",
                    "🧵",
                    "🦺",
                  ],
                  description:
                    "The picked emoji should be picked according to its Conventional Commit meaning",
                },
                subject: {
                  type: "string",
                  description:
                    "A short, imperative tense description of the change",
                },
                body: {
                  type: "string",
                  description: "A longer description of the change",
                },
              },
              required: ["changeType", "emoji", "subject"],
            },
          },
        ],
      });

      const responseArguments =
        chatCompletion?.data?.choices[0]?.message?.function_call?.arguments;

      const parsedResponse = JSON.parse(responseArguments || "");

      const changeType = parsedResponse.changeType;
      const emoji = parsedResponse.emoji;
      const subject = parsedResponse.subject;
      const body = parsedResponse.body;

      let commitMessage = `${changeType} ${emoji}: ${subject}`;

      // Check if body is defined and non-empty before appending it to commitMessage
      if (body && body.trim()) {
        commitMessage += `\n\n${body}`;
      }

      return commitMessage;
    }
  } catch (error) {
    console.error(`Error generating commit message: ${error}`);
    throw error;
  }
}
