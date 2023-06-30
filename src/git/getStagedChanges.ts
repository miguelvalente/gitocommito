// getStagedChanges.ts
// getStagedChanges.ts
import { runGitCommand } from './runGitCommands';

async function isGitRepo(directory: string): Promise<boolean> {
  try {
    await runGitCommand(["git", "status"], directory);
    return true;
  } catch (error) {
    return false;
  }
}

async function getStagedChangesDiff(
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
  directory: string
): Promise<{ [key: string]: string }> {

  const filterTypes: string = "ACDMRTUB";

  let diffPromises = filterTypes
    .split("")
    .map((filterType) =>
      getStagedChangesDiff(filterType, directory)
    );

  let stagedChangesDiff: { [key: string]: string } = {};

  for (let diffPromise of diffPromises) {
    let [filterType, diffOutput] = await diffPromise;
    if (diffOutput) {
      stagedChangesDiff[filterType] = diffOutput;
    }
  }

  return stagedChangesDiff;
}
