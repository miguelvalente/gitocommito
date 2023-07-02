// runGitCommand.ts
import { exec } from "child_process"; // you need to import exec from the correct package

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
