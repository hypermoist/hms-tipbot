import { HemisdConfig } from '../typings';
import config from 'config';
const Bitcoin = require('bitcoin');

let spamchannel: string = config.get('sandboxchannel');
let hemisdConfig: HemisdConfig = config.get('hemisd');
const hemis = new Bitcoin.Client(hemisdConfig);
const helpmsg = {
  embed: {
    description:
      '__**TIPS**__\n\n' +
      '**Balance**: `!tip balance`\n' +
      '**Deposit Address**: `!tip deposit`\n' +
      '**Withdraw**: `!tip withdraw <address> <amount>`\n' +
      '**Private Tip**: `!tip private <user> <amount>`\n\n' +
      '__**ROLE TIPS**__ Use this to tip everyone in a role.\n\n' +
      '**Role Tip**: `!roletip <role> <amount>`\n' +
      '**Private Role Tip**: `!privatetip <role> <amount>`\n\n' +
      '__**MULTI TIPS**__ Use this to tip multiple people at once.\n\n' +
      '**Multi Tip**: `!multitip <user> <user> <amount>`\n' +
      '**Private Multi Tip** `!multitip private <user> <user> <amount>`\n' +
      '**Note**: Multi tips can contain any amount of users to tip.\n\n' +
      '__**FURTHER INFORMATION**__\n\n' +
      '**Help**: `!tip help` *Get this message.\n',
    color: 1109218
  }
};

exports.commands = ['tip', 'multitip', 'roletip', 'tips'];
exports.tip = {
  usage: '<subcommand>',
  description: 'Tip a given user with an amount of HMS or perform wallet specific operations.',
  process: async function(bot, msg, suffix) {
    let tipper = msg.author.id,
      words = msg.content
        .trim()
        .split(/ +/)
        .filter(function(n) {
          return n !== '';
        }),
      subcommand = words.length >= 2 ? words[1] : 'help',
      channelwarning = 'Please use <#' + spamchannel + '> or DMs to talk to bots.',
      MultiorRole = false;
    switch (subcommand) {
      case 'help':
        privateOrSandboxOnly(msg, channelwarning, doHelp, [helpmsg]);
        break;
      case 'balance':
        privateOrSandboxOnly(msg, channelwarning, doBalance, [tipper]);
        break;
      case 'deposit':
        privateOrSandboxOnly(msg, channelwarning, doDeposit, [tipper]);
        break;
      case 'withdraw':
        privateOrSandboxOnly(msg, channelwarning, doWithdraw, [tipper, words, helpmsg]);
        break;
      default:
        doTip(bot, msg, tipper, words, helpmsg, MultiorRole);
    }
  }
};

exports.multitip = {
  usage: '<subcommand>',
  description: 'Tip multiple users simultaneously for the same amount of HMS each.',
  process: async function(bot, msg, suffix) {
    let tipper = msg.author.id.replace('!', ''),
      words = msg.content
        .trim()
        .split(/ +/)
        .filter(function(n) {
          return n !== '';
        }),
      subcommand = words.length >= 2 ? words[1] : 'help',
      channelwarning = 'Please use <#' + spamchannel + '> or DMs to talk to bots.',
      MultiorRole = true;
    switch (subcommand) {
      case 'help':
        privateOrSandboxOnly(msg, channelwarning, doHelp, [helpmsg]);
        break;
      default:
        doMultiTip(bot, msg, tipper, words, helpmsg, MultiorRole);
        break;
    }
  }
};

exports.roletip = {
  usage: '<subcommand>',
  description: 'Tip all users in a specified role an amount of HMS.',
  process: async function(bot, msg, suffix) {
    let tipper = msg.author.id.replace('!', ''),
      words = msg.content
        .trim()
        .split(/ +/)
        .filter(function(n) {
          return n !== '';
        }),
      subcommand = words.length >= 2 ? words[1] : 'help',
      channelwarning = `Please use <#${spamchannel}> or DMs to talk to bots.`,
      MultiorRole = true;
    switch (subcommand) {
      case 'help':
        privateOrSandboxOnly(msg, channelwarning, doHelp, [helpmsg]);
        break;
      default:
        doRoleTip(bot, msg, tipper, words, helpmsg, MultiorRole);
        break;
    }
  }
};

exports.tips = {
  usage: '',
  description: 'Lists all available tipbot commands with brief descriptions for each command.',
  process: async function(bot, msg, suffix) {
    msg.reply(helpmsg);
  }
};

function privateOrSandboxOnly(message, wrongchannelmsg, fn, args) {
  if (!inPrivateOrBotSandbox(message)) {
    message.reply(wrongchannelmsg);
    return;
  }
  fn.apply(null, [message, ...args]);
}

function doHelp(message, helpmsg) {
  message.author.send(helpmsg);
}

async function doBalance(message, tipper) {
  hemis.getBalance(tipper, 1, function(err, balance) {
    if (err) {
      console.error(err);
      message.reply('Error getting balance.').then(message => message.delete({timeout: 5000}));
    } else {
      message.reply(`You have *${balance}* HMS. This may not reflect recent balance changes. Please wait a couple minutes and try again.`);
    }
  });
}

function doDeposit(message, tipper) {
  getAddress(tipper, function(err, address) {
    if (err) {
      console.error(err);
      message.reply('Error getting your deposit address.').then(message => message.delete({timeout: 5000}));
    } else {
      message.reply(`Your address is ${address}`);
    }
  });
}

function doWithdraw(message, tipper, words, helpmsg) {
  if (words.length < 4) {
    return doHelp(message, helpmsg);
  }

  let address = words[2],
    amount = getValidatedAmount(words[3]);

  if (amount === null) {
    message.reply('Invalid amount of credits specified... Cannot withdraw credits.').then(message => message.delete({timeout: 5000}));
    return;
  }

  hemis.sendFrom(tipper, address, amount, function(err, txId) {
    if (err) {
      return message.reply(err.message).then(message => message.delete({timeout: 5000}));
    }
    message.reply(`${amount} HMS has been withdrawn to ${address}.
${txLink(txId)}`);
  });
}

function doTip(bot, message, tipper, words, helpmsg, MultiorRole) {
  if (words.length < 3 || !words) {
    return doHelp(message, helpmsg);
  }

  let prv = false;
  let amountOffset = 2;
  if (words.length >= 4 && words[1] === 'private') {
    prv = true;
    amountOffset = 3;
  }

  let amount = getValidatedAmount(words[amountOffset]);

  if (amount === null) {
    return message.reply('Invalid amount of credits specified...').then(message => message.delete({timeout: 5000}));
  }

  if (message.mentions.users.first() && message.mentions.users.first().id) {
    return sendHMS(bot, message, tipper, message.mentions.users.first().id.replace('!', ''), amount, prv, MultiorRole);
  }
  message.reply('Sorry, I could not find the user you are trying to tip...');
}

function doMultiTip(bot, message, tipper, words, helpmsg, MultiorRole) {
  if (!words) {
    doHelp(message, helpmsg);
    return;
  }
  if (words.length < 4) {
    doTip(bot, message, tipper, words, helpmsg, MultiorRole);
    return;
  }
  let prv = false;
  if (words.length >= 5 && words[1] === 'private') {
    prv = true;
  }
  let [userIDs, amount] = findUserIDsAndAmount(message, words, prv);
  if (amount == null) {
    message.reply('Invalid amount of credits specified...').then(message => message.delete({timeout: 5000}));
    return;
  }
  if (!userIDs.length) {
    message.reply('Sorry, I could not find the user you are trying to tip...').then(message => message.delete({timeout: 5000}));
    return;
  }
  for (let i = 0; i < userIDs.length; i++) {
    sendHMS(bot, message, tipper, userIDs[i].toString(), amount, prv, MultiorRole);
  }
}

function doRoleTip(bot, message, tipper, words, helpmsg, MultiorRole) {
  if (!words || words.length < 3) {
    doHelp(message, helpmsg);
    return;
  }
  let isPrivateTip = words.length >= 4 && words[1] === 'private';
  let amountOffset = isPrivateTip ? 3 : 2;

  let amount = getValidatedAmount(words[amountOffset]);
  if (amount === null) {
    message.reply("I don't know how to tip that amount of HMS...").then(message => message.delete({timeout: 10000}));
    return;
  }

  let roleToTip = message.mentions.roles.first();
  if (roleToTip !== null) {
    let membersOfRole = roleToTip.members.keyArray();
    if (membersOfRole.length > 0) {
      let userIDs = membersOfRole.map(member => member.replace('!', ''));
      userIDs.forEach(u => {
        sendHMS(bot, message, tipper, u, amount, isPrivateTip, MultiorRole);
      });
    } else {
      return message.reply('Sorry, I could not find any users to tip in that role...').then(message => message.delete({timeout: 10000}));
    }
  } else {
    return message.reply('Sorry, I could not find any roles in your tip...').then(message => message.delete({timeout: 10000}));
  }
}

function findUserIDsAndAmount(message, words, prv) {
  let idList = [];
  let amount = null;
  let count = 0;
  let startOffset = 1;
  if (prv) startOffset = 2;
  let regex = new RegExp(/<@!?[0-9]+>/);
  for (let i = startOffset; i < words.length; i++) {
    if (regex.test(words[i])) {
      count++;
      idList.push(words[i].match(/[0-9]+/));
    } else {
      amount = getValidatedAmount(words[Number(count) + 1]);
      break;
    }
  }
  return [idList, amount];
}

function sendHMS(bot, message, tipper, recipient, amount, privacyFlag, MultiorRole) {
  getAddress(recipient.toString(), function(err, address) {
    if (err) {
      message.reply(err.message).then(message => message.delete({timeout: 5000}));
    } else {
      hemis.sendFrom(tipper, address, Number(amount), 1, null, null, function(err, txId) {
        if (err) {
          message.reply(err.message).then(message => message.delete({timeout: 5000}));
        } else {
          let tx = txLink(txId);
          let msgtail = `
DM me with \`!tips\` for all available commands`;
          if (privacyFlag) {
            let usr = message.guild.members.find('id', recipient).user;
            let authmsg = `You have sent a private tip to @${usr.tag} with the amount of ${amount} HMS.
${tx}${msgtail}`;
            message.author.send(authmsg);
            if (message.author.id !== usr.id) {
              let recipientmsg = `You have just been privately tipped ${amount} HMS by @${message.author.tag}.
${tx}${msgtail}`;
              usr.send(recipientmsg);
            }
          } else {
            let generalmsg = `just tipped <@${recipient}> ${amount} HMS.
${tx}${msgtail}`;
            message.reply(generalmsg);
          }
        }
      });
    }
  });
}
function getAddress(userId, cb) {
  hemis.getAddressesByAccount(userId, function(err, addresses) {
    if (err) {
      cb(err);
    } else if (addresses.length > 0) {
      cb(null, addresses[0]);
    } else {
      hemis.getNewAddress(userId, function(err, address) {
        if (err) {
          cb(err);
        } else {
          cb(null, address);
        }
      });
    }
  });
}

function inPrivateOrBotSandbox(msg) {
  return msg.channel.type === 'dm' || msg.channel.id === spamchannel;
}

function getValidatedAmount(amount) {
  amount = amount.toLowerCase().replace('hms', '');
  return amount.match(/^[0-9]+(\.[0-9]+)?$/) ? amount : null;
}

function txLink(txId) {
  return '<https://explorer.hemis.tech/tx/' + txId + '>';
}
