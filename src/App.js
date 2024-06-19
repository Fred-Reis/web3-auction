/* eslint-disable no-undef */
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getParsedEthersError } from "@enzoferey/ethers-error-parser";

import { CustomButton } from "./components/CustomButton";
import { CustomInput } from "./components/CustomInput";
import { Loading } from "./components/Loading";

import auctionAbi from "./utils/Auction.json";
import logo from "./assets/logo.png";
import "./style.css";

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
const CONTRACT_ABI = auctionAbi.abi;

function App() {
  const [bid, setBid] = useState("");
  const [buyer, setBuyer] = useState("buyer");
  const [seller, setSeller] = useState("seller");
  const [status, setStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [counter, setCounter] = useState();
  const [initialBid, setInitialBid] = useState(0);
  const [highestBid, setHighestBid] = useState(0);
  const [errorMessage, setErrorMessage] = useState({});
  const [currentAccount, setCurrentAccount] = useState("");
  const [contractBalance, setContractBalance] = useState(0);

  const checkIfWalletIsConnected = async () => {
    setLoading(true);
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Please install Metamask!");
      } else {
        console.log("We have Ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length) {
        const account = accounts[0];
        console.log("Authorized account has found", account);
        setCurrentAccount(account);
      } else {
        setCurrentAccount("");
        console.log("No authorized account has found!");
      }
      setLoading(false);
    } catch (error) {
      console.error(error.message);
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    setLoading(true);
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Metamask has found!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      setLoading(false);
    } catch (err) {
      console.error(err.message);
      setLoading(false);
    }
  };

  const open = async () => {
    setLoading(true);
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const auctionContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );

        const transaction = await auctionContract.open();

        const transactionResponse = await transaction.wait();

        console.log(transactionResponse);
      }
      setStatus(true);

      let count = 180;
      setInterval(() => {
        if (count >= 0) {
          setCounter(count);
          count--;
        } else {
          setStatus(false);
        }
      }, 1000);

      setErrorMessage({});
      setLoading(false);
    } catch (err) {
      const parsedEthersError = getParsedEthersError(err);
      setErrorMessage({ open: parsedEthersError.context });
      console.error(parsedEthersError);
      setLoading(false);
    }
  };

  const biddings = async () => {
    setLoading(true);
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const auctionContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );

        const transaction = await auctionContract.biddings({
          value: ethers.utils.parseEther(`${bid}`),
        });

        const transactionResponse = await transaction.wait();

        setBuyer(transactionResponse.events[0].args.sender);

        setHighestBid(
          ethers.utils.formatEther(transactionResponse.events[0].args.amount)
        );
      }

      setErrorMessage({});
      setLoading(false);
    } catch (err) {
      const parsedEthersError = getParsedEthersError(err);
      setErrorMessage({ biddings: parsedEthersError.context });
      console.error(parsedEthersError);
      setLoading(false);
    }
  };

  const remove = async () => {
    setLoading(true);
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const auctionContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );

        const transaction = await auctionContract.remove();

        await transaction.wait();
      }

      setErrorMessage({});
      setLoading(false);
    } catch (err) {
      const parsedEthersError = getParsedEthersError(err);
      setErrorMessage({ remove: parsedEthersError.context });
      console.error(parsedEthersError);
      setLoading(false);
    }
  };

  const close = async () => {
    setLoading(true);
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const auctionContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );

        const transaction = await auctionContract.close();

        await transaction.wait();

        setStatus(false);
      }

      setErrorMessage({});
      setLoading(false);
    } catch (err) {
      const parsedEthersError = getParsedEthersError(err);
      setErrorMessage({ close: parsedEthersError.context });
      console.error(parsedEthersError);
      setLoading(false);
    }
  };

  const renderNotConnectedContainer = () => (
    <div>
      <CustomButton
        type="connect"
        action={connectWallet}
        title="Connect to Wallet"
      />
    </div>
  );

  useEffect(() => {
    checkIfWalletIsConnected();

    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        const auctionContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );

        (async () => {
          if (!status) {
            setInitialBid(
              ethers.utils.formatEther(await auctionContract.highestBid())
            );
          }
          setSeller(await auctionContract.seller());

          setBuyer(await auctionContract.highestBidder());
        })();

        setLoading(false);
      }
    } catch (err) {
      console.error(err.message);
      setLoading(false);
    }
  }, [currentAccount]);

  // effect to update the contract balance
  useEffect(() => {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);

      let lastBalance = ethers.constants.Zero;
      provider.on("block", () => {
        provider.getBalance(CONTRACT_ADDRESS).then((balance) => {
          if (!balance.eq(lastBalance)) {
            lastBalance = balance;
            const balanceInEth = ethers.utils.formatEther(balance);
            setContractBalance(balanceInEth);
          }
        });
      });
    }
  }, []);

  return (
    <div className="container">
      <header className="header">
        <img src={logo} />
        <h1>Auction</h1>
      </header>
      {currentAccount === "" ? (
        renderNotConnectedContainer()
      ) : loading ? (
        <Loading loading={loading} />
      ) : (
        <div className="sub-container">
          <div className="buttons-container">
            <h2>Open Auction</h2>

            <CustomButton action={open} title="Open" disabled={status} />
            {errorMessage.open && (
              <span className="message-error">{errorMessage.open}</span>
            )}

            <h2>Take a Bid</h2>

            <div className="input-wrapper">
              <CustomInput
                value={bid}
                action={(e) => setBid(e.target.value)}
                placeholder="type your bid"
                type="number"
              />
              <CustomButton action={biddings} title="Bid" />
            </div>
            {errorMessage.biddings && (
              <span className="message-error">{errorMessage.biddings}</span>
            )}

            <h2>Refund Money</h2>

            <CustomButton action={remove} title="Refund" />
            {errorMessage.remove && (
              <span className="message-error">{errorMessage.remove}</span>
            )}

            <h2>Close Auction</h2>
            <CustomButton
              action={close}
              title="Close"
              // disabled={!status}
            />
            {errorMessage.close && (
              <span className="message-error">{errorMessage.close}</span>
            )}
          </div>
          <div className="panel">
            <h2>Panel</h2>

            {status && <h2>{counter}</h2>}

            <h3>
              Contract Balance: {Number(contractBalance).toFixed(4)}... eth
            </h3>

            <h3>Initial Bid: {Number(initialBid).toFixed(4)}... eth</h3>

            <h3>Highest Bid: {Number(highestBid).toFixed(4)}... eth</h3>

            <h3>Seller Address: {seller}</h3>

            <h3>Buyer Address: {buyer}</h3>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
