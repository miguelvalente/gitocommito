import { mocked } from 'jest-mock';
import * as vscode from 'vscode';
import { getFilteredStagedChanges, gitCommit } from "../git/gitCommands";
import { Uri } from 'vscode';
import { configureOpenAI } from "../openai/configureOpenAI";
import { startCommitGeneration, startDetailedCommitGeneration } from '../openai/client';
import { insertCommitTextBox } from '../git/gitAPI';
import { generateCommitMessage } from '../commands/generateCommitMessage';

jest.mock('vscode');
jest.mock('../src/git/gitCommands');
jest.mock('../src/openai/configureOpenAI');
jest.mock('../src/openai/client');
jest.mock('../src/git/gitAPI');

describe('generateCommitMessage', () => {
  const mockVscode = mocked(vscode, { shallow: true });


  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TODO: Write unit tests


  // TODO: Write integration tests


});
