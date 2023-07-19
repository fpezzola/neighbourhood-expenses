import TokenContract from "../artifacts/contracts/CommunityToken.sol/CommunityToken.json";
import NeighborsContract from "../artifacts/contracts/Neighbors.sol/Neighbors.json";
import delegate from "./delegate";

export async function payExpensesAndDelegateLocal(
  neighborsAddress: string,
  tokenAddress: string,
  amount: number
) {
  const { ethers } = await import("hardhat");
  const signers = await ethers.getSigners();
  const finalIdx = Math.min(amount + 1, signers.length);
  for (let i = 1; i < finalIdx; i++) {
    const signer = signers[i];
    await payExpensesAndDelegate(
      neighborsAddress,
      tokenAddress,
      signer.address
    );
  }
}

export default async function payExpensesAndDelegate(
  neighborsAddress: string,
  tokenAddress: string,
  accountAddress: string
) {
  const { ethers } = await import("hardhat");
  const signers = await ethers.getSigners();
  const signer = signers.find((s) => s.address === accountAddress);
  const neighborsContract = new ethers.Contract(
    neighborsAddress,
    NeighborsContract.abi,
    signer
  );
  const tokenContract = new ethers.Contract(
    tokenAddress,
    TokenContract.abi,
    signer
  );

  const neighbors = await neighborsContract.neighbors();

  const signerNeighbor = neighbors.find(
    ({ owner }: { owner: string }) => owner === accountAddress
  );

  const debt = signerNeighbor.debt;

  console.log(`Paying debt=${debt} of address=${accountAddress}\n`);

  const tx = {
    to: neighborsAddress,
    value: debt,
  };

  await signer?.sendTransaction(tx);
  await delegate(tokenAddress, accountAddress, accountAddress);
}
