<h2 align='center'>@samatech/cadence-lint</h2>

<p align='center'>CLI linter for Cadence projects</p>

<p align='center'>
<a href='https://www.npmjs.com/package/@samatech/cadence-lint'>
  <img src='https://img.shields.io/npm/v/@samatech/cadence-lint?color=222&style=flat-square'>
</a>
</p>

<br>

## Description

A command line linter for [Cadence](https://docs.onflow.org/cadence/language/) (Flow smart contract language). It uses the [Flow CLI](https://github.com/onflow/flow-cli) to start a language server, and passes contracts described via glob pattern.

## Usage

### Install

Install globally

```bash
npm i -g @samatech/cadence-lint
```

Install to local project

```bash
npm i -D @samatech/cadence-lint
```

### Run

Basic usage

```bash
cadence-lint -c "./contracts/**/*.cdc"
```

### Options

| Option       | Abbr. | Default       | Description                                                               |
| ------------ | ----- | ------------- | ------------------------------------------------------------------------- |
| --contracts  | -c    | "./\*_/_.cdc" | Contracts glob, based on [fast-glob](https://github.com/mrmlnc/fast-glob) |
| --configPath | -p    | "./flow.json" | Path to flow.json                                                         |
| --strict     | -s    | -             | Flag that causes the linter to fail when warnings are detected            |
| --help       | -h    | -             | Display usage info                                                        |
| --version    | -v    | -             | Display version info                                                      |
