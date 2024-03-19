import * as crypto from 'crypto';

// Transfer of funds between two wallets
class Transaction {
  constructor(
    public amount: number,
    public payer: string, // public key
    public payee: string // public key
  ) { }

  toString() {
    return JSON.stringify(this);
  }
}

// Individual block on the chain
class Block {
  public nonce = Math.round(Math.random() * 999999999);

  constructor(
    public prevHash: string,
    public transaction: Transaction,
    public ts = Date.now()
  ) { }

  get hash() {
    const str = JSON.stringify(this);
    const hash = crypto.createHash('SHA256');
    hash.update(str).end();
    return hash.digest('hex');
  }
}

// The blockchain
class Chain {
  // Singleton instance
  public static instance = new Chain();

  chain: Block[];

  constructor() {
    this.chain = [
      // Genesis block
      new Block('', new Transaction(100, 'genesis', 'satoshi'))
    ];
  }

  // Most recent block
  get lastBlock() {
    return this.chain[this.chain.length - 1];
  }

  // Proof of work system
  mine(nonce: number, transaction: Transaction, senderPublicKey: string, signature: Buffer) {
    const targetDifficulty = '00000'; // Example difficulty target (leading zeros)

    let solution: string;
    let isValidSolution = false;
    console.log('⛏️  mining...')

    while (!isValidSolution) {
      const hash = crypto.createHash('sha256');
      hash.update(`${nonce}${transaction.toString()}`).end();
      solution = hash.digest('hex');

      if (solution.startsWith(targetDifficulty)) {
        const verify = crypto.createVerify('SHA256');
        verify.update(transaction.toString());

        const isValid = verify.verify(senderPublicKey, signature);

        if (isValid) {
          isValidSolution = true;
          console.log(`Solved: ${nonce}`);
        }
      }

      nonce++; // Increment nonce for next iteration
    }

    return nonce; // Return the valid nonce
  }

  // Add a new block to the chain if valid signature & proof of work is complete
  addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
    const newBlock = new Block(this.lastBlock.hash, transaction);
    this.mine(newBlock.nonce, transaction, senderPublicKey, signature);
    this.chain.push(newBlock);
  }
}

// Wallet gives a user a public/private keypair
class Wallet {
  public publicKey: string;
  public privateKey: string;

  constructor() {
    const keypair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    this.privateKey = keypair.privateKey;
    this.publicKey = keypair.publicKey;
  }

  sendMoney(amount: number, payeePublicKey: string) {
    const transaction = new Transaction(amount, this.publicKey, payeePublicKey);

    const sign = crypto.createSign('SHA256');
    sign.update(transaction.toString()).end();

    const signature = sign.sign(this.privateKey);
    Chain.instance.addBlock(transaction, this.publicKey, signature);
  }
}

// Example usage

const satoshi = new Wallet();
const bob = new Wallet();
const alice = new Wallet();

satoshi.sendMoney(50, bob.publicKey);
bob.sendMoney(23, alice.publicKey);
alice.sendMoney(5, bob.publicKey);

console.log(Chain.instance);
