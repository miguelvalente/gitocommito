import * as vscode from 'vscode';
import { getFilteredStagedChanges, getFilteredUnstagedChanges } from './gitCommands';

export function activate(context: vscode.ExtensionContext) {
    let generateCommitMessageStaged = vscode.commands.registerCommand('extension.generateCommitMessageStaged', async () => {
        // Here you can use the functions from gitCommands.ts, e.g.
        const stagedChanges = await getFilteredStagedChanges("ACDMRTUB");
    });

    let generateCommitMessageUnstaged = vscode.commands.registerCommand('extension.generateCommitMessageUnstaged', async () => {
        // Here you can use the functions from gitCommands.ts, e.g.
        const unstagedChanges = await getFilteredUnstagedChanges("ACDMRTUB");
    });


    context.subscriptions.push(generateCommitMessageStaged, generateCommitMessageUnstaged);
}

export function deactivate() {}
