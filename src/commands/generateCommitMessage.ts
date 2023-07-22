import * as vscode from "vscode";
import { getFilteredStagedChanges, gitCommit } from "../git/gitCommands";
import { configureOpenAI } from "../openai/configureOpenAI";
import { insertCommitTextBox } from "../git/gitAPI";
import {
  startCommitGeneration,
  startDetailedCommitGeneration,
} from "../openai/client";

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
  const stagedChanges = await getFilteredStagedChanges(directory);
  const allDifs = Object.values(stagedChanges).join("\n----\n");

  if (!allDifs || allDifs.length === 0) {
      vscode.window.showErrorMessage("No staged changes were found. Please add your changes before annoying Gito.");
      throw new Error("No staged changes were found. Please add your changes before annoying Gito.");
  }


  // Ask user to select an option
  const options = [
    "⚡ GotaGoFast: The fastest but not the bestest. \nIn case of simple changes.",
    "🐢 GotaGoBest: The bestest but not the fastest. \nIn case of complex changes.",
  ];
  const action = await vscode.window.showQuickPick(options, {
    placeHolder: "Select an action",
  });

  if (!action) {
    vscode.window.showInformationMessage("No action selected");
    return;
  }

  let commitMessage;
  // Generate commit message based on user's selection
  switch (action) {
    case "⚡ GotaGoFast: The fastest but not the bestest. \nIn case of simple changes.":
      commitMessage = await startCommitGeneration(stagedChanges, openai);
      break;
    case "🐢 GotaGoBest: The bestest but not the fastest. \nIn case of complex changes.":
      // Assuming startDetailedCommitGeneration exists and it generates a more comprehensive commit message
      commitMessage = await startDetailedCommitGeneration(
        stagedChanges,
        openai
      );
      break;
  }

  // Then place the commit message in the commit textbox
  if (commitMessage) {
    await insertCommitTextBox(commitMessage);
  } else {
    vscode.window.showErrorMessage(
      "No commit message was generated. Please try again."
    );
  }
}
