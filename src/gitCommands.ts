import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { exec } from "child_process";
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { Configuration, OpenAIApi } from "openai";

export function runGitCommand(
  cmd: string[],
  directory: string
): Promise<string> {
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

export async function getFilteredStagedChanges(
  filterTypes: string = "ACDMRTUB"
) {
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
    const chatCompletion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-16k-0613",
      messages: [
        {
          role: "system",
          content: `You are a git user.  You have staged changes. You want to commit them.  You want to write a commit message.`,
        },
        { role: "user", content: allDifs },
      ],
      functions: [
        {
          name: "generate_commit",
          description: "Generate commit based on allDifs",
          parameters: {
            type: "object",
            properties: {
              change_type: {
                type: "string",
                enum: [
                  "docs",
                  "feat",
                  "fix",
                  "refactor",
                  "test",
                  "style",
                  "chore",
                  "ci",
                  "perf",
                  "build",
                  "revert",
                  "other",
                ],
              },
              emoji: {
                type: "string",
                enum: [
                  "🎨",
                  "⚡",
                  "🔥",
                  "🐛",
                  "✅",
                  "🔒",
                  "⬆️",
                  "⬇️",
                  "🗑️",
                  "🛂",
                  "🩹",
                  "🧐",
                  "⚰️",
                  "🧪",
                  "👔",
                  "🩺",
                  "🧱",
                  "👨‍💻",
                  "💸",
                  "🧵",
                  "🦺",
                ],
                description:
                  "The picked emoji should be picked acording to its Conventional Commit meaning",
              },
              subject: {
                type: "string",
                description:
                  "A short, imperative tense description of the change",
              },
              body: {
                type: "string",
                description: "A longer description of the change",
              },
            },
            required: ["change_type", "emoji", "subject"],
          },
        },
      ],
    });
    // const chatCompletion = await openai.createChatCompletion({
    //     model: "gpt-3.5-turbo-0613",
    //     messages: [
    //         {
    //             role: "user",
    //             content: "What is the weather like in Boston?"
    //         }
    //     ],
    //     functions: [
    //         {
    //           name: "get_current_weather",
    //           description: "Get the current weather in a given location",
    //           parameters: {
    //             type: "object",
    //             properties: {
    //               location: {
    //                 type: "string",
    //                 description: "The city and state, e.g. San Francisco, CA"
    //               },
    //               unit: {
    //                 type: "string",
    //                 enum: ["celsius", "fahrenheit"]
    //               }
    //             },
    //             required: ["location"]
    //           }
    //         }
    //       ]
    // });

    console.log(chatCompletion.data.choices[0].message.finish_reason);

    return chatCompletion.data.choices[0];
    // return commitMessage["text"];
  } catch (error) {
    console.error(`Error generating commit message: ${error}`);
    throw error;
  }
}

// description: {
//   "🎨": "Refactoring code to make it cleaner and more maintainable.",
//   "⚡": "Optimizing code to enhance its performance.",
//   "🔥": "Deleting code or files that are no longer needed.",
//   "🐛": "Fixing an error in the code.",
//   "✅": "Adding tests to ensure the code works as intended.",
//   "🔒": "Implementing or improving security measures.",
//   "⬆️": "Upgrading to a newer version of a dependency.",
//   "⬇️": "Downgrading to an older version of a dependency.",
//   "🗑️": "Marking code for future removal or replacement.",
//   "🛂": "Working on authentication, authorization, and user permissions.",
//   "🩹": "Making a minor fix that isn’t urgent.",
//   "🧐": "Examining data or inspecting code for analysis.",
//   "⚰️": "Removing code that is obsolete or redundant.",
//   "🧪": "Adding a test that is designed to fail, for testing purposes.",
//   "👔": "Adding or modifying code that deals with business processes.",
//   "🩺": "Adding or modifying health checks, usually for production monitoring.",
//   "🧱": "Making changes related to system infrastructure.",
//   "👨‍💻": "Enhancing the development environment or tools.",
//   "💸": "Adding or modifying code related to financial transactions or fundraising.",
//   "🧵": "Adding or modifying code for parallel processing.",
//   "🦺": "Adding or modifying validation checks.",
// },
