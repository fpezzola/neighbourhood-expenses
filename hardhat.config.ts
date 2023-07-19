import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import seedNeighbors from "./scripts/seed";
import propose from "./scripts/propose";
import { ethers } from "ethers";
import addTarget from "./scripts/add-target";
import seedExpenses from "./scripts/seed-expenses";
import delegate from "./scripts/delegate";
import queryQuorum from "./scripts/quorumQuery";
import payExpensesAndDelegate, {
  payExpensesAndDelegateLocal,
} from "./scripts/pay-expenses";

task("pay-and-delegate-auto", "Pay expenses and delegate voting")
  .addParam("neighbors", "Neighbors contract address")
  .addParam("token", "Token contract address")
  .addParam("amount", "Amount of ethers signers to pay. Starting at index 1.")
  .setAction(
    async ({
      neighbors,
      token,
      amount,
    }: {
      neighbors: string;
      token: string;
      amount: number;
    }) => {
      await payExpensesAndDelegateLocal(neighbors, token, Number(amount));
    }
  );

task("pay-and-delegate", "Pay expenses and delegate voting")
  .addParam("neighbors", "Neighbors contract address")
  .addParam("token", "Token contract address")
  .addParam("account", "Account address")
  .setAction(
    async ({
      neighbors,
      token,
      account,
    }: {
      neighbors: string;
      token: string;
      account: string;
    }) => {
      await payExpensesAndDelegate(neighbors, token, account);
    }
  );

task("delegate", "Delegation of voting power")
  .addParam("address", "Token contract address")
  .addParam("delegator", "The delegator")
  .addOptionalParam("delegatee", "The delegatee. Defaults to self-delegation")
  .setAction(
    async ({
      address,
      delegator,
      delegatee,
    }: {
      address: string;
      delegator: string;
      delegatee?: string;
    }) => {
      await delegate(address, delegator, delegatee ?? delegator);
    }
  );
//
task("query-quorum", "Query the quorum at timepoint")
  .addParam("address", "Governance contract address")
  .addParam("timepoint", "Block number")
  .setAction(
    async ({ address, timepoint }: { address: string; timepoint: string }) => {
      await queryQuorum(address, timepoint);
    }
  );
//
task("seed-neighbors", "Seeds the neighbors contract")
  .addParam("address", "Neighbors contract address")
  .setAction(async ({ address }: { address: string }) => {
    await seedNeighbors(address);
  });
//
task(
  "seed-expenses",
  "Seeds the neighbors expenses using all the neighbors in the contract"
)
  .addParam("address", "Neighbors contract address")
  .addOptionalParam("debt", "Expenses debt", "1")
  .setAction(async ({ address, debt }: { address: string; debt: string }) => {
    await seedExpenses(address, debt);
  });
//
task("propose", "Creates a proposal")
  .addParam("address", "Governor contract address")
  .addParam("target", "Proposal target contract")
  .addOptionalParam("value", "Proposal target value")
  .addOptionalParam("description", "Proposal description.")
  .setAction(
    async ({
      address,
      target,
      value,
      description,
    }: {
      address: string;
      target: string;
      value?: string;
      description?: string;
    }) => {
      await propose(
        address,
        target,
        value ?? ethers.parseEther("1").toString(),
        description ?? "Soccer field improvements."
      );
    }
  );
//
task("add-target", "Adds a new target")
  .addParam("address", "Governor contract address")
  .addParam("target", "Target address to ad")
  .addParam("description", "Target's description")
  .setAction(
    async ({
      address,
      target,
      description,
    }: {
      address: string;
      target: string;
      description: string;
    }) => {
      await addTarget(address, target, description ?? "");
    }
  );
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "localhost",
};

export default config;
