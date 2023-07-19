import { ethers } from "hardhat";

async function main() {
  console.log("#########################\n");
  console.log("Deploying contracts....\n");
  const [signer] = await ethers.getSigners();
  const communityTokenContract = await ethers.deployContract("CommunityToken");
  await communityTokenContract.waitForDeployment();

  const communityTokenContractAddress =
    await communityTokenContract.getAddress();
  console.log(
    `     - CommunityToken contract deployed: ${communityTokenContractAddress}\n`
  );

  const transactionCount = await ethers.provider.getTransactionCount(
    signer.address
  );

  //retrieve future governor address
  const governorAddress = ethers.getCreateAddress({
    from: signer.address,
    nonce: transactionCount + 1,
  });

  //deploy governor
  const governorContract = await ethers.deployContract("CommunityGovernance", [
    communityTokenContractAddress,
  ]);

  const governorContractAddress = await governorContract.getAddress();

  console.log(
    `     - CommunityGovernance contract deployed: ${governorContractAddress}\n`
  );

  //deploy neighbors contract
  const neighborsContract = await ethers.deployContract("Neighbors", [
    communityTokenContractAddress,
    governorContractAddress,
  ]);

  await neighborsContract.waitForDeployment();

  const neighborsContractAddress = await neighborsContract.getAddress();
  console.log(
    `     - Neighbors contract deployed: ${neighborsContractAddress}`
  );

  //transfer ownership of community token address to neighbors contract.
  await communityTokenContract.transferOwnership(neighborsContractAddress);

  console.log("\n#########################\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
