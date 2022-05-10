import * as signalR from "@microsoft/signalr";
import * as config from "./config.json"
import { MerchantResponse, Config, CardRarity } from "./types"
import { alert } from "./utils"

const configObj: Config = config

// config
const keepAliveInterval = 300000 // 5 minutes
const scanned: string[] = []; // scanned merchange entries

// helpers
const getMerchantGroups = () =>
  connection.invoke("GetKnownActiveMerchantGroups", configObj.server)
    .then((data: MerchantResponse[])=> {
      console.log(new Date())
      for (const merchant of data) {
        const activeMerchant = merchant.activeMerchants[0]
        // if already scanned, skip
        if (scanned.includes(activeMerchant.id)) continue
        scanned.push(activeMerchant.id)
        // check against config
        const cardName = activeMerchant.card.name
        // if match, alert
        if (configObj.cards.includes(cardName)) {
          console.log("\tAlert", cardName)
          alert(activeMerchant)
        } else if (activeMerchant.rapport.rarity === CardRarity.Legendary) {
          console.log("\tAlert Legndary Rapport")
        }
        // otherwise log
        else console.log("\tSkipping", cardName)
      }
    })

// start connections
let connection = new signalR.HubConnectionBuilder()
  .withUrl("https://lostmerchants.com/MerchantHub", {
    skipNegotiation: true,
    transport: signalR.HttpTransportType.WebSockets
  })
  .withAutomaticReconnect([
    1000, // 1 second 
    360000, // 6 minutes
    300000, // 5 minutes
    300000, // 5 minutes
    300000, // 5 minutes
  ])
  .build();

// hooks
connection.on("UpdateMerchantGroup", getMerchantGroups);

// configuration
connection.serverTimeoutInMilliseconds = 600000 // 5 minute
connection.keepAliveIntervalInMilliseconds = keepAliveInterval
connection.on("reconnecting", () => {
  console.log("Reconnecting...")
  connection.invoke("SubscribeToServer", configObj.server)
})

connection.start()
  .then(() => connection.invoke("SubscribeToServer", configObj.server))
  .then(() => getMerchantGroups())
  // test alert on startup
  /*
  .then(() => {
    alert({
      id: '4eb2a44f-820b-4530-6ff5-08da316c3c19',
      name: 'Burt',
      zone: 'Leyar Terrace',
      card: { name: 'Seria', rarity: 3 },
      rapport: { name: 'fake', rarity: 4 },
      votes: 3
    })
  })
  */

// send keepalive
setInterval(() => connection.invoke("HasNewerClient", 0), keepAliveInterval)