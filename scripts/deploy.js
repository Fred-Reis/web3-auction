const hre = require("hardhat");

async function main() {
  const NFT_ID = 26;

  const NFTFactory = await hre.ethers.getContractFactory("CW3");
  const AuctionFactory = await hre.ethers.getContractFactory("Auction");

  const signers = await hre.ethers.getSigners();

  const nftContract = await NFTFactory.deploy();
  await nftContract.deployed();

  let minting = await nftContract.mint(signers[0].address, NFT_ID);

  await minting.wait();
  console.log(`nft was minted to ${nftContract.address}`);

  const auction = await AuctionFactory.deploy(
    nftContract.address,
    NFT_ID,
    hre.ethers.utils.parseEther("0.003")
  );

  await auction.deployed();
  console.log(`auction was deployed to ${auction.address}`);

  let approving = await nftContract.approve(auction.address, NFT_ID);
  await approving.wait();
  console.log("approved to be sold");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
