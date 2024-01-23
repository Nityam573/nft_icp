import Navbar from "./Navbar";
import { useState } from "react";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../pinata";
import Marketplace from "../Marketplace.json";
import { useLocation } from "react-router";

export default function SellNFT() {
  const [formParams, updateFormParams] = useState({
    name: "",
    description: "",
    price: "",
  });
  const [fileURL, setFileURL] = useState(null);
  const ethers = require("ethers");
  const [message, updateMessage] = useState("");
  const location = useLocation();

  async function disableButton() {
    const listButton = document.getElementById("list-button");
    listButton.disabled = true;
    listButton.style.backgroundColor = "grey";
    listButton.style.opacity = 0.3;
  }

  async function enableButton() {
    const listButton = document.getElementById("list-button");
    listButton.disabled = false;
    listButton.style.backgroundColor = "#A500FF";
    listButton.style.opacity = 1;
  }

  async function OnChangeFile(e) {
    var file = e.target.files[0];
    try {
      disableButton();
      updateMessage("Uploading image.. please don't click anything!");
      const response = await uploadFileToIPFS(file);
      if (response.success === true) {
        enableButton();
        updateMessage("");
        console.log("Uploaded image to Pinata: ", response.pinataURL);
        setFileURL(response.pinataURL);
      }
    } catch (e) {
      console.log("Error during file upload", e);
    }
  }

  async function uploadMetadataToIPFS() {
    const { name, description, price } = formParams;
    if (!name || !description || !price || !fileURL) {
      updateMessage("Please fill all the fields!");
      return -1;
    }

    const nftJSON = {
      name,
      description,
      price,
      image: fileURL,
    };

    try {
      const response = await uploadJSONToIPFS(nftJSON);
      if (response.success === true) {
        console.log("Uploaded JSON to Pinata: ", response);
        return response.pinataURL;
      }
    } catch (e) {
      console.log("error uploading JSON metadata:", e);
    }
  }

  async function listNFT(e) {
    e.preventDefault();

    try {
      const metadataURL = await uploadMetadataToIPFS();
      if (metadataURL === -1) return;

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      disableButton();
      updateMessage(
        "Uploading NFT (takes 5 mins).. please don't click anything!"
      );

      let contract = new ethers.Contract(
        Marketplace.address,
        Marketplace.abi,
        signer
      );

      const price = ethers.utils.parseUnits(formParams.price, "ether");
      let listingPrice = await contract.getListPrice();
      listingPrice = listingPrice.toString();

      let transaction = await contract.createToken(metadataURL, price, {
        value: listingPrice,
      });
      await transaction.wait();

      alert("Successfully listed your NFT!");
      enableButton();
      updateMessage("");
      updateFormParams({ name: "", description: "", price: "" });
      window.location.replace("/");
    } catch (e) {
      alert("Upload error" + e);
    }
  }

  return (
    <div className=''>
      <Navbar />
      <div className='flex flex-col place-items-center mt-10' id='nftForm'>
        <form className='bg-black bg-opacity-30 border rounded-lg border-white px-8 pt-4 pb-8 mb-4'>
          <h3 className='text-center font-bold text-gray-300 mb-8'>
            Upload your ART to the Museum
          </h3>
          <div className='mb-4'>
            <label
              className='block text-gray-300 text-sm font-bold mb-2'
              htmlFor='name'>
              ART Name
            </label>
            <input
              className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 leading-tight focus:outline-none focus:shadow-outline'
              id='name'
              type='text'
              placeholder='Axie#4563'
              onChange={(e) =>
                updateFormParams({ ...formParams, name: e.target.value })
              }
              value={formParams.name}
            />
          </div>
          <div className='mb-6'>
            <label
              className='block text-gray-300 text-sm font-bold mb-2'
              htmlFor='description'>
              ART Description
            </label>
            <textarea
              className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 leading-tight focus:outline-none focus:shadow-outline'
              cols='40'
              rows='5'
              id='description'
              type='text'
              placeholder='Axie Infinity Collection'
              value={formParams.description}
              onChange={(e) =>
                updateFormParams({
                  ...formParams,
                  description: e.target.value,
                })
              }
            />
          </div>
          <div className='mb-6'>
            <label
              className='block text-gray-300 text-sm font-bold mb-2'
              htmlFor='price'>
              Price (in ETH)
            </label>
            <input
              className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 leading-tight focus:outline-none focus:shadow-outline'
              type='number'
              placeholder='Min 0.01 ETH'
              step='0.01'
              value={formParams.price}
              onChange={(e) =>
                updateFormParams({
                  ...formParams,
                  price: e.target.value,
                })
              }
            />
          </div>
          <div>
            <label
              className='block text-gray-300 text-sm font-bold mb-2'
              htmlFor='image'>
              Upload Image (&lt;500 KB)
            </label>
            <input type='file' onChange={OnChangeFile} />
          </div>
          <br />
          <div className='text-red-500 text-center'>{message}</div>
          <button
            onClick={listNFT}
            className='font-bold mt-10 w-full bg-purple-500 text-white rounded p-2 shadow-lg'
            id='list-button'>
            List your ART
          </button>
        </form>
      </div>
    </div>
  );
}
