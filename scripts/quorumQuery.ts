import CommunityGovernance from "../artifacts/contracts/CommunityGovernance.sol/CommunityGovernance.json";

export default async function queryQuorum(address: string, timepoint: string) {
  //dynamic import since we reference this function from hardhat.config
  //and we can't import hardhat before initializing
  const { ethers } = await import("hardhat");
  const [signer0] = await ethers.getSigners();
  const contract = new ethers.Contract(
    address,
    CommunityGovernance.abi,
    signer0
  );
  const quorum = await contract.quorum(BigInt(timepoint));
  console.log("Quorum is:", quorum);
  return quorum;
}
