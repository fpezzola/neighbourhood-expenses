# Gated community - Use cases

### Neighbors registration

The owner of the `Nieghbors.sol` contract (`signer0` for local deployment) is in charge of creating neighbors by invoking `registerNeighbor` function and load lot expenses by the `loadDebt` function . The neighbor attributes are:

- `Owner`: address owner of the lot. The admin cannot be a lot owner nor a single address cannot owe multiple lots.
- `LotNumber`: lot identification.
- `LotArea`: lot area. The bigger is the area (m2), more CTK are mint every time the neighbor pay the expenses.

### Load expenses

The admin (`signer0` for local deployment) is in charge of creating debts for lot owners. To do so, admins invokes the `loadDebt` function of the `Neighbors.sol` contract and specifies the amount and the lot number.

### Expenses payment

The owner of the lot should send a transaction to the `Neighbor.sol` contract in order to pay the expenses. Take into account, that the neighbor cannot have positive balance, meaning that it can only pay an amount that is lower or equal that it's current debt.
Once the payment is accredited, the CTK minting proccess is executed with the following rules:

1. Depending on the lot area, the amount of CTK changes:
   - `area < 500 m2 => 1 CTK`
   - `500 > area < 1000 m2 => 2 CTK`
   - `area > 1000 m2 => 3 CTK`
2. To prevent CTK exploitation, there is a variable called `timeWithinTransfers` (28 days by default) that prevents users to micro-pay the expenses and get CTK every time they pay. The payment process checks when was the last time CTK were mint to the account and in case it was before the `timeWithinTransfers` configruation, the user don't get the CTK.
3. The `10%` of the payment is tranferred to the Proposal executor, in this case the `CommunityGovernance.sol` contract so that it has balance to execute the proposals created by the neighbors.

### Lot ownership transfer

In any time, the neighbors can transfer the ownership of the lot to any account that doesn't own a lot yet. Lots can only be transferred if and only if the owner cancels the debts of the lot. Therefore, the `transferLotOwnership` function accepts ether in case the accounts needs to send money. The `CTK` already mint are `burned` and the new onwer does not have CTK until it pays the first expenses.

Read the [Expenses payment section](#expenses-payment) to know hoy to get CTK.

### Voting power delegation

As said before, accounts get CTKs token by paying their expenses and therefore voting power in the neighbourhood proposals. However, this is not entirely true. Once the account get the CTK, they must delegate the voting power to either `themselves` or someone else (another account). Meaning that having CTK balance is a way (but not the only one) to get voting power.

In summary, after paying the expenses, accounts must delegate their granted CTK to convert the given CTK into voting power.

### Proposals creation and voting

To create a proposal a user should come up with:

- `Description`: Why and what you need by creating this proposal
- `Value`: Amount of ETH needed.
- `Target`: Where to transfer the proposal amount.

Targets are limited to a set defined by the system administrator and stored in the `CommunityGovernance.sol` contract. Meaning that the accounts cannot create proposal that target whatever they want, in fact it should have been whitelisted by the admin.

In order to create a proposal, accounts must have at least 1 CTK of voting power in their balance. Also, in order to vote a proposal, acounts should have at least some CTK of voting-power.

Read about [voting-power delegation](#voting-power-delegation) if you don't know what it means.

By default, proposals have:

- `2 block of votingDelay`: Number of blocks between the creation of the proposal and the start of voting.
- `5 blocks of votingPeriod`: Number of blocks where accounts can vote.

### Executing/Canceling a proposal

Proposal can be canceled only by the proposer and before its start. Meaning that once the account creates the proposal, it has 2 blocks to cancel it.

In case the proposal succeeded, the quorum was reached and the amount of `For` votes is greater than the `Against` votes any account can execute the proposal as long as the executor (`CommunityGovernance.sol`) has enough balance to cover the proposal value. If not, the transaction will be reverted and the account cannot execute the proposal until the executor gets more ETH.

To know how to get more ETH in the executor, read the [expenses payment section](#expenses-payment).
