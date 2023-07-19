import NeighborsContract from "../artifacts/contracts/Neighbors.sol/Neighbors.json";
const NEIGHBORS = [
  {
    lotNumber: 1,
    area: 800,
  },
  {
    lotNumber: 2,
    area: 1200,
  },
  {
    lotNumber: 3,
    area: 400,
  },
  {
    lotNumber: 4,
    area: 1000,
  },
  {
    lotNumber: 5,
    area: 900,
  },
  {
    lotNumber: 6,
    area: 400,
  },
  {
    lotNumber: 7,
    area: 800,
  },
  {
    lotNumber: 8,
    area: 1800,
  },
  {
    lotNumber: 9,
    area: 500,
  },
  {
    lotNumber: 10,
    area: 800,
  },
];

export default async function seedNeighbors(address: string) {
  //dynamic import since we reference this function from hardhat.config
  //and we can't import hardhat before initializing
  const { ethers } = await import("hardhat");
  const [signer0, ...rest] = await ethers.getSigners();
  const contract = new ethers.Contract(address, NeighborsContract.abi, signer0);
  for (let i = 0; i < 10; i++) {
    const signer = rest[i];
    const config = NEIGHBORS[i];
    await contract.registerNeighbor(
      signer.address,
      config.lotNumber,
      config.area
    );
    console.log(
      `Generated neighbor=${signer.address} - LotNumber: ${config.lotNumber}`
    );
  }
}
