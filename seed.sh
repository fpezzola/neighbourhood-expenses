#!/bin/bash

#Contract addresses variables
TOKEN_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
GOVERNANCE_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEIGHBORS_CONTRACT_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

#Seed neighbors
echo "Seed neighbors..."
npx hardhat seed-neighbors --address $NEIGHBORS_CONTRACT_ADDRESS

#Seed expenses (1eth)
echo "Seeding expenses..."
npx hardhat seed-expenses --address $NEIGHBORS_CONTRACT_ADDRESS --debt "1"

#Pay and delegate!
echo "Paying and delegate token voting power..."
npx hardhat pay-and-delegate-auto --neighbors $NEIGHBORS_CONTRACT_ADDRESS --token $TOKEN_CONTRACT_ADDRESS --amount 10


#Add targets
echo "Adding generic targets..."

##private-key c49ea32a1e026e36da42b025e9bf5fb5998ca00a1391837dc6ab14afd5bad3b7
npx hardhat add-target --address $GOVERNANCE_CONTRACT_ADDRESS --target 0x85845508baf92573b9e8df51c349212285ea8f61 --description "Soccer, Tennis, Basketball and Gym management."
#private-key b88728b60b164d4a2e6c415f4feafdcd4370e04b5582d04346c754018b3ec9d1
npx hardhat add-target --address $GOVERNANCE_CONTRACT_ADDRESS --target 0xe20462b9c149cd17f6eeca8bfa5c479ed236228d --description "Grill and pool area management."               
#private-key 0b280c282477ba9623027a3b225ef788ba628e78fcac781d7db97eff3c2ab866
npx hardhat add-target --address $GOVERNANCE_CONTRACT_ADDRESS --target 0x2406f569bf23c11dc2d1240820b01a369c914c2f --description "Basic facilities and security management."


#Finish
