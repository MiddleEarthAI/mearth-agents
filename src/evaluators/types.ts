import { IAgentRuntime, Memory, State } from "@elizaos/core";

export type Handler = (
  runtime: IAgentRuntime,
  message: Memory,
  state: State,
  options?: Record<string, unknown>
) => Promise<any>;

export type Validator = (
  runtime: IAgentRuntime,
  message: Memory,
  state?: State
) => Promise<boolean>;

export interface ActionExample {
  user: string;
  content: {
    text: string;
    action?: string;
  };
}

export interface EvaluationExample {
  context: string;
  messages: Array<ActionExample>;
  outcome: string;
  explanation: string;
}

export interface Evaluator {
  name: string;
  description: string;
  similes: string[];
  alwaysRun?: boolean;
  examples: EvaluationExample[];
  handler: Handler;
  validate: Validator;
  priority?: number;
}
