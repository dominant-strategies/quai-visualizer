// Default max items to keep in blockchain data hooks
export const DefaultMaxItems = 750;

export const QUAI_DESCRIPTION = [
  {
    title: "The Scaling Challenge",
    text: "Traditional blockchains face an impossible choice: stay small and secure, or grow large and vulnerable. Quai’s hierarchical structure breaks this limitation by working like a tree where every branch processes transactions independently, but the trunk ensures all branches stay secure."
  },
  {
    title: "Three Levels of Organization",
    list: [
      "Prime Chain (The Trunk): Coordinates the entire network",
      "Region Chains (Branches): Organize geographical areas",
      "Zone Chains (Leaves): Process your actual transactions"
    ]
  },
  {
    title: "The Security Innovation",
    text: "Through merged mining, every transaction in every zone receives 100% of the network’s security. This maintains full hash-based security guarantees while allowing unlimited parallel processing."
  },
  {
    title: "Why This Matters",
    list: [
      "255,000+ TPS: Process more transactions than Visa",
      "Sub-penny fees: Sustainable even at massive scale",
      "5-second blocks: Near-instant transaction confirmation"
    ]
  },
  {
    title: "Parallel Processing Power",
    text: "Think of Quai as a multi-core processor for blockchains. Each zone chain operates like an independent CPU core, processing transactions in parallel while staying perfectly synchronized through hash linked references."
  },
  {
    title: "Workshares & Economic Finality",
    text: "Workshares contribute directly to block weight by adding entropy reflecting total computational work. A block's weight is the sum of its intrinsic entropy plus workshare entropy from included workshares. This additional weight makes reorg attacks proportionally more expensive, as attackers must overcome both the block difficulty and the accumulated workshare entropy, leading to faster and more robust economic finality."
  },
  {
    title: "Further Reading",
    text: '<a href="https://docs.qu.ai/learn/advanced-introduction/hierarchical-structure/sharding" target="_blank" rel="noopener noreferrer" style="color: #00d4ff; text-decoration: none;">Learn more about Quai\'s Hierarchical Structure and Sharding</a>'
  }
];
