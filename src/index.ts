import * as signalR from "@microsoft/signalr";
import axios from "axios"

import * as merchantList from "./merchants.json"

// config
const keepAliveInterval = 30000 // 30 seconds
const SERVER = "Inanna"

// helpers

const alert = (merchant: any) => {
  const zoneURL = "https://static.crios.app/ark/"+encodeURIComponent(merchant.zone)+".jpg"
  const region = (merchantList as Record<string, any>)[merchant.name].Region
  const embed = {
    content: "test",
    embeds: [{
      title: "Travelling Merchant",
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
      }],
      image: { url: zoneURL }
    }]
  }
  const WEBHOOK_URL = "https://discord.com/api/webhooks/920486365488111666/j9-t9iA2x_jt8vE5p_S2_yfeI9fN6BF6LRtxXP_cV8mLDRvuCKNslYLiaRM_5pB7xZ-G"
  //axios.post(WEBHOOK_URL, embed)
}

const getMerchantGroups = () =>
  connection.invoke("GetKnownActiveMerchantGroups", SERVER)
    .then(data => {
      console.log("Got alert at", new Date())
      const newest = data[data.length-1].activeMerchants[0]
      const cardName = newest.card.name
      if (cardName === "Seria" || cardName === "Wei") alert(data)
      else console.log("No alert for", cardName)
    })

// start connections
let connection = new signalR.HubConnectionBuilder()
  .withUrl("https://lostmerchants.com/MerchantHub", {
    skipNegotiation: true,
    transport: signalR.HttpTransportType.WebSockets
  })
  .build();

connection.on("UpdateMerchantGroup", getMerchantGroups);

connection.serverTimeoutInMilliseconds = 60000 // 1 minute
connection.keepAliveIntervalInMilliseconds = keepAliveInterval

connection.start()
  .then(() => connection.invoke("SubscribeToServer", SERVER))

// send keepalive
setInterval(() => connection.invoke("HasNewerClient", 0), keepAliveInterval)