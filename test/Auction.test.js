const { assert } = require("chai")
const { ethers, network } = require("hardhat")

describe("Auction", () => {
    let auctionFactory, auction
    let cw3Factory, cw3
    let accounts
    let deployer, bidder1, bidder2
    let deployerAddress
    let tokenId
    const BASE_PRICE = ethers.utils.parseEther("1")

    beforeEach(async () => {
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        bidder1 = accounts[1]
        bidder2 = accounts[2]

        deployerAddress = await deployer.getAddress()

        cw3Factory = await ethers.getContractFactory("CW3")
        cw3 = await cw3Factory.deploy()
        await cw3.mint(deployerAddress, 0)

        auctionFactory = await ethers.getContractFactory("Auction", deployer)
        auction = await auctionFactory.deploy(cw3.address, 0, BASE_PRICE)
        await auction.deployed()
        tokenId = await auction.tokenId()
        await cw3.approve(auction.address, tokenId)
    })

    it("Contract Deployed Correctly", async () => {
        let highestBid = await auction.highestBid()
        let seller = await auction.seller()
        assert.equal(tokenId.toString(), "0")
        assert.equal(highestBid.toString(), BASE_PRICE.toString())
        assert.equal(seller.toString(), deployerAddress.toString())
    })

    it("open must start the Auction ", async () => {
        const tx = await auction.open()
        const txResponse = await tx.wait(1)
        const state = await auction.auctionState()
        const nftOwner = await cw3.ownerOf(0)

        assert.equal(state.toString(), "1")
        assert.equal(nftOwner.toString(), auction.address.toString())
        // Check Event Name
    })

    it("biddings must place bids", async () => {
        const BIDDER1_PRICE = ethers.utils.parseEther("1.1")

        let bidder1Address = await bidder1.getAddress()
        await auction.open()
        const auctionBidderConnect = await auction.connect(bidder1)
        const tx = await auctionBidderConnect.biddings({ value: BIDDER1_PRICE })

        const txResponse = await tx.wait(1)
        const event = txResponse.events[0]
        const highestBidValue = await auction.highestBid()
        const highestBidAddress = await auction.highestBidder()

        assert(highestBidValue.toString(), BIDDER1_PRICE.toString())
        assert(highestBidAddress.toString(), bidder1Address.toString())
        assert(event.event, "Bid")
        assert(event.args.sender.toString(), bidder1Address.toString())
        assert(event.args.amount.toString(), BIDDER1_PRICE.toString())
    })

    it("remove should remove the placed bid", async () => {
        const BIDDER1_PRICE = ethers.utils.parseEther("1.1")
        const BIDDER2_PRICE = ethers.utils.parseEther("1.2")
        const ZERO = ethers.utils.parseEther("0")

        let bidder1Address = await bidder1.getAddress()
        let bidder2Address = await bidder2.getAddress()
        await auction.open()
        const auctionBidder1Connect = await auction.connect(bidder1)
        await auctionBidder1Connect.biddings({ value: BIDDER1_PRICE })
        const auctionBidder2Connect = await auction.connect(bidder2)
        await auctionBidder2Connect.biddings({ value: BIDDER2_PRICE })

        const bidder1ValueBefore = await auction.bidding(bidder1Address)
        const tx = await auctionBidder1Connect.remove()
        const txResponse = await tx.wait(1)
        const bidder1ValueAfter = await auction.bidding(bidder1Address)

        assert(bidder1ValueBefore.toString(), BIDDER1_PRICE.toString())
        assert(bidder1ValueAfter.toString(), ZERO.toString())
        assert(txResponse.events[0].event, "Remove")
    })

    it("close should end the auction", async () => {
        const BIDDER1_PRICE = ethers.utils.parseEther("1.1")

        let bidder1Address = await bidder1.getAddress()
        await auction.open()
        const auctionBidder1Connect = await auction.connect(bidder1)
        await auctionBidder1Connect.biddings({ value: BIDDER1_PRICE })

        await network.provider.send("evm_increaseTime", [5000])

        const tx = await auction.close()
        const txResponse = await tx.wait(1)
        const ownerOfNft = await cw3.ownerOf(tokenId)

        assert(ownerOfNft.toString(), bidder1Address.toString())
        assert(txResponse.events[1].event?.toString(), "Close")
        assert(
            txResponse.events[1].args.winner.toString(),
            bidder1Address.toString()
        )
    })
})
