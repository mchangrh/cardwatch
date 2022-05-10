import * as signalR from "@microsoft/signalr";
import * as config from "./config.json"
import { MerchantResponse, Config } from "./types"
import { alert } from "./utils"

const configObj: Config = config

// config
const keepAliveInterval = 30000 // 30 seconds
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
        if (configObj.cards.includes(cardName)) alert(activeMerchant)
        // otherwise log
        else console.log("No alert for", cardName)
      }
    })

// start connections
let connection = new signalR.HubConnectionBuilder()
  .withUrl("https://lostmerchants.com/MerchantHub", {
    skipNegotiation: true,
    transport: signalR.HttpTransportType.WebSockets
  })
  .build();

// hooks
connection.on("UpdateMerchantGroup", getMerchantGroups);

// configuration
connection.serverTimeoutInMilliseconds = 60000 // 1 minute
connection.keepAliveIntervalInMilliseconds = keepAliveInterval

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
      card: { name: 'Thunderwings', rarity: 3 },
      rapport: { name: 'Azenaporium Brooch', rarity: 3 },
      votes: 3
    })
  })
  */

// send keepalive
setInterval(() => connection.invoke("HasNewerClient", 0), keepAliveInterval)