import * as vscode from 'vscode';
import * as VSCodeGit from '../vendors/git';
import * as path from 'path';

function getGitAPI(): VSCodeGit.API {
  const vscodeGit = vscode.extensions.getExtension('vscode.git');
  if (!vscodeGit?.exports.getAPI(1)) {
    vscode.window.showErrorMessage("vscode.git not found");
  }
  return vscodeGit!.exports.getAPI(1);
}

function hasChanges(repo: VSCodeGit.Repository) {
  return (
    repo.state.workingTreeChanges.length ||
    repo.state.mergeChanges.length ||
    repo.state.indexChanges.length
  );
}

async function getRepository({
  git,
  arg,
  workspaceFolders,
}: {
  git: VSCodeGit.API;
  arg?: vscode.Uri;
  workspaceFolders?: readonly vscode.WorkspaceFolder[];
}) {
  const _arg = arg?.fsPath;
  console.log("_arg: ", _arg);

  const repositories = git.repositories
    .map((repo) => repo.rootUri.fsPath)
    .join(', ');
    console.log("repositories: ", repositories);

  const _workspaceFolders = workspaceFolders
    ?.map((folder) => folder.uri.fsPath)
    .join(', ');
    console.log("workspaceFolders: ", workspaceFolders);

  if (_arg) {
    const repo = git.repositories.find(function (r) {
      return r.rootUri.fsPath === _arg;
    });
    if (repo) return repo;
    else {
        vscode.window.showErrorMessage("repo not found in path " + _arg);
    }
  }

  if (git.repositories.length === 0) {
    vscode.window.showErrorMessage("No git repositories found");
  }

  if (git.repositories.length === 1) return git.repositories[0];

  const items = git.repositories.map(function (repo, index) {
    const folder = workspaceFolders?.find(function (f) {
      return f.uri.fsPath === repo.rootUri.fsPath;
    });
    return {
      index,
      label: folder?.name || path.basename(repo.rootUri.fsPath),
      description:
        (repo.state.HEAD?.name || repo.state.HEAD?.commit?.slice(0, 8) || '') +
        (hasChanges(repo) ? '*' : ''),
    };
  });


  console.log("repositories: ", git.repositories);
  console.log("items: ", items);

  return git.repositories[0];
}


export async function insertCommitTextBox(commitMessage: string, repoUri?: VSCodeGit.Repository | vscode.Uri){
    const git = getGitAPI();

    let _repoUri = repoUri;
    if (!(repoUri instanceof vscode.Uri) && (repoUri !== undefined)) {
    _repoUri = repoUri.rootUri;
    }
    const repository = await getRepository({
        arg: (<vscode.Uri | undefined>_repoUri),
        git: git,
        workspaceFolders: vscode.workspace.workspaceFolders,
    });

    repository.inputBox.value = commitMessage

}