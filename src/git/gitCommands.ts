// getStagedChanges.ts
// getStagedChanges.ts
import { runGitCommand } from "./runGitCommands";
import * as vscode from "vscode";

async function isGitRepo(directory: string): Promise<boolean> {
  try {
    await runGitCommand(["git", "status"], directory);
    return true;
  } catch (error) {
    return false;
  }
}

function sanitizeMessage(message: string): string {
  return message.replace(/"/g, '\\"');
}

async function getStagedChangesDiff(
  filterType: string,
  directory: string
): Promise<[string, string]> {
    await isGitRepo(directory);

    let cmd = ["git", "diff", "--cached", "--diff-filter=" + filterType];
    let diffOutput = await runGitCommand(cmd, directory);
    return [filterType, diffOutput];
}

export async function getFilteredStagedChanges(
  directory: string
): Promise<{ [key: string]: string }> {
  const filterTypes: string = "ACDMRTUB";

  let diffPromises = filterTypes
    .split("")
    .map((filterType) => getStagedChangesDiff(filterType, directory));

  let stagedChangesDiff: { [key: string]: string } = {};

  for (let diffPromise of diffPromises) {
    let [filterType, diffOutput] = await diffPromise;
    if (diffOutput) {
      stagedChangesDiff[filterType] = diffOutput;
    }
  }

  return stagedChangesDiff;
}

export async function gitCommit(
  directory: string,
  message: string
): Promise<void> {
  try {
    if (!(await isGitRepo(directory))) {

      const detailedMessage = "Not inside a Git repository";
      vscode.window.showErrorMessage(
          'An error occurred.', 
          { 
              title: 'More Details', 
              run: () => vscode.window.showInformationMessage(detailedMessage)
          }
      );
      return Promise.reject(detailedMessage);
    }

    // Sanitize the commit message
    const sanitizedMessage = sanitizeMessage(message);

    const commitCommand = ["git", "commit", "-m", `"${sanitizedMessage}"`];

    await runGitCommand(commitCommand, directory);
    vscode.window.showInformationMessage("Commit created successfully!");
  } catch (error) {
    console.error(`Error in gitCommit: ${error}`);
    vscode.window.showErrorMessage(`Error creating commit: ${error}`);
  }
}
