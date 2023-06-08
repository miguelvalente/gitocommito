import { exec } from 'child_process';
import * as fs from 'fs';

export function runGitCommand(cmd: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(cmd.join(' '),
            (error: any, stdout: string, stderr: string) => {
                if (error) {
                    reject(stderr);
                } else {
                    resolve(stdout);
                }
            }
        );
    });
}

export async function getUnstagedChangesDiff(filterType: string): Promise<[string, string]> {
    let cmd = ['git', 'diff', '--diff-filter', filterType];
    let diffOutput = await runGitCommand(cmd);

    if (filterType === 'U') {
        let cmdUntracked = ['git', 'ls-files', '--others', '--exclude-standard'];
        let untrackedFiles = (await runGitCommand(cmdUntracked)).split('\n');
        for (let file of untrackedFiles) {
            diffOutput += `\nUntracked file: ${file}\n`;
            diffOutput += fs.readFileSync(file, 'utf8').split('\n').map(line => `+${line}`).join('\n');
        }
    }
    return [filterType, diffOutput];
}

export async function getFilteredUnstagedChanges(filterTypes: string = 'ACDMRTUB') {
    let diffPromises = filterTypes.split('').map(filterType => getUnstagedChangesDiff(filterType));

    let unstagedChangesDiff: { [key: string]: string } = {};

    for (let diffPromise of diffPromises) {
        let [filterType, diffOutput] = await diffPromise;
        if (diffOutput) {
            unstagedChangesDiff[filterType] = diffOutput;
        }
    }
    return unstagedChangesDiff;
}

export async function getStagedChangesDiff(filterType: string): Promise<[string, string]> {
    let cmd = ['git', 'diff', '--cached', '--diff-filter', filterType];
    let diffOutput = await runGitCommand(cmd);
    return [filterType, diffOutput];
}

export async function getFilteredStagedChanges(filterTypes: string = 'ACDMRTUB') {
    let diffPromises = filterTypes.split('').map(filterType => getStagedChangesDiff(filterType));

    let stagedChangesDiff: { [key: string]: string } = {};

    for (let diffPromise of diffPromises) {
        let [filterType, diffOutput] = await diffPromise;
        if (diffOutput) {
            stagedChangesDiff[filterType] = diffOutput;
        }
    }
    return stagedChangesDiff;
}
