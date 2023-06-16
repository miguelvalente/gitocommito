import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { exec } from "child_process";
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { Configuration, OpenAIApi } from "openai";

export function runGitCommand(cmd: string[], directory: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(cmd.join(" "), { cwd: directory }, (error: any, stdout: string, stderr: string) => {
            if (error) {
                console.error(`Error executing command: ${stderr}`);
                reject(stderr);
            } else {
                resolve(stdout);
            }
        });
    });
}

async function isGitRepo(directory: string): Promise<boolean> {
    try {
        await runGitCommand(["git", "status"], directory);
        return true;
    } catch (error) {
        return false;
    }
}

export async function getStagedChangesDiff(
    filterType: string,
    directory: string
): Promise<[string, string]> {
    try {
        if (!(await isGitRepo(directory))) {
            throw new Error("Not inside a Git repository");
        }

        let cmd = ["git", "diff", "--cached", "--diff-filter=" + filterType];
        let diffOutput = await runGitCommand(cmd, directory);
        return [filterType, diffOutput];
    } catch (error) {
        console.error(`Error in getStagedChangesDiff: ${error}`);
        throw error;
    }
}

export async function getFilteredStagedChanges(filterTypes: string = "ACDMRTUB") {
    let diffPromises = filterTypes
        .split("")
        .map((filterType) =>
            getStagedChangesDiff(filterType, "/home/mvalente/deving/gitocommito")
        );

    let stagedChangesDiff: { [key: string]: string } = {};

    for (let diffPromise of diffPromises) {
        let [filterType, diffOutput] = await diffPromise;
        if (diffOutput) {
            stagedChangesDiff[filterType] = diffOutput;
        }
    }

    const configPath = path.join(__dirname, "../config.json");
    const configContent = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(configContent);
    const apiKey = config.openAIApiKey || "";
    const model = new OpenAI({ openAIApiKey: apiKey, temperature: 0.9 });
    const template = config.template || "";
    const prompt = new PromptTemplate({
        template: template,
        inputVariables: ["staged_changes"],
    });
    const chain = new LLMChain({ llm: model, prompt: prompt });

    const configuration = new Configuration({
        apiKey: apiKey,
    });
    const openai = new OpenAIApi(configuration);

    generateCommitMessageStaged(stagedChangesDiff, chain, openai);
    return stagedChangesDiff;

}

export async function generateCommitMessageStaged(
    stagedChanges: { [key: string]: string },
    chain: any,
    openai: any
): Promise<string> {
    try {
        const allDifs = Object.values(stagedChanges).join("-------\n");
        const commitMessage = await chain.call({ staged_changes: allDifs });
        console.log(allDifs);
        console.log("\n-----------\n");
        console.log(commitMessage["text"]);

        const chatCompletion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are a git user.
                                                You have staged changes.
                                                You want to commit them.
                                                You want to write a commit message.`,
                },
            ],
        });

        return commitMessage["text"];
    } catch (error) {
        console.error(`Error generating commit message: ${error}`);
        throw error;
    }
}
