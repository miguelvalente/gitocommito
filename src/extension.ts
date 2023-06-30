import * as vscode from 'vscode';
import { generateCommitMessage } from "./commands/generateCommitMessage";
import { getFilteredStagedChanges } from './git/getStagedChanges';
import { configureOpenAI } from './openai/configureOpenAI'; 
import { setOpenAIKey } from "./commands/setOpenAIKey";

export function activate(context: vscode.ExtensionContext) {
  let generate_commit = vscode.commands.registerCommand(
    "extension.generateCommitMessage",
    async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("No workspace folder is open");
        return;
      }
      const openai = configureOpenAI();

      // Assuming you want to run the command on the first workspace folder
      const directory = workspaceFolders[0].uri.fsPath;

      // get staged changes
      const stagedChanges = await getFilteredStagedChanges(directory);
      
      // Generate commit message
      const commitMessage = await generateCommitMessage(stagedChanges, openai);
      // Then do something with commitMessage
    }
  );

  let set_openapi_key = vscode.commands.registerCommand(
      "extension.setOpenAIKey",
      setOpenAIKey
    );

    context.subscriptions.push(generate_commit, set_openapi_key);
}

export function deactivate() {}
