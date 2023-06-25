import * as vscode from "vscode";
import { getFilteredStagedChanges } from "./lib/gitCommands";

export function activate(context: vscode.ExtensionContext) {
  let generateCommitMessageStaged = vscode.commands.registerCommand(
    "extension.generateCommitMessage",
    async () => {
      // Here you can use the functions from gitCommands.ts, e.g.
      const stagedChanges = await getFilteredStagedChanges("ACDMRTUB");
    }
  );

  context.subscriptions.push(generateCommitMessageStaged);
}

export function deactivate() {}
