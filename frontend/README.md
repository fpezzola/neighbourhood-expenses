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

Read the [Project Overview](../docs/overview.md) for a detailed explanation of this project.

## Getting started

This is a Remix + ReactJS application started from the [EpicStack template](https://github.com/epicweb-dev/epic-stack).

### Install dependencies

Run the following command to install dependencies:

```sh
  npm install
```

### Environment

Create a `.env` file in the root of the project, you can use the `.env.default` as reference. The required ENV variables are:

- `LITEFS_DIR`: ...
- `SESSION_SECRET`: session secret for storing the theme.
- `COMMUNITY_TOKEN_CONTRACT_ADDRESS`: community token contract address.
- `GOVERNOR_CONTRACT_ADDRESS`: governor contract address.
- `NEIGHBORS_CONTRACT_ADDRESS`: neighbors contract address.
- `EXECUTOR_CONTRACT_ADDRESS`: executor contract address (commonly the same as the governor address)

### Run locally

To run this project locally, execute the following command:

```sh
  npm run dev
```
