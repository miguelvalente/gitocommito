import { OpenAIApi, Configuration } from 'openai';
import * as vscode from 'vscode';

export function configureOpenAI(): OpenAIApi {
  const apiKey = vscode.workspace.getConfiguration('GitoCommito').get('OpenAIKey') as string;
  
  const configuration = new Configuration({
    apiKey: apiKey,
  });

  return new OpenAIApi(configuration);
}
