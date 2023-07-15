import * as vscode from "vscode";
import { getFilteredStagedChanges, gitCommit } from "../git/gitCommands";
import { configureOpenAI } from "../openai/configureOpenAI";
import { insertCommitTextBox } from "../git/gitAPI";
import { startCommitGeneration } from "../openai/client";

export async function generateCommitMessage() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage("No workspace folder is open");
    return;
  }
  const openai = configureOpenAI();

  // Assuming you want to run the command on the first workspace folder
  const directory = workspaceFolders[0].uri.fsPath;

  // get staged changes
  // const stagedChanges = await getFilteredStagedChanges(directory);
  const stagedChanges = await getFilteredStagedChanges(directory);
  const allDifs = Object.values(stagedChanges).join("\n----\n");
  if (!allDifs || allDifs.length === 0) {
    throw new Error(
      "No staged changes were found. Please add your changes before annoying Gito."
    );
  }

  // Generate commit message
  const commitMessage = await startCommitGeneration(stagedChanges, openai);

  // Then place the commit message in the commit textbox
  await insertCommitTextBox(commitMessage);
}
