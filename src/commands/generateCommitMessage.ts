// generateCommitMessage.ts
import { OpenAIApi} from 'openai'; // Adjust according to your OpenAI SDK import

export async function generateCommitMessage(
  stagedChanges: { [key: string]: string }, 
  openai: OpenAIApi // replace with the correct type according to your OpenAI wrapper
): Promise<string> {
  try {
    const allDifs = Object.values(stagedChanges).join("-------\n");

    const chatCompletion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-16k-0613",
      messages: [
        {
          role: "system",
          content: `You are a git user. You have staged changes. You want to commit them. You want to write a commit message.`,
        },
        { role: "user", content: "Hello TEST PRINT THIS" },
      ],
      functions: [
        {
          name: "generate_commit",
          description: "Generate commit based on allDifs",
          parameters: {
            type: "object",
            properties: {
              change_type: {
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
            required: ["change_type", "emoji", "subject"],
          },
        },
      ],
    });


    if (
        chatCompletion.data.choices && 
        chatCompletion.data.choices[0].message && 
        chatCompletion.data.choices[0].message.content
    ) {
        return chatCompletion.data.choices[0].message.content;
    } else {
        // Handle the case when choices or message is not defined
        // Return a default message
        return "No commit message was generated";
    }

  } catch (error) {
    console.error(`Error generating commit message: ${error}`);
    throw error;
  }
}
