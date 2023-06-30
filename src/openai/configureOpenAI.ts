// configureOpenAI.ts
import * as fs from "fs";
import * as path from "path";
import { OpenAIApi, Configuration } from 'openai'; // Adjust according to your OpenAI SDK import

export function configureOpenAI(): OpenAIApi {
  const configPath = path.join(__dirname, "../../config.json"); // adjust the path according to your project structure
  const configContent = fs.readFileSync(configPath, "utf8");
  const config = JSON.parse(configContent);

  const apiKey = config.openAIApiKey || "";
  
  const configuration = new Configuration({
    apiKey: apiKey,
  });

  return new OpenAIApi(configuration);
}
