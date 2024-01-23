import Navbar from "./Navbar";
import NFTTile from "./NFTTile";
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState, useEffect } from "react";
import { GetIpfsUrlFromPinata } from "../utils";

export default function Marketplace() {
  const sampleData = [
    // ... (sample data remains unchanged)
  ];
  const [data, updateData] = useState(null);
  const [dataFetched, updateFetched] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const ethers = require("ethers");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        let contract = new ethers.Contract(
          MarketplaceJSON.address,
          MarketplaceJSON.abi,
          signer
        );
        let transaction = await contract.getAllNFTs();
        const items = await Promise.all(
          transaction.map(async (i) => {
            var tokenURI = await contract.tokenURI(i.tokenId);
            tokenURI = GetIpfsUrlFromPinata(tokenURI);
            let meta = await axios.get(tokenURI);
            meta = meta.data;

            let price = ethers.utils.formatUnits(i.price.toString(), "ether");
            let item = {
              price,
              tokenId: i.tokenId.toNumber(),
              seller: i.seller,
              owner: i.owner,
              image: meta.image,
              name: meta.name,
              description: meta.description,
            };
            return item;
          })
        );

        updateFetched(true);
        updateData(items);
      } catch (error) {
        console.log("error from marketplace.js: ", error);
      }
    }

    if (!dataFetched) {
      fetchData();
    }
  }, [dataFetched]);

  return (
    <div className="bg-black bg-opacity-100 min-h-screen">
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full text-gray-300">
        <div className="font-bold stroke">Top ARTs</div>
        <div className="flex mt-5 justify-between flex-wrap max-w-screen-xl text-center">
          {data?.map((value, index) => {
            return <NFTTile data={value} key={index} />;
          })}
        </div>
      </div>
    </div>
  );
}
