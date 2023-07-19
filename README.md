<div align="center">
  <h1 align="center">Gated community</h1>
  <strong align="center">
    Expenses, budget and neighbourhood management
  </strong>
  <p>
    This is a Web3 project that supports gated community management.
  </p>
</div>

## Introduction

Commonly, gated communities collect money through the expenses that are paid by the residents of the neighborhood. With the surplus money, infrastructure works and/or improvements in common spaces are carried out for the greater comfort of the residents.

Neighbors will be in charge of creating and voting on proposals for the use of surplus money. This power and the weight of his vote, will be gained with the regular payment of the expenses of the neighborhood.

Read the [Project Overview](/docs/overview.md) for a detailed explanation of this project.

## Project structure

This is a hardhat based project for the smart contract creation and deployment. The frontend is a Remix project created from the [The Epic Stack template](https://www.epicweb.dev/epic-stack).

### Smart Contracts

In the `/contracts` folder there are 3 contracts:

- `Nieghbors.sol`: Nieghbors and expenses storage/payment.
- `CommunityToken.sol`: Voting and proposal creation token.
- `CommunityGovernance.sol`: Governance contract for proposal management and execution.

### Frontend

In the `/frontend` folder follow the `README.md` to setup and run the application.

## Getting started

### Requirements

- NodeJS v18.13.0 or above.
- Npm `v9.6.6` or above.

### Install dependencies

- Run `npm install` to install the hardhat project dependencies.
- Run `cd frontend && npm install` to install the dApp dependencies.

### Local blockchain

In order to run this project locally, you need to have a local hardhat node up and running in your machine.

```bash
npx hardhat node
```

### Contracts deployment

For an easy setup, there is an script that deploys the hardhat contracts and seeds the contracts with the `ethers` signers:

- `Signer0`: Administrator
- `Signer1...Signer10`: Nieghbors

First of all, deploy the contract using the hardhat command:

```bash
npx hardhat run scripts/deploy.ts
```

You will see the addresses in the console.

Once you have the contract addreses, go to the `./seed.sh` script and replace the variables `TOKEN_CONTRACT_ADDRESS`, `GOVERNANCE_CONTRACT_ADDRESS` and `NEIGHBORS_CONTRACT_ADDRESS` variables with their corresponding values.

Execute the `seed.sh` script to fulfill the contracts with data:

```bash
./seed.sh
```

This script basically:

- Creates the neighbors
- Adds expenses to these neighbors
- Pays the expenses and delegates the CTK to vote to the 10 neighbors created in the previous step.
