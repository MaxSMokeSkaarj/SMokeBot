export interface Credit {
  amountTotal: number;
  amountPaid: number;
  amountLeft: number;
  dailyPayment: string;
  daysLeft: number;
  nextPaymentDate: string;
}

export interface Deposit {
  amount: number;
  startDate: string;
  interestRate: number;
}

export interface Business {
  id: number;
  tier: number;
  income: number;
  timeout: string;
}

export type BusinessShop = Business[];

export interface UserTemplate {
  id: string;
  nick: string;
  money: number;
  workTimeout: string | null;
  jackpotTimeout: string | null;
  taxTimeout: string | null;
  cars: number[];
  houses: number[];
  phones: number[];
  pets: number[];
  buisnesses: Business[];
  credit: Credit[];
  deposit: Deposit[];
  isBotAdmin: boolean;
  isBanned: boolean;
  banReason: string[];
  secret: string;
}

export interface BotContext {
  platform: string;
  send: (text: string) => Promise<void>;
  text: string;
  cmd: string;
  args: string[];
  account: UserTemplate;
  reply?: {
    text?: string | null;
    account?: UserTemplate | null;
  };
}

export interface Command {
  (context: BotContext): Promise<string | void>;
}

export interface ShopItem {
  name: string;
  price?: number | null;
}

export type CarShop = ShopItem[];
export type HouseShop = ShopItem[];
export type PetShop = ShopItem[];
export type PhoneShop = ShopItem[];
