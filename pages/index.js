import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"
import Image from 'next/image'
import chinesegen from "chinesegen"
import Clock from './Clock'
import { useRouter } from 'next/router'
import {
  nftaddress, nftmarketaddress
} from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/Market.sol/NFTMarket.json'

import { initializeApp, getApps } from "firebase/app"
import { getStorage, ref, listAll } from "firebase/storage";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, query, orderBy, limit } from "firebase/firestore";

export default function Home() {
  const [nfts, setNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  const [showModal, setShowModal] = useState(false);
  const [address, setAddress] = useState('')
  const [price, setPrice] = useState(10)
  const router = useRouter()

  // For now, 'eth_accounts' will continue to always return an array
  function handleAccountsChanged(accounts) {
    console.log("****accounts,", accounts)
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      console.log('Please connect to MetaMask.');
    } else if (accounts[0] !== address) {
      setAddress(accounts[0]);
      console.log("currentAccount", accounts[0]);
      //getMETT(accounts[0]);
    }
  }
  function connect() {
    console.log("****connect");
    window.ethereum
      .request({ method: 'eth_requestAccounts' })
      .then(handleAccountsChanged)
      .catch((err) => {
        if (err.code === 4001) {
          // EIP-1193 userRejectedRequest error
          // If this happens, the user rejected the connection request.
          console.log('Please connect to MetaMask.');
        } else {
          console.error(err);
        }
      });
  }
  useEffect(() => {
    connect()
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return function cleanup() {
      //mounted = false
    }
  }, [])

  async function loadFirebase() {
    const firebaseConfig = {
      // INSERT YOUR OWN CONFIG HERE
      apiKey: "AIzaSyBg34hCq_jGHdj-HNWi2ZjfqhM2YgWq4ek",
      authDomain: "pay-a-vegan.firebaseapp.com",
      databaseURL: "https://pay-a-vegan.firebaseio.com",
      projectId: "pay-a-vegan",
      storageBucket: "pay-a-vegan.appspot.com",
      messagingSenderId: "587888386485",
      appId: "1:587888386485:web:3a81137924d19cbe2439fc",
      measurementId: "G-MGJK6GF9YW"
    };

    const app = initializeApp(firebaseConfig)

    const db = getFirestore(app)
    //const auth = getAuth(app)
    const nounsRef = collection(db, "nouns");
    const q = query(nounsRef, orderBy("createdAt", "desc"), limit(1));

    const querySnapshot = await getDocs(q);
    const items = [];
    querySnapshot.forEach((doc) => {
      let noun = doc.data();
      let item = {
        id: doc.id,
        price: noun.price,
        text: noun.text
      }
      if (!item.sold) {items.push(item)}
      setPrice(item.price + 1)
    })
    setNfts(items)
    setLoadingState('loaded')
  }
  async function uploadNewNounToFirebase() {
    //setShowModalIPFS(true)
    const generated = chinesegen({count: 2, freq: true})
    console.log(generated.text);
    console.log(generated.text[0]);
    console.log(generated.sentenceCount);

    const firebaseConfig = {
      // INSERT YOUR OWN CONFIG HERE
      apiKey: "AIzaSyBg34hCq_jGHdj-HNWi2ZjfqhM2YgWq4ek",
      authDomain: "pay-a-vegan.firebaseapp.com",
      databaseURL: "https://pay-a-vegan.firebaseio.com",
      projectId: "pay-a-vegan",
      storageBucket: "pay-a-vegan.appspot.com",
      messagingSenderId: "587888386485",
      appId: "1:587888386485:web:3a81137924d19cbe2439fc",
      measurementId: "G-MGJK6GF9YW"
    };

    try {

      if (!getApps().length) {
        //....
      }

      const app = initializeApp(firebaseConfig)

      const db = getFirestore(app)
      //const auth = getAuth(app)

      const colRef = collection(db, 'nouns')

      addDoc(colRef, {
        text: generated.text[0],
        price: price,
        createdAt: Date.now()
      });

      setPrice(price + 1)
      loadFirebase()
    } catch(err){
      if (!/already exists/.test(err.message)) {
        console.error('Firebase initialization error', err.stack)}
    }
    //setShowModalMint(false)
    //router.push('/')
  }

  useEffect(() => {
    //loadNFTs()
    loadFirebase()
    return function cleanup() {
      //mounted = false
    }
  }, [])

  async function loadNFTs() {
      const web3Modal = new Web3Modal({
        network: "mainnet",
        cacheProvider: true,
      })
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider)
    const data = await marketContract.fetchMarketItems()

    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        auction: i.auction,
        endTime: i.endTime,
        description: meta.data.description,
      }
      return item
    }))
    setNfts(items)
    setLoadingState('loaded')
  }
  async function buyFirebase(nft) {
    setShowModal(true)
    const firebaseConfig = {
      // INSERT YOUR OWN CONFIG HERE
      apiKey: "AIzaSyBg34hCq_jGHdj-HNWi2ZjfqhM2YgWq4ek",
      authDomain: "pay-a-vegan.firebaseapp.com",
      databaseURL: "https://pay-a-vegan.firebaseio.com",
      projectId: "pay-a-vegan",
      storageBucket: "pay-a-vegan.appspot.com",
      messagingSenderId: "587888386485",
      appId: "1:587888386485:web:3a81137924d19cbe2439fc",
      measurementId: "G-MGJK6GF9YW"
    };

    const app = initializeApp(firebaseConfig)

    const db = getFirestore(app)
    const characterRef = doc(db, "nouns", nft.id);
    // Set the "capital" field of the city 'DC'
    await updateDoc(characterRef, {
      sold: true,
      owner: address
    });
    uploadNewNounToFirebase()
    setShowModal(false)
    //loadFirebase()

    //router.push('/my-collection')
  }
  async function buyNft(nft) {
    setShowModal(true)
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)

    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')
    const transaction = await contract.createMarketSale(nftaddress, nft.tokenId, {
      value: price
    })
    await transaction.wait()
    setShowModal(false)
    loadNFTs()
  }
  if (showModal) return (
    <div className="p-4">
      <p>Please wait. Your METAMASK wallet will prompt you once for the purchase.</p>
      <p>We will move your purchase to your personal Collection page.</p>
    </div>
  )
  return (
    <div>
    <div className="p-4">
      <h1 className="text-2xl py-2">Public Home - purchase noun before countdown ends.</h1>
      <div className="">
        <Clock endTime={Math.floor(Date.now() / 1000) + 3600} trigger={() => uploadNewNounToFirebase()} />
      </div>
    </div>
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden bg-black">
                <div className="p-4 bg-white">
                  <p style={{ height: '64px' }} className="text-5xl font-semibold">{nft.text}</p>
                  <div style={{ height: '70px', overflow: 'hidden' }}>
                    <p className="text-gray-400">{nft.description}</p>
                  </div>
                </div>
                  <div className="p-4 bg-black">
                    <p className="text-2xl mb-4 font-bold text-white">{nft.price} MATIC</p>
                    <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => buyFirebase(nft)}>
                      Buy
                    </button>
                  </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
    </div>
  )
}
