import * as vscode from "vscode";
import { exec } from "child_process";

// Utility Functions
function sanitizeMessage(message: string): string {
  return message.replace(/"/g, '\\"');
}

// Git-related Functions
function runGitCommand(cmd: string[], directory: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      cmd.join(" "),
      { cwd: directory },
      (error: any, stdout: string, stderr: string) => {
        if (error) {
          console.error(`Error executing command: ${stderr}`);
          reject(stderr);
        } else {
          resolve(stdout);
        }
      }
    );
  });
}

async function isGitRepo(directory: string): Promise<boolean> {
  try {
    await runGitCommand(["git", "status"], directory);
    return true;
  } catch (error) {
    throw new Error(
      "No staged changes were found. Please add your changes before annoying Gito."
    );
  }
}

async function getStagedChangesDiff(
  filterType: string,
  directory: string
): Promise<[string, string]> {
  await isGitRepo(directory);

  let cmd = ["git", "diff", "-U0", "--staged", "--diff-filter=" + filterType];
  let diffOutput = await runGitCommand(cmd, directory);
  return [filterType, diffOutput];
}

// Exported Functions
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
    await isGitRepo(directory);
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
