import { get_encoding } from "@dqbd/tiktoken";
import { ChatCompletionRequestMessageRoleEnum } from "openai";
import {
  GIT_CHANGE_TYPE_ENUM,
  GIT_EMOJI_DESCRIPTION_ENUM,
  COST_EMOJI_DESCRIPTION_TO_GIT_EMOJI_MAP,
} from "./prompts";

interface ParsedCommitResponse {
  changeType: string;
  gitEmojiDescription: string;
  subject: string;
  body: string;
}

export async function getCommitResponse(openai: any, messages: any[]) {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo-16k-0613",
    temperature: 0.4,
    messages: messages,
    functions: [
      {
        name: "generate_commit",
        description: "Generate commit based on allDifs",
        parameters: {
          type: "object",
          properties: {
            changeType: {
              type: "string",
              enum: GIT_CHANGE_TYPE_ENUM,
            },
            gitEmojiDescription: {
              type: "string",
              enum: GIT_EMOJI_DESCRIPTION_ENUM,
              description:
                "Choose teh description that reflects the changes as described in the body and subject. Select the description without modifying it. Select the description without modifying it based on the overall change.",
            },
            subject: {
              type: "string",
              description:
                "A short, imperative tense description that explains the main Reason behind the commit.",
            },
            body: {
              type: "string",
              description: "Use thought out reasoning to explain the commit.",
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

  return response;
}

export function constructCommitMessage(commitResponse: any): string {
  let commitMessage: string;
  try {
    const parsedCommitResponse: ParsedCommitResponse = JSON.parse(
      commitResponse?.data?.choices[0]?.message?.function_call?.arguments || ""
    );

    const { changeType, gitEmojiDescription, subject, body } =
      parsedCommitResponse;

    console.log("Change Type: ", changeType);
    console.log("kit Emoji Description: ", gitEmojiDescription);

    commitMessage = `${changeType}: ${COST_EMOJI_DESCRIPTION_TO_GIT_EMOJI_MAP[gitEmojiDescription]} ${subject}`;

    if (body && body.trim()) {
      commitMessage += `\n\n${body}`;
    }

    return commitMessage;
  } catch (error) {
    throw new Error(
      `OpenAI request failed to provide a commit message. Sad Gitto.\n Message Response: ${error}.`
    );
  }
}

export async function getMessagesResponse(openai: any, messages: any[]) {
  const generatedMessageResponse = await openai.createChatCompletion({
    model: "gpt-3.5-turbo-16k-0613",
    temperature: 0.4,
    messages: messages,
  });

  return generatedMessageResponse;
}

export function getAssistantMessages(
  assistantContent: string,
  userContent: string,
  previousMessages?: any[]
) {
  let message = [
    {
      role: ChatCompletionRequestMessageRoleEnum.Assistant,
      content: assistantContent,
    },
    {
      role: ChatCompletionRequestMessageRoleEnum.User,
      content: userContent,
    },
  ];

  if (previousMessages) {
    return [...previousMessages, ...message];
  }

  return message;
}

export function getSystemMessage(systemContent: string, userContent: string) {
  return [
    {
      role: ChatCompletionRequestMessageRoleEnum.Assistant,
      content: systemContent,
    },
    {
      role: ChatCompletionRequestMessageRoleEnum.User,
      content: userContent,
    },
  ];
}

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
