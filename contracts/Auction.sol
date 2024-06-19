// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

interface IERC721 {
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;
}

contract Auction {
    IERC721 public nft;

    address payable public seller;
    address public highestBidder;

    uint256 public tokenId;
    uint256 public endsWhen;
    uint256 public highestBid;

    bool public auctionBegan;
    bool public auctionEnded;

    event Begin();
    event Bid(address indexed sender, uint256 amount);
    event Remove(address indexed bidder, uint256 amount);
    event Close(address indexed winner, uint256 amount);

    modifier auctionStarted() {
        require(auctionBegan, "auction hasn't began");
        _;
    }

    mapping(address => uint256) public bidding;

    constructor(address _nft, uint256 _tokenId, uint256 _setPrice) {
        tokenId = _tokenId;
        nft = IERC721(_nft);
        highestBid = _setPrice;
        seller = payable(msg.sender);
    }

    function open() external {
        require(!auctionBegan, "one auction at the time");
        require(msg.sender == seller, "only seller can open his auction");

        auctionBegan = true;
        nft.transferFrom(msg.sender, address(this), tokenId);
        endsWhen = uint(block.timestamp + 180 seconds);

        emit Begin();
    }

    function biddings() external payable auctionStarted {
        require(msg.value > highestBid, "bid is too low");
        require(block.timestamp < endsWhen, "auction already ended");

        if(highestBidder != address(0)) {
            bidding[highestBidder] += highestBid;
        }

        highestBid = msg.value;
        highestBidder = msg.sender;

        emit Bid(msg.sender, msg.value);
    }

    function remove() external {
        uint256 withdraw = bidding[msg.sender];

        bidding[msg.sender] = 0;
        payable(msg.sender).transfer(withdraw);

        emit Remove(msg.sender, withdraw);
    }

    function close() external auctionStarted {
        require(!auctionEnded, "auction closed");
        require(block.timestamp >= endsWhen, "duration is complete");

        auctionEnded = true;
        if(highestBidder != address(0)) {
            nft.transferFrom(address(this), highestBidder, tokenId);
            seller.transfer(highestBid);

            emit Close(highestBidder, highestBid);
        } else {
            nft.transferFrom(address(this), seller, tokenId);

            emit Close(seller, highestBid);
        }

        
    }
    
}