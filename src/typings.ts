export interface Config {
  bot: BotConfig;
  hemisd: HemisdConfig;
  sandboxchannel: string;
}

export interface BotConfig {
  token: string;
  prefix: string;
  debug: boolean;
  intents: string[];
}

export interface HemisdConfig {
  port: number;
  user: string;
  pass: string;
}