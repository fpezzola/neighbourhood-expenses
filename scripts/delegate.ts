import TokenContract from "../artifacts/contracts/CommunityToken.sol/CommunityToken.json";
export default async function delegate(
  tokenContractAddress: string,
  delegator: string,
  delegatee: string
) {
  const { ethers } = await import("hardhat");
  const signers = await ethers.getSigners();
  const delegatorSigner = signers.find((s) => s.address === delegator);
  const contract = new ethers.Contract(
    tokenContractAddress,
    TokenContract.abi,
    delegatorSigner
  );
  console.log(
    `Before delegation: getVotes=${await contract.getVotes(delegatee)}\n`
  );
  await contract.delegate(delegatee);
  console.log(`Delegated from=${delegator} to=${delegatee}\n`);
  console.log(
    `After delegation getVotes=${await contract.getVotes(delegatee)}\n`
  );
}
