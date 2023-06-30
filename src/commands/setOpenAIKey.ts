// src/commands/setOpenAIKey.ts
import * as vscode from "vscode";

export async function setOpenAIKey() {
  const apiKey = await vscode.window.showInputBox({
    prompt: "Enter your OpenAI API Key",
  });
  if (apiKey) {
    vscode.workspace.getConfiguration().update('GitoCommito.OpenAIApiKey', apiKey, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage("OpenAI Key updated successfully!");
  } 
 else {
    vscode.window.showErrorMessage("You did not enter a key.");
  }
}
