import { Provider, TokenState, Transaction } from "./types";

export class TokenStateProvider implements Provider {
  name = "token_state_provider";
  description = "Provides token balance and transaction history";
  private state: TokenState = {
    balance: 0,
    recentTransactions: [],
    lastUpdate: 0,
  };

  async initialize(): Promise<void> {
    // Initialize token state
    // TODO: Load initial balance and transaction history
  }

  async update(): Promise<void> {
    // Update token state
    // TODO: Fetch latest balance and transactions
  }

  getState(): Promise<TokenState> {
    return Promise.resolve(this.state);
  }

  addTransaction(transaction: Transaction): void {
    this.state.recentTransactions.push(transaction);
    this.state.balance += transaction.amount;

    // Keep only last 24 hours of transactions
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.state.recentTransactions = this.state.recentTransactions.filter(
      (tx) => tx.timestamp > oneDayAgo
    );
  }

  updateBalance(newBalance: number): void {
    this.state.balance = newBalance;
  }

  getTransactionHistory(hours: number = 24): Transaction[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.state.recentTransactions.filter((tx) => tx.timestamp > cutoff);
  }
}
