import * as vscode from 'vscode';
import { generateCommitMessage } from "./commands/generateCommitMessage";
import { getFilteredStagedChanges, gitCommit } from './git/gitCommands';
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
      console.log(directory);

      // get staged changes
      const stagedChanges = await getFilteredStagedChanges(directory);

      console.log(stagedChanges);
      
      // Generate commit message
      const commitMessage = await generateCommitMessage(stagedChanges, openai);
      console.log(commitMessage);
      // Then do something with commitMessage
      await gitCommit(directory, commitMessage);
    }
  );

  let set_openapi_key = vscode.commands.registerCommand(
      "extension.setOpenAIKey",
      setOpenAIKey
    );

    context.subscriptions.push(generate_commit, set_openapi_key);
}

export function deactivate() {}
