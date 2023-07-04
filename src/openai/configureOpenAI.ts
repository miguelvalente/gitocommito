import { OpenAIApi, Configuration } from "openai";
import * as vscode from "vscode";

export function configureOpenAI(): OpenAIApi {
  const apiKey = vscode.workspace
    .getConfiguration()
    .get("GitoCommito.OpenAIApiKey") as string;

  if (!apiKey || apiKey.trim() === '') {
      const detailedMessage = 'OpenAI API key is missing. Set the key with `GitoCommito: Set OpenAI API Key` command.';
      vscode.window.showErrorMessage(
          'An error occurred.', 
          { 
              title: 'More Details', 
              run: () => vscode.window.showInformationMessage(detailedMessage)
          }
      );
  }

  const configuration = new Configuration({
    apiKey: apiKey,
  });

  return new OpenAIApi(configuration);
}
