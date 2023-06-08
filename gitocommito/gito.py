import subprocess
import sys
import concurrent.futures


def run_git_command(cmd):
    result = subprocess.run(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True
    )
    return result.stdout


def get_unstaged_changes_diff(filter_type):
    cmd = ["git", "diff", "--diff-filter", filter_type]
    diff_output = run_git_command(cmd)

    if filter_type == "U":
        # For untracked files, using git ls-files with --others option
        cmd_untracked = ["git", "ls-files", "--others", "--exclude-standard"]
        untracked_files = run_git_command(cmd_untracked).splitlines()
        for file in untracked_files:
            diff_output += f"\nUntracked file: {file}\n"
            with open(file, "r") as f:
                for line in f.readlines():
                    diff_output += f"+{line}"
    return filter_type, diff_output


def get_filtered_unstaged_changes(filter_types="ACDMRTUB"):
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_diffs = {
            executor.submit(get_unstaged_changes_diff, filter_type): filter_type
            for filter_type in filter_types
        }

        unstaged_changes_diff = {}

        for future in concurrent.futures.as_completed(future_diffs):
            filter_type, diff_output = future.result()
            if diff_output:
                unstaged_changes_diff[filter_type] = diff_output

    return unstaged_changes_diff


def get_staged_changes_diff(filter_type):
    cmd = ["git", "diff", "--cached", "--diff-filter", filter_type]
    diff_output = run_git_command(cmd)
    return filter_type, diff_output


def get_filtered_staged_changes(filter_types="ACDMRTUB"):
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_diffs = {
            executor.submit(get_staged_changes_diff, filter_type): filter_type
            for filter_type in filter_types
        }

        staged_changes_diff = {}

        for future in concurrent.futures.as_completed(future_diffs):
            filter_type, diff_output = future.result()
            if diff_output:
                staged_changes_diff[filter_type] = diff_output

    return staged_changes_diff


def main():
    filter_types = "ACDMRTUB"

    if len(sys.argv) > 1:
        filter_types = sys.argv[1]

    staged_changes_diff = get_filtered_staged_changes(filter_types)

    if staged_changes_diff:
        print("Staged changes (filtered):")
        for filter_type, diff_output in staged_changes_diff.items():
            print(f"\nFilter Type: {filter_type}\n")
            print(diff_output)
    else:
        print("No changes matching the filter are staged.")

    # unstaged_changes_diff = get_filtered_unstaged_changes(filter_types)

    # if unstaged_changes_diff:
    #     print("Unstaged changes (filtered):")
    #     for filter_type, diff_output in unstaged_changes_diff.items():
    #         print(f"\nFilter Type: {filter_type}\n")
    #         print(diff_output)
    # else:
    #     print("No changes matching the filter are unstaged.")


if __name__ == "__main__":
    main()
