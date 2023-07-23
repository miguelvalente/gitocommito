export const FIRST_STAGE =
  "You are a world class Software Developer. " +
  "You are going to look at a git diff output and summarize the changes. " +
  "The summary should not include the code. " +
  "You carefully explain code with great detail and accuracy. " +
  "You look for `diff --git` as a sign of the type of change and file. " +
  "You organize your explanations in markdown-formatted, bulleted lists.";


// eslint-disable-next-line @typescript-eslint/naming-convention
export function FIRST_STAGE_USER_GOTAGOFAST(diff: string) {
  return (
    "Use the following diff output to write a single commit message that encapsulates the changes. " +
    "The commit message should be in the conventional commit format. " +
    "Organize your explanation as a markdown-formatted, bulleted list." +
    "\ngit diff --staged" +
    `${diff}`
  );
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function FIRST_STAGE_USER_GOTAGOBEST(diff: string) {
  return (
    "Please explain the following diff output. " +
    "Organize your explanation as a markdown-formatted, bulleted list." +
    "\ngit diff --staged" +
    `${diff}`
  );
}

export const SECOND_STAGE =
  "Pick out the most important changes. " +
  "Provide a Reason about the functionality of the new changes. " +
  "You organize your explanations in markdown-formatted, bulleted lists.";

export const THIRD_STAGE =
  "Use everything until now to write a single commit message that encapsulates the changes. " +
  "The commit message should be in the conventional commit format. " +
  "Use bullet points to organize your commit message. ";

export const GIT_CHANGE_TYPE_ENUM = [
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
];

export const GIT_EMOJI_DESCRIPTION_ENUM = [
  "Use this emoji if changes are just visual AKA no code logic was changed. E.g:formating",
  "Refactor code",
  "Optimizing code to enhance its performance",
  "Deleting code or files that are no longer needed",
  "Fixing an error in the code",
  "Select if change is related to tests",
  // "Implementing or improving security measures",
  "Use if involves upgrading packages or libraries to a newer version of a dependency. E.g: npm update or pip update",
  "Use if involves DOWNGRADING packages or libraries to a newer version of a dependency E.g: npm update or pip update",
  "Use if ADDING a new package or library",
  "Use if REMOVING a package or library",
  "Marking code for future removal or replacement",
  "Select this if changes are based on authentication, authorization, and user permissions",
  "Making a minor fix that isn’t urgent",
  "Select if changes involve tools to examine data or inspect code for analysis",
  "Removing code that is obsolete or redundant",
  "Adding a test that is designed to fail, for testing purposes",
  // "Adding or modifying code that deals with business processes",
  // "Adding or modifying health checks, usually for production monitoring",
  "Select if changes related to system infrastructure",
  "Enhancing the development environment or tools",
  "Code related to financial transactions or fundraising",
  "Code for parallel processing",
  "Use if changes are related to releasing/updating a new version of the repository"
  // "modifying validation checks",
];

const EMOJI_MAP = [
  ":art:",
  ":recycle:",
  ":zap:",
  ":fire:",
  ":bug:",
  ":white_check_mark:",
  // ":lock:",
  ":arrow_up:",
  ":arrow_down:",
  ":heavy_plus_sign:",
  ":heavy_minus_sign:",
  ":wastebasket:",
  ":passport_control:",
  ":adhesive_bandage:",
  ":monocle_face:",
  ":coffin:",
  ":test_tube:",
  // ":necktie:",
  // ":stethoscope:",
  ":bricks:",
  ":technologist:",
  ":money_with_wings:",
  ":thread:",
  ":bookmark:"
  // ":safety_vest:",
];

export const COST_EMOJI_DESCRIPTION_TO_GIT_EMOJI_MAP: {
  [key: string]: string;
} = GIT_EMOJI_DESCRIPTION_ENUM.reduce<{ [key: string]: string }>(
  (map, description, index) => {
    map[description] = EMOJI_MAP[index];
    return map;
  },
  {}
);
