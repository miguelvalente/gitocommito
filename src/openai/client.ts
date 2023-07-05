import { OpenAIApi } from "openai";
import { get_encoding } from "@dqbd/tiktoken";

const enc = get_encoding("cl100k_base");

function chechDiffLenght(text: string) {
  if (enc.encode(text).length > 4096) {
    throw new Error(
      `The commit message is too long. It has ${
        enc.encode(text).length
      } tokens. It should have less than 4096 tokens.`
    );
  }
}

function generateSystemMessage(filter: string, content: string): string {
  switch (filter) {
    case "A":
      content +=
        " Note: This commit added new files.";
      break;
    case "C":
      content += " Note: This commit involves files that were copied.";
      break;
    case "D":
      content +=
        " Note: This commit involves files that were deleted from the repository.";
      break;
    case "M":
      content +=
        " Note: This commit involves existing files that were modified.";
      break;
    case "R":
      content +=
        " Note: This commit involves files or directories that were renamed.";
      break;
    case "T":
      content +=
        " Note: This commit involves files that had their type changed.";
      break;
    case "U":
      content += " Note: This commit involves files that have not been merged.";
      break;
    case "B":
      content += " Note: This commit involves files that have broken pairing.";
      break;
    default:
      content += " Note: This commit involves changes of unknown status.";
      break;
  }

  return content;
}

export async function openAICall(
  stagedChanges: { [key: string]: string },
  openai: OpenAIApi // replace with the correct type according to your OpenAI wrapper
): Promise<string> {
  const allDifs = Object.values(stagedChanges).join("-------\n");

  chechDiffLenght(allDifs);
  let content = `You are a git user with one or more changes. You want to accuratly describe ALL the changes in  commit message. You will reason the accurate commit message from the git diff output. The diff output contains the most relevant information.`;

  // let content = `You are to act as the author of a commit message in git. Your mission is to create clean and comprehensive commit messages in the conventional commit convention and explain WHAT were the changes and WHY the changes were done. I'll send you an output of 'git diff --staged' command, and you convert it into a commit message.`;
  Object.keys(stagedChanges).forEach((key) => {
    content = generateSystemMessage(key, content);
  });
  content +=
    "Only focus on the changes that are relevant to the commit. Use the GitEmoji to reflect the changes. There can be multiple changes in a commit message. Reflect all the changes in the commit message.";

  const chatCompletion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo-16k-0613",
    temperature: 0.8,
    messages: [
      {
        role: "system",
        content: content,
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
            gitEmoji: {
              type: "string",
              enum: [
                ":art:",
                ":zap:",
                ":fire:",
                ":bug:",
                ":white_check_mark:",
                ":lock:",
                ":arrow_up:",
                ":arrow_down:",
                ":wastebasket:",
                ":passport_control:",
                ":adhesive_bandage:",
                ":monocle_face:",
                ":coffin:",
                ":test_tube:",
                ":necktie:",
                ":stethoscope:",
                ":bricks:",
                ":technologist:",
                ":money_with_wings:",
                ":thread:",
                ":safety_vest:",
              ],
              description: "Use GitMoji convention related to the most overarching changes",
            },
            subject: {
              type: "string",
              description:
                "A short, imperative tense description that encapsulates the change or changes.",
            },
            body: {
              type: "string",
              description:
                "Add a short description of WHY the changes are done after the commit message. KEEP IT SHORT.",
            },
          },
          required: ["changeType", "gitEmoji", "subject", "body"],
        },
      },
    ],
    function_call: {
      name: "generate_commit",
    },
  });

  let commitMessage: string;
  try {
    const parsedResponse = JSON.parse(
      chatCompletion?.data?.choices[0]?.message?.function_call?.arguments || ""
    );

    const changeType = parsedResponse.changeType;
    const emoji = parsedResponse.gitEmoji;
    const subject = parsedResponse.subject;
    const body = parsedResponse.body;

    commitMessage = `${changeType}: ${emoji} ${subject}`;

    // Check if body is defined and non-empty before appending it to commitMessage
    if (body && body.trim()) {
      commitMessage += `\n\n${body}`;
    }
  } catch (error) {
    throw new Error(
      `OpenAI request failed to provide a commit message. Sad Gitto.\n Message Response${error}.`
    );
  }

  return commitMessage;
}
