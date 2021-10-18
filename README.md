# `yulc`: Compile [Yul](https://docs.soliditylang.org/en/v0.8.9/yul.html#yul) into [EVM](https://ethereum.org/en/developers/docs/evm/) bytecode by invoking [`solc`](https://docs.soliditylang.org/en/v0.8.9/yul.html#stand-alone-usage)


```
# Install solc
$ pip install solc-select   # https://github.com/crytic/solc-select
$ solc-select install 0.8.9
$ solc-select use 0.8.9

# Use yulc
$ yulc MyContract.yul       # Output in MyContract.yul.out.json
```

This package implements a `yulc` command that helps you use `solc` as an YUL assembler/compiler in the way described in the ["Yul: Stand-Alone Usage" section](https://docs.soliditylang.org/en/v0.8.9/yul.html#stand-alone-usage) of the solc manual.

# Todo
* Support `solcjs`

