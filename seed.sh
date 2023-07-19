#!/bin/bash

TOKEN_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
GOVERNANCE_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEIGHBORS_CONTRACT_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

echo "Seed neighbors..."

npx hardhat seed-neighbors --address $NEIGHBORS_CONTRACT_ADDRESS

echo "Adding targets..."

npx hardhat add-target --address $GOVERNANCE_CONTRACT_ADDRESS --target 0x413f3536eab14074e6b2a7813b22745E41368875 --description "Soccer, Tennis, Basketball and Gym management."
npx hardhat add-target --address $GOVERNANCE_CONTRACT_ADDRESS --target 0x4Aa942D09A237f3Daf625cac547b91b3a84b9D41 --description "Grill and pool area management."               
npx hardhat add-target --address $GOVERNANCE_CONTRACT_ADDRESS --target 0x4A3CD1E36091a66cf6dea0A77dAd564fFC8547a1 --description "Basic facilities and security management."

echo "Governance targets added"

#Seed expenses

echo "Seed expenses..."

npx hardhat seed-expenses --address $NEIGHBORS_CONTRACT_ADDRESS --debt "1"


echo "Paying and delegate token voting power..."

#Pay-and-delegate!
npx hardhat pay-and-delegate-auto --neighbors $NEIGHBORS_CONTRACT_ADDRESS --token $TOKEN_CONTRACT_ADDRESS --amount 10