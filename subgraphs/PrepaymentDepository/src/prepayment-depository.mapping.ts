import {
  Deposited as DepositedEvent,
  Withdrew as WithdrewEvent,
} from "../types/PrepaymentDepository/PrepaymentDepository";
import {
  Deposit,
  Log,
  Transaction,
  TransactionReceipt,
  Withdraw,
} from "../types/schema";
import {
  ethereum,
  Bytes,
  Wrapped,
  ByteArray,
  BigInt,
  crypto,
} from "@graphprotocol/graph-ts";

// utils

export function generateLogId(
  transactionHash: Bytes,
  logIndex: BigInt
): string {
  var id = transactionHash.toHex() + Bytes.fromBigInt(logIndex).toHex();
  return crypto.keccak256(ByteArray.fromHexString(id)).toHex();
}

export function createTransactionEntity(
  transaction: ethereum.Transaction
): Transaction {
  let entity = Transaction.load(transaction.hash);
  if (!entity) {
    entity = new Transaction(transaction.hash);
    entity.hash = transaction.hash;
    entity.index = transaction.index;
    entity.from = transaction.from;
    entity.to = transaction.to;
    entity.value = transaction.value;
    entity.gasLimit = transaction.gasLimit;
    entity.gasPrice = transaction.gasPrice;
    entity.input = transaction.input;
    entity.nonce = transaction.nonce;
    entity.save();
  }

  return entity;
}

export function createTransactionReceiptEntity(
  transactionHash: Bytes,
  receipt: ethereum.TransactionReceipt
): TransactionReceipt {
  let entity = TransactionReceipt.load(transactionHash);
  if (!entity) {
    entity = new TransactionReceipt(transactionHash);
    entity.blockHash = receipt.blockHash;
    entity.blockNumber = receipt.blockNumber;
    entity.cumulativeGasUsed = receipt.cumulativeGasUsed;
    entity.gasUsed = receipt.gasUsed;
    entity.contractAddress = receipt.contractAddress;
    entity.status = receipt.status;
    entity.root = receipt.root;
    entity.logsBloom = receipt.logsBloom;
    for (let index = 0; index < receipt.logs.length; index++) {
      createLogEntity(transactionHash, receipt.logs[index]);
    }
    entity.save();
  }

  return entity;
}

export function createLogEntity(
  transactionHash: Bytes,
  log: ethereum.Log
): void {
  const entity = new Log(generateLogId(transactionHash, log.logIndex));
  entity.logIndex = log.logIndex;
  entity.data = log.data;
  entity.topics = log.topics;
  const removed =
    log.removed != null ? (log.removed as Wrapped<bool>).inner : false;
  if (typeof removed === "number") {
    entity.removed = (removed as number) === 1;
  }
  if (typeof removed === "boolean") {
    entity.removed = (removed as boolean) === true;
  }

  entity.transactionReceipt = transactionHash;
  entity.save();
}

// handlers

export function handleDeposited(event: DepositedEvent): void {
  const entity = new Deposit(
    event.transaction.hash.toHexString() + event.logIndex.toString()
  );
  createTransactionEntity(event.transaction);
  entity.transaction = event.transaction.hash;
  if (event.receipt) {
    createTransactionReceiptEntity(event.transaction.hash, event.receipt!);
    entity.transactionReceipt = event.transaction.hash;
  }
  entity.logIndex = event.logIndex;
  entity.logType = event.logType;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;

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
  createTransactionEntity(event.transaction);
  entity.transaction = event.transaction.hash;
  if (event.receipt) {
    createTransactionReceiptEntity(event.transaction.hash, event.receipt!);
    entity.transactionReceipt = event.transaction.hash;
  }
  entity.logIndex = event.logIndex;
  entity.logType = event.logType;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;

  entity.user = event.params.user;
  entity.amount = event.params.amount;
  entity.expirationTimestamp = event.params.expirationTimestamp;
  entity.withdrawalHash = event.params.withdrawalHash;
  entity.withdrawalSigner = event.params.withdrawalSigner;
  entity.withdrawalDestination = event.params.withdrawalDestination;
  entity.withdrawalLimit = event.params.withdrawalLimit;

  entity.save();
}
