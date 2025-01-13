import { IAgentRuntime, Memory } from "@elizaos/core";

export type Handler = (
  runtime: IAgentRuntime,
  message: Memory
) => Promise<void>;
export type Validator = (runtime: IAgentRuntime) => Promise<boolean>;

export interface EvaluationExample {
  context: string;
  messages: Memory[];
  outcome: string;
  explanation: string;
}

export interface Evaluator {
  name: string;
  description: string;
  similes: string[];
  alwaysRun: boolean;
  priority: number;
  validate: Validator;
  handler: Handler;
  examples: EvaluationExample[];
}
