Navigate to the repository and run:
```
npm install
```

This will install the node dependencies of the example project, which are a local install of `truffle` and `web3`.

## Running a local blockchain

You need to **navigate to the truffle folder** of the project and run:
```
truffle develop
```

## Running the Pokemons dapp

1. Navigate to the `pokemons_dapp` folder in the project and run:
```node publish_contract.js```

This will run a script that will publish a contract on your local blockchain and print out its address.

2. Edit the `web/script.js` file with the new contract address

3. To host the website, while inside the web folder, run:
```
http-server
```

4. Install MetaMask in chrome

5. Open MetaMask and click the "Import existing DEN"

6. Copy the 12 word key that was printed out when you started your local blockchain.

The 12 words are used to generate the Ethereum accounts that have Ether in your local blockchain. They should be:
```
candy maple cake sugar pudding cream honey rich smooth crumble sweet treat
```

Because every truffle develop session uses the same account set.

7. After you log in to MetaMask with this key, click on the upper left corner and choose "Custom RPC"

8. Enter the URL `http://localhost:9545/` and click save. Go back and you should have successfully connected to your local node!

9. Visit `127.0.0.1:8080` and use the website!
