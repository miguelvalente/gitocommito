import { OpenAIApi } from "openai";
import { get_encoding } from "@dqbd/tiktoken";
import {
  ChatCompletionRequestMessageRoleEnum,
} from "openai";

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


export async function startCommitGeneration(
  stagedChanges: { [key: string]: string },
  openai: OpenAIApi // replace with the correct type according to your OpenAI wrapper
): Promise<string> {
  let allDifs = Object.values(stagedChanges).join("");

  // Stage1: First stage summary of all individual changes based on git diff output.
  let firstStageMessages = [
    {
      role: ChatCompletionRequestMessageRoleEnum.System,
      content:
        "You are a world class Software Developer. " +
        "You are going to look at a git diff output and summarize the changes. " +
        "The summary should not include the code. " +
        "You carefully explain code with great detail and accuracy. " +
        "You look for `diff --git` as a sign of the type of change and file. " +
        "You organize your explanations in markdown-formatted, bulleted lists.",
    },
    {
      role: ChatCompletionRequestMessageRoleEnum.User,
      content:
        "Please explain the following diff output. " +
        "Organize your explanation as a markdown-formatted, bulleted list." +
        "\ngit diff --staged" +
        `${allDifs}`,
    },
  ];

  const generatedFirstStageMessage = await openai.createChatCompletion({
    model: "gpt-3.5-turbo-16k-0613",
    temperature: 0.4,
    messages: firstStageMessages,
  });
  console.log(generatedFirstStageMessage?.data?.choices[0]?.message?.content);

  // Second stage reason about changes commit message.
  let secondStageMessages = [
    {
      role: ChatCompletionRequestMessageRoleEnum.Assistant,
      content: generatedFirstStageMessage?.data?.choices[0]?.message?.content,
    },
    {
      role: ChatCompletionRequestMessageRoleEnum.User,
      content:
        "Pick out the most important changes. " +
        "Provide a Reason about the functionality of the new changes. " +
        "You organize your explanations in markdown-formatted, bulleted lists.",
    },
  ];

  const secondStageMessagesAll = [
    ...firstStageMessages,
    ...secondStageMessages,
  ];

  const generatedSecondStageMessage = await openai.createChatCompletion({
    model: "gpt-3.5-turbo-16k-0613",
    temperature: 0.4,
    messages: secondStageMessagesAll,
  });
  console.log(generatedSecondStageMessage?.data?.choices[0]?.message?.content);

  // Third stage commit message with git emoji.
  let thirdStageMessages = [
    {
      role: ChatCompletionRequestMessageRoleEnum.Assistant,
      content: generatedSecondStageMessage?.data?.choices[0]?.message?.content,
    },
    {
      role: ChatCompletionRequestMessageRoleEnum.User,
      content:
        "Use everything until now to write a single commit message that encapsulates the changes. " +
        "The commit message should be in the conventional commit format. " +
        "Use bullet points to organize your commit message. ",
    },
  ];

  const thirdStageMessagesAll = [ ...secondStageMessagesAll, ...thirdStageMessages ]; 

  const generatedThirdStageMessage = await openai.createChatCompletion({
    model: "gpt-3.5-turbo-16k-0613",
    temperature: 0.4,
    messages: thirdStageMessagesAll,
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
            gitEmojiDescription: {
              type: "string",
              enum: [
                "Format code to make it cleaner and more maintainable",
                "Refactor code",
                "Optimizing code to enhance its performance",
                "Deleting code or files that are no longer needed",
                "Fixing an error in the code",
                "Adding tests to ensure the code works as intended",
                "Implementing or improving security measures",
                "Upgrading to a newer version of a dependency",
                "Downgrading to an older version of a dependency",
                "Marking code for future removal or replacement",
                "Working on authentication, authorization, and user permissions",
                "Making a minor fix that isn’t urgent",
                "Examining data or inspecting code for analysis",
                "Removing code that is obsolete or redundant",
                "Adding a test that is designed to fail, for testing purposes",
                "Adding or modifying code that deals with business processes",
                "Adding or modifying health checks, usually for production monitoring",
                "Making changes related to system infrastructure",
                "Enhancing the development environment or tools",
                "Adding or modifying code related to financial transactions or fundraising",
                "Adding or modifying code for parallel processing",
                "Adding or modifying validation checks",
              ],
              description: "Select the description that makes most sense based on the subject and body of the commit message.",
            },
            subject: {
              type: "string",
              description:
                "A short, imperative tense description that explains the main Reason behind the commit.",
            },
            body: {
              type: "string",
              description:
                "Use thought out reasoning to explain the commit.",
            },
          },
          required: ["changeType", "gitEmojiDescription", "subject", "body"],
        },
      },
    ],
    function_call: {
      name: "generate_commit",
    },
  });

  let commitMessage: string;
  let emojiDescription: string;
  let changeType: string;
  let subject: string;
  let body: string;
  const costEmojiDescriptiontoGitEmoji: { [key: string]: string } = {
    "Format code to make it cleaner and more maintainable": ":art:",
    "Refactor code": ":recycle:",
    "Optimizing code to enhance its performance": ":zap:",
    "Deleting code or files that are no longer needed": ":fire:",
    "Fixing an error in the code": ":bug:",
    "Adding tests to ensure the code works as intended": ":white_check_mark:",
    "Implementing or improving security measures": ":lock:",
    "Upgrading to a newer version of a dependency": ":arrow_up:",
    "Downgrading to an older version of a dependency": ":arrow_down:",
    "Marking code for future removal or replacement": ":wastebasket:",
    "Working on authentication, authorization, and user permissions": ":passport_control:",
    "Making a minor fix that isn’t urgent": ":adhesive_bandage:",
    "Examining data or inspecting code for analysis": ":monocle_face:",
    "Removing code that is obsolete or redundant": ":coffin:",
    "Adding a test that is designed to fail, for testing purposes": ":test_tube:",
    "Adding or modifying code that deals with business processes": ":necktie:",
    "Adding or modifying health checks, usually for production monitoring": ":stethoscope:",
    "Making changes related to system infrastructure": ":bricks:",
    "Enhancing the development environment or tools": ":technologist:",
    "Adding or modifying code related to financial transactions or fundraising": ":money_with_wings:",
    "Adding or modifying code for parallel processing": ":thread:",
    "Adding or modifying validation checks": ":safety_vest:",
  };

  try {
    const parsedResponse = JSON.parse(
      generatedThirdStageMessage?.data?.choices[0]?.message?.function_call
        ?.arguments || ""
    );

    changeType = parsedResponse.changeType;
    emojiDescription = parsedResponse.gitEmojiDescription;
    subject = parsedResponse.subject;
    body = parsedResponse.body;
    commitMessage = `${changeType}: ${costEmojiDescriptiontoGitEmoji[emojiDescription]} ${subject}`;

    if (body && body.trim()) {
      commitMessage += `\n\n${body}`;
    }
  } catch (error) {
    throw new Error(
      `OpenAI request failed to provide a commit message. Sad Gitto.\n Message Response${error}.`
    );
  }

  console.log(commitMessage);
  return commitMessage;
}
