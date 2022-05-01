/**
 * Whitelist
 * Add addresses in whitelist.js in this directory
 * Run: node calculate_root.js
 * Insert the result in the contract using changeRoot function
 */

 import { MerkleTree } from 'merkletreejs';
 import keccak256 from 'keccak256';
 import whitelistArray from './data';
 
 export const calculate_whitelist_root = () => {
     const leaves = whitelistArray.map(v => keccak256(v));
     const tree = new MerkleTree(leaves, keccak256, { sort: true });
     const root = tree.getHexRoot();
     return root;
 }
 
 export const verifyWhitelist = (address: string) => {
    const leaves = whitelistArray.map((v) => keccak256(v));
    const tree = new MerkleTree(leaves, keccak256, { sort: true });
    const root = tree.getHexRoot();
    const leaf = keccak256(address);
    const proof = tree.getHexProof(leaf);
    const verified = tree.verify(proof, leaf, root);
    return { proof, leaf, verified };
  };