export type MerchantResponse = {
  id: number,
  server: string,
  merchantName: string,
  activeMerchants: ActiveMerchant[]
}

export type ActiveMerchant = {
  id: string,
  name: string,
  zone: string,
  card: {
    name: string,
    rarity: number
  },
  rapport: {
    name: string,
    rarity: number
  },
  votes: number
}

enum CardRarity {
  Common = 0,
  Uncommon = 1,
  Rare = 2,
  Epic = 3,
  Legendary = 4  
}

export type Config = {
  webhook_url: string,
  imageHost: string,
  cards: string[]
  server: string,
  roleAlert: Record<string, string>
}