import * as vscode from 'vscode';
import * as gitCommands from './gitCommands';
import * as VSCodeGit from '../vendors/git';
import * as output from './output';
import { getSourcesLocalize } from './localize';

function getGitAPI(): VSCodeGit.API {
  const vscodeGit = vscode.extensions.getExtension('vscode.git');
  if (!vscodeGit?.exports.getAPI(1)) {
    output.error('getGitAPI', getSourcesLocalize('vscodeGitNotFound'), true);
  }
  return vscodeGit!.exports.getAPI(1);
}

export function activate(context: vscode.ExtensionContext) {

    let disposable = vscode.commands.registerCommand('extension.generateCommitMessage', async () => {
        // The code you place here will be executed every time your command is executed

        // You can access the Git repository path through vscode.workspace.rootPath.
        // Please note that this API is deprecated, and if your extension is multi-root aware
        // (which means it supports multiple folders opened in VS Code at the same time),
        // you should use vscode.workspace.workspaceFolders instead.
        const rootPath = vscode.workspace.rootPath;

        if (!rootPath) {
            vscode.window.showWarningMessage('No workspace directory open. Please open a workspace and try again.');
            return;
        }

        // Get the filtered staged changes
        const stagedChanges = await gitCommands.getFilteredStagedChanges("ACDMRTUB");

        // The commit message is already generated in getFilteredStagedChanges, so you don't need to do anything else here.
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
