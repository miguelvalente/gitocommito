import { OpenAIApi, Configuration } from "openai";
import * as vscode from "vscode";

export function configureOpenAI(): OpenAIApi {
  const apiKey = vscode.workspace
    .getConfiguration()
    .get("GitoCommito.OpenAIApiKey") as string;

  if (!apiKey || apiKey.trim() === "") {
    vscode.window.showErrorMessage(
      "OpenAI API keythrow new is missing. Set the key with `GitoCommito: Set OpenAI API Key` command."
    );
    throw new Error('OpenAI API key is missing. Please provide a valid API key.');
  }

  const configuration = new Configuration({
    apiKey: apiKey,
  });

  return new OpenAIApi(configuration);
}
