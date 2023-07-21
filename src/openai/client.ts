import { OpenAIApi } from "openai";
import {
  FIRST_STAGE,
  FIRST_STAGE_USER,
  SECOND_STAGE,
  THIRD_STAGE,
} from "./prompts";
import {
  constructCommitMessage,
  getCommitResponse,
  getMessagesResponse,
  getSystemMessage,
  getAssistantMessages,
} from "./client_helper";

export async function startCommitGeneration(
  stagedChanges: { [key: string]: string },
  openai: OpenAIApi // replace with the correct type according to your OpenAI wrapper
): Promise<string> {
  const allDifs = Object.values(stagedChanges).join("");

  // Stage1: First stage summary of all individual changes based on git diff output.
  const firstStageMessages = getSystemMessage(
    FIRST_STAGE,
    FIRST_STAGE_USER(allDifs)
  );
  const generatedFirstStageMessage = await getMessagesResponse(
    openai,
    firstStageMessages
  );
  console.log(generatedFirstStageMessage?.data?.choices[0]?.message?.content);

  // Second stage reason about changes commit message.
  const secondStageMessages = getAssistantMessages(
    generatedFirstStageMessage?.data?.choices[0]?.message?.content,
    SECOND_STAGE,
    firstStageMessages
  );
  const generatedSecondStageMessage = await getMessagesResponse(
    openai,
    secondStageMessages
  );
  console.log(generatedSecondStageMessage?.data?.choices[0]?.message?.content);

  // Third stage commit message with git emoji.
  const thirdStageMessages = getAssistantMessages(
    generatedSecondStageMessage?.data?.choices[0]?.message?.content,
    THIRD_STAGE,
    secondStageMessages
  );

  const commitResponse = await getCommitResponse(openai, thirdStageMessages);
  const commitMessage = constructCommitMessage(commitResponse);

  console.log(commitMessage);
  return commitMessage;
}

