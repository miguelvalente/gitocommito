import { OpenAIApi, Configuration } from "openai";
import * as vscode from "vscode";

export function configureOpenAI(): OpenAIApi {
  const apiKey = vscode.workspace
    .getConfiguration()
    .get("GitoCommito.OpenAIApiKey") as string;

  const configuration = new Configuration({
    apiKey: apiKey,
  });

  return new OpenAIApi(configuration);
}
