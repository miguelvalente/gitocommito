import * as vscode from "vscode";
import { generateCommitMessage } from "./commands/generateCommitMessage";
import { setOpenAIKey } from "./commands/setOpenAIKey";

export function activate(context: vscode.ExtensionContext) {
  let commandGenerateCommit = vscode.commands.registerCommand(
    "extension.generateCommitMessage",
    generateCommitMessage
  );

  let commandSetOpenAIAPIKey = vscode.commands.registerCommand(
    "extension.setOpenAIKey",
    setOpenAIKey
  );

  context.subscriptions.push(commandGenerateCommit, commandSetOpenAIAPIKey);
}

export function deactivate() {}
