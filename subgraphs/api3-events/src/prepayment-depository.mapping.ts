import { Deposited as DepositedEvent } from "../types/PrepaymentDepository/PrepaymentDepository";
import { Deposit } from "../types/schema";

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
