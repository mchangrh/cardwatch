import * as config from "./config.json"
import axios from "axios"
import { ActiveMerchant, CardRarity, Config } from "./types"
import { DateTime } from "luxon";
import * as merchantList from "./merchants.json"

const configObj: Config = config

const rapportEmotes: Record<number, string> = {
  3: "<:epic:973350791995871292>",
  4: "<:legendary:973350820240302180>",
}
const cardEmotes: Record<number, string> = {
  2: "<:rare:973355400403501056>",
  3: "<:epic:973355400424480768>",
  4: "<:legendary:973355400567062608>",
}

export const alert = (merchant: ActiveMerchant) => {
  const zoneURL = configObj.imageHost+encodeURIComponent(merchant.zone)+".jpg"
  //  pull region from config file
  const region = (merchantList as Record<string, any>)[merchant.name].Region
  // leaves on the 55th of every hour
  const leaveTime = DateTime.now().set({minute: 55, second: 0}).toUnixInteger();
  // setup emotes with fallback
  const cardEmote = cardEmotes[merchant.card.rarity] ?? ""
  const rapportEmote = rapportEmotes[merchant.rapport.rarity] ?? ""
  const cardAlert = configObj.roleAlert[merchant.card.name]
  const rapportAlert = configObj.roleAlert.rapport
  // figure out alerts
  let mentions = cardAlert ? `<@&${cardAlert}>` : ""
  if (merchant.card.rarity === CardRarity.Legendary) mentions += `\n This is a Legendary card. [Double check](https://lostmerchants.com/) to make sure it's real.`
  const embed = {
    content: mentions,
    username: "Second Dynasty",
    avatar_url: "https://fs.mchang.icu/pub/dynasty/icon.png",
    embeds: [{
      title: "Travelling Merchant Alert",
      color: 0xb50817,
      fields: [{
        name: "Name",
        value: merchant.name,
        inline: true
      }, {
        name: "Region",
        value: region,
        inline: true
      }, {
        name: "Zone",
        value: merchant.zone,
        inline: true
      }, {
        name: "Card",
        value: `${cardEmote} ${merchant.card.name}`,
        inline: true,
      }, {
        name: "Rapport",
        value: `${rapportEmote} ${merchant.rapport.name}`,
        inline: true
      }, {
        name: "Leaving",
        value: `<t:${leaveTime}:R>`,
        inline: true
      }],
      image: { url: zoneURL },
      footer: {
        text: "Data provided by the contributions made on lostmerchants.com"
      }
    }]
  }
  axios.post(configObj.webhook_url, embed)
}