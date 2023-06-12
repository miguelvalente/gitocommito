import { exec } from 'child_process';
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import * as fs from 'fs';
import * as vscode from 'vscode';
import * as path from 'path';

const configPath = path.join(__dirname, '../config.json');
const configContent = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configContent);
const apiKey = config.openAIApiKey || '';

const model = new OpenAI({ openAIApiKey: apiKey, temperature: 0.9 });
const template = config.template || '';

const prompt = new PromptTemplate({
  template: template,
  inputVariables: ["staged_changes"],
});

const chain = new LLMChain({ llm: model, prompt: prompt });

// const apiKey = vscode.workspace.getConfiguration('GitoCommito').get<string>('OpenAIApiKey') || '';
// if (!apiKey) {
//     vscode.window.showInformationMessage('Please set the API key for My Extension.', 'Open Settings').then(selection => {
//         if (selection === 'Open Settings') {
//             vscode.commands.executeCommand('workbench.action.openSettings', '@ext:<your-extension-id>');
//         }
//     });
// }


export async function getUnstagedChangesDiff(filterType: string, directory: string): Promise<[string, string]> {
    let cmd = ['git', 'diff', '--diff-filter=' + filterType];
    let diffOutput = await runGitCommand(cmd, directory);

    if (filterType === 'U') {
        let cmdUntracked = ['git', 'ls-files', '--others', '--exclude-standard'];
        let untrackedFiles = (await runGitCommand(cmdUntracked, directory)).split('\n').filter(file => file.trim() !== ''); // filter out empty strings
        for (let file of untrackedFiles) {
            const fullPath = `${directory}/${file}`; // Provide the full path
            diffOutput += `\nUntracked file: ${file}\n`;
            try {
                diffOutput += fs.readFileSync(fullPath, 'utf8').split('\n').map(line => `+${line}`).join('\n');
            } catch (err) {
                console.error(`Error reading file ${fullPath}: ${err}`);
            }
        }
    }
    return [filterType, diffOutput];
}


export async function getFilteredUnstagedChanges(filterTypes: string = 'ACDMRTUB') {
    let diffPromises = filterTypes.split('').map(filterType => getUnstagedChangesDiff(filterType, '/home/mvalente/deving/gitocommito'));

    let unstagedChangesDiff: { [key: string]: string } = {};

    for (let diffPromise of diffPromises) {
        let [filterType, diffOutput] = await diffPromise;
        if (diffOutput) {
            unstagedChangesDiff[filterType] = diffOutput;
        }
    }
    return unstagedChangesDiff;
}

export function runGitCommand(cmd: string[], directory: string): Promise<string> {
    return new Promise((resolve, reject) => {
        // console.log(`Running command: ${cmd.join(' ')} in directory: ${directory}`);
        exec(
            cmd.join(' '),
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
        // Attempt to run a git status command; will fail if not in a git repo.
        await runGitCommand(['git', 'status'], directory);
        return true; // If it doesn't throw an error, it's a git repo.
    } catch (error) {
        return false; // If it throws an error, it's not a git repo.
    }
}


export async function getStagedChangesDiff(filterType: string, directory: string): Promise<[string, string]> {
    try {
        if (!await isGitRepo(directory)) {
            throw new Error('Not inside a Git repository');
        }
    
        let cmd = ['git', 'diff', '--cached', '--diff-filter=' + filterType];
        let diffOutput = await runGitCommand(cmd, directory);
        return [filterType, diffOutput];
    } catch (error) {
        console.error(`Error in getStagedChangesDiff: ${error}`);
        throw error;
    }
}

export async function getFilteredStagedChanges(filterTypes: string = 'ACDMRTUB') {
    let diffPromises = filterTypes.split('').map(filterType => getStagedChangesDiff(filterType, '/home/mvalente/deving/gitocommito'));

    let stagedChangesDiff: { [key: string]: string } = {};


    for (let diffPromise of diffPromises) {
        let [filterType, diffOutput] = await diffPromise;
        if (diffOutput) {
            stagedChangesDiff[filterType] = diffOutput;
        }
    }

    generateCommitMessageStaged(stagedChangesDiff);
    return stagedChangesDiff;
}


export async function generateCommitMessageStaged(stagedChanges: { [key: string]: string }): Promise<string> {
  try {
    const allDifs = Object.values(stagedChanges).join("-------\n")
    const commitMessage = await chain.call({ staged_changes: allDifs });
    console.log(allDifs)
    console.log("\n-----------\n")
    console.log(commitMessage["text"]);

    return commitMessage["text"];
  } catch (error) {
    console.error(`Error generating commit message: ${error}`);
    throw error;
  }
}
