# Bot for [Hemis's Discord](https://discord.gg/Gfc5mcwTkM)
(This README will be updated along with bot updates)
Features:

- Tipbot for HMS. Responds to `!tip`.
- Dynamic plugin loading with permission support.



## Requirements

- node > 12.0.x
- yarn
- node-typescript
- Hemisd 1.1.x (https://github.com/Hemis-Blockchain/Hemis)

## Install the prerequisites
### NodeJS & Typescript

Install NodeJS v12 for the Operating system you are running.
[NodeJS Documentation link](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions-enterprise-linux-fedora-and-snap-packages)

```
sudo apt install nodejs-typescript
```
### Install Yarn Globally
```
sudo npm install -g yarn
```
### Download HEMISD
Download the latest 1.1.1 release of Hemisd from the [Github](https://github.com/Hemis-Blockchain/Hemis/releases)

## Installation

Install Hemisd
```
$ unzip ~/Hemis-linux.zip
```
Create a Hemis.conf with rpc info
```
rpcuser=username
rpcpassword=password
daemon=1
server=1
```
Start Hemisd

Create a bot and get the bot's API Token: https://discordapp.com/developers/applications/me - ![](https://i.imgur.com/gM8EpJe.png)

Make sure the bot has "bot" flags in OAuth2

```
$ cd hms-tipbot/config
```
Then
```
$ nano default.json.example
```
Input your bot's token, the channel ID for your bot command channel, and the username & password for Hemisd
.  Then, Rename the configuration file to "default.json" with

```
$ mv default.json.example default.json
```

Then run yarn install from within hms-tipbot directory
```
yarn install
yarn start
```

## License
[MIT](https://github.com/hypermoist/hms-tipbot/blob/master/LICENSE)
