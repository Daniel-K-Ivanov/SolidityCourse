pragma solidity ^0.4.19;

contract PokemonGame {

    enum Pokemon { Typhlosion, Rayquaza, Dragonite, Arcanine, Lugia,
        Gengar, Mew, Blastoise, Mewtwo, Charizard }

    mapping(address => uint32[10]) usersPokemons;
    mapping(address => uint) usersLastClaimTimestamp;
    mapping(uint32 => address[]) ownedPokemons;

    event LogPokemonCaught (address indexed user, Pokemon _pokemon);

    modifier isValidPokemon (Pokemon _pokemon) {
        require(uint32(_pokemon) <= 9);
        _;
    }

    modifier canClaimPokemon (Pokemon _pokemon) {
        require(usersPokemons[msg.sender][uint32(_pokemon)] == 0);
        require(now - usersLastClaimTimestamp[msg.sender] > 15 seconds);
        _;
    }

    function PokemonGame () public {
    }

    function claimPokemon(Pokemon _pokemon) public isValidPokemon(_pokemon) canClaimPokemon(_pokemon) {
        usersPokemons[msg.sender][uint32(_pokemon)] = 1;
        usersLastClaimTimestamp[msg.sender] = now;
        ownedPokemons[uint32(_pokemon)].push(msg.sender);
        LogPokemonCaught(msg.sender, _pokemon);
    }

    function listUserPokemons(address user) public view returns (uint32[10]) {
        return usersPokemons[user];
    }

    function listPokemonOwners (Pokemon _pokemon) public view returns (address[]) {
        return ownedPokemons[uint32(_pokemon)];
    }
}
