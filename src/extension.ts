import * as vscode from "vscode";
import { generateCommitMessage } from "./commands/generateCommitMessage";
import { getFilteredStagedChanges, gitCommit } from "./git/gitCommands";
import { configureOpenAI } from "./openai/configureOpenAI";
import { setOpenAIKey } from "./commands/setOpenAIKey";
import { insertCommitTextBox } from "./git/gitAPI";

export function activate(context: vscode.ExtensionContext) {
  let commandGenerateCommit = vscode.commands.registerCommand(
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
      const allDifs = Object.values(stagedChanges).join("-------\n");
      if (!allDifs || allDifs.length === 0) {
      throw new Error('No staged changes were found. Please add your changes before annoying Gito.');
      }


      console.log(stagedChanges);

      // Generate commit message
      const commitMessage = await generateCommitMessage(stagedChanges, openai);
      console.log(commitMessage);

      // Then place the commit message in the commit textbox
      await insertCommitTextBox(commitMessage);
    }
  );

  let commandSetOpenAIAPIKey = vscode.commands.registerCommand(
    "extension.setOpenAIKey",
    setOpenAIKey
  );

  context.subscriptions.push(commandGenerateCommit, commandSetOpenAIAPIKey);
}

export function deactivate() {}
