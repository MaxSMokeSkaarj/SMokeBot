export interface Credit {
  amountTotal: number;
  amountPaid: number;
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
  id: string;
  tier: number;
  profit: number;
  timeout: string;
}

export type BusinessShop = Business[];

export interface UserTemplate {
  id: string;
  nick: string;
  money: number;
  workTimeout: string;
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
  taxTimeout: string;
  jackpotTimeout: string;
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

export interface CarShopItem {
  name: string;
  price: number;
}

export type CarShop = CarShopItem[];

export interface HouseShopItem {
  name: string;
  price: number;
}

export type HouseShop = HouseShopItem[];

export interface PetShopItem {
  name: string;
  price: number;
}

export type PetShop = PetShopItem[];

export interface PhoneShopItem {
  name: string;
  price: number;
}

export type PhoneShop = PhoneShopItem[];
