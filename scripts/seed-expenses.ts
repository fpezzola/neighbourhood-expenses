import NeighborsContract from "../artifacts/contracts/Neighbors.sol/Neighbors.json";

export default async function seedExpenses(address: string, debt = "1") {
  //adds expenses for all the neighbors
  const { ethers } = await import("hardhat");
  const [signer0] = await ethers.getSigners();
  const contract = new ethers.Contract(address, NeighborsContract.abi, signer0);
  const neighbors = await contract.neighbors();
  for (const neighbor of neighbors) {
    await contract.loadDebt(
      neighbor.lotNumber,
      ethers.parseEther(debt.toString())
    );
    console.log(
      `Added debt to LotNumber: ${neighbor.lotNumber} - Debt: ${debt} ETH.\n`
    );
  }
}
