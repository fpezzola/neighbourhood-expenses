import CommunityGovernance from "../artifacts/contracts/CommunityGovernance.sol/CommunityGovernance.json";

export default async function propose(
  address: string,
  target: string,
  transferValue: string,
  description: string
) {
  //dynamic import since we reference this function from hardhat.config
  //and we can't import hardhat before initializing
  const { ethers } = await import("hardhat");
  const [signer0, signer1] = await ethers.getSigners();
  console.log("Using signer1", signer1.address);
  const contract = new ethers.Contract(
    address,
    CommunityGovernance.abi,
    signer1
  );
  return contract.propose(
    [target],
    [transferValue],
    [ethers.toUtf8Bytes("")],
    description
  );
}
