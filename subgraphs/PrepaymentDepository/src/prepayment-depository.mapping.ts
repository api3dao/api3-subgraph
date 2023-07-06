import {
  Deposited as DepositedEvent,
  Withdrew as WithdrewEvent,
} from "../types/PrepaymentDepository/PrepaymentDepository";
import { Deposit, Withdraw } from "../types/schema";

export function handleDeposited(event: DepositedEvent): void {
  const entity = new Deposit(
    event.transaction.hash.toHexString() + event.logIndex.toString()
  );
  entity.transactionHash = event.transaction.hash;
  entity.logIndex = event.logIndex;
  entity.blockNumber = event.block.number;
  entity.user = event.params.user;
  entity.amount = event.params.amount;
  entity.withdrawalLimit = event.params.withdrawalLimit;
  entity.sender = event.params.sender;

  entity.save();
}

export function handleWithdrew(event: WithdrewEvent): void {
  const entity = new Withdraw(
    event.transaction.hash.toHexString() + event.logIndex.toString()
  );
  entity.transactionHash = event.transaction.hash;
  entity.logIndex = event.logIndex;
  entity.blockNumber = event.block.number;
  entity.user = event.params.user;
  entity.amount = event.params.amount;
  entity.expirationTimestamp = event.params.expirationTimestamp;
  entity.withdrawalHash = event.params.withdrawalHash;
  entity.withdrawalSigner = event.params.withdrawalSigner;
  entity.withdrawalDestination = event.params.withdrawalDestination;
  entity.withdrawalLimit = event.params.withdrawalLimit;

  entity.save();
}
