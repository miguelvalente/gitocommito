import { OpenAIApi } from "openai";
import { get_encoding } from "@dqbd/tiktoken";
import { create } from "domain";

const enc = get_encoding("cl100k_base");

function chechDiffLenght(text: string) {
  if (enc.encode(text).length > 15700) {
    throw new Error(
      `The commit message is too long. It has ${
        enc.encode(text).length
      } tokens. It should have less than 15700 tokens.`
    );
  }
}

function generateSystemMessage(filter: string, content: string): string {
  switch (filter) {
    case "A":
      content += " Note: This commit added new files.";
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
  let allDifs = Object.values(stagedChanges).join(" ");

  chechDiffLenght(allDifs);
  let content =
    "You are a git user with one or more changes in the codebase. " +
    "You want to accurately describe ALL CHANGES in commit a message. " +
    "You will reason the accurate commit message that reflects ALL CHANGES from the git diff output. " +
    "The diff output contains the MOST IMPORTANT information. " +
    "There can be multiple changes in a commit message. " +
    "Reflect ALL IMPORTANT CHANGES in the commit message. ";

  // let content = `You are to act as the author of a commit message in git. Your mission is to create clean and comprehensive commit messages in the conventional commit convention and explain WHAT were the changes and WHY the changes were done. I'll send you an output of 'git diff --staged' command, and you convert it into a commit message.`;
  Object.keys(stagedChanges).forEach((key) => {
    content = generateSystemMessage(key, content);
  });

  const gitEmojiDescripion =
    "Use the right GitEmoji to reflect the OVERARCHING CHANGE type based on its DESCRIPTION." +
    "DESCRIPTION Comes after the PIPE operator |";

  const generatedCommitMessage = await openai.createChatCompletion({
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
              description: gitEmojiDescripion,
            },
            subject: {
              type: "string",
              description:
                "A short, imperative tense description that encapsulates ALL CHANGES.",
            },
            body: {
              type: "string",
              description:
                "Add a short description of WHY the changes are done after the commit message.  WRITE SHORT BULLET POINTS.",
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
  let emoji: string;
  let changeType: string;
  let subject: string;
  let body: string;


  try {
    const parsedResponse = JSON.parse(
      generatedCommitMessage?.data?.choices[0]?.message?.function_call
        ?.arguments || ""
    );

    changeType = parsedResponse.changeType;
    emoji = parsedResponse.gitEmoji.split("|")[0];
    subject = parsedResponse.subject;
    body = parsedResponse.body;
    commitMessage = `${changeType}: ${emoji} ${subject}`;

    if (body && body.trim()) {
      commitMessage += `\n\n${body}`;
    }
  } catch (error) {
    throw new Error(
      `OpenAI request failed to provide a commit message. Sad Gitto.\n Message Response${error}.`
    );
  }


  let contentCheckSystem =
    `You are tech lead on a software project. ` +
    `You are making sure the commits are correct. ` +
    `You have ONE TASK. Check if the GitEmoji is the right one. ` +
    `You have access to the following GITEMOJI INFORMATION to HELP make the decision. ` +
    `:art:|Refactoring code to make it cleaner and more maintainable. ` +
    `:zap:|Optimizing code to enhance its performance. ` +
    `:fire:|Deleting code or files that are no longer needed. ` +
    `:bug:|Fixing an error in the code. ` +
    `:white_check_mark:|Adding tests to ensure the code works as intended. ` +
    `:lock:|Implementing or improving security measures. ` +
    `:arrow_up:|Upgrading to a newer version of a dependency. ` +
    `:arrow_down:|Downgrading to an older version of a dependency. ` +
    `:wastebasket:|Marking code for future removal or replacement. ` +
    `:passport_control:|Working on authentication, authorization, and user permissions. ` +
    `:adhesive_bandage:|Making a minor fix that isn’t urgent. ` +
    `:monocle_face:|Examining data or inspecting code for analysis. ` +
    `:coffin:|Removing code that is obsolete or redundant. ` +
    `:test_tube:|Adding a test that is designed to fail, for testing purposes. ` +
    `:necktie:|Adding or modifying code that deals with business processes. ` +
    `:stethoscope:|Adding or modifying health checks, usually for production monitoring. ` +
    `:bricks:|Making changes related to system infrastructure. ` +
    `:technologist:|Enhancing the development environment or tools. ` +
    `:money_with_wings:|Adding or modifying code related to financial transactions or fundraising. ` +
    `:thread:|Adding or modifying code for parallel processing. ` +
    `:safety_vest:|Adding or modifying validation checks. ` +
    `The user will now provide you with a commit message. Choose the correct GitEmoji.`;

  let contentCheckUser = `This is the commit message:  ${commitMessage}`;

  const commitMessageCheck = await openai.createChatCompletion({
    model: "gpt-3.5-turbo-16k-0613",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: contentCheckSystem,
      },
      { role: "user", content: contentCheckUser },
    ],
    functions: [
      {
        name: "git_emoji_check",
        description: "Gives the correct GitEmoji.",
        parameters: {
          type: "object",
          properties: {
            gitEmoji: {
              type: "string",
              enum: [
                ":art:|Refactoring code to make it cleaner and more maintainable.",
                ":zap:|Optimizing code to enhance its performance.",
                ":fire:|Deleting code or files that are no longer needed.",
                ":bug:|Fixing an error in the code.",
                ":white_check_mark:|Adding tests to ensure the code works as intended.",
                ":lock:|Implementing or improving security measures.",
                ":arrow_up:|Upgrading to a newer version of a dependency.",
                ":arrow_down:|Downgrading to an older version of a dependency.",
                ":wastebasket:|Marking code for future removal or replacement.",
                ":passport_control:|Working on authentication, authorization, and user permissions.",
                ":adhesive_bandage:|Making a minor fix that isn’t urgent.",
                ":monocle_face:|Examining data or inspecting code for analysis.",
                ":coffin:|Removing code that is obsolete or redundant.",
                ":test_tube:|Adding a test that is designed to fail, for testing purposes.",
                ":necktie:|Adding or modifying code that deals with business processes.",
                ":stethoscope:|Adding or modifying health checks, usually for production monitoring.",
                ":bricks:|Making changes related to system infrastructure.",
                ":technologist:|Enhancing the development environment or tools.",
                ":money_with_wings:|Adding or modifying code related to financial transactions or fundraising.",
                ":thread:|Adding or modifying code for parallel processing.",
                ":safety_vest:|Adding or modifying validation checks.",
              ],
              description: gitEmojiDescripion,
            },
          },
          required: ["gitEmoji"],
        },
      },
    ],
    function_call: {
      name: "git_emoji_check",
    },
  });

  try {
    const parsedResponse = JSON.parse(
      generatedCommitMessage?.data?.choices[0]?.message?.function_call
        ?.arguments || ""
    );
    emoji = parsedResponse.gitEmoji.split("|")[0];
  } catch (error) {
    throw new Error(
      `OpenAI request failed to provide a correct GitEmoji. Sad Gitto.\n Message Response${error}.`
    );
  }
  console.log("FIRST" +commitMessage);

  commitMessage = `${changeType}: ${emoji} ${subject}`;
  // Check if body is defined and non-empty before appending it to commitMessage
  if (body && body.trim()) {
    commitMessage += `\n\n${body}`;
  }

  console.log(commitMessage);

  return commitMessage;
}
