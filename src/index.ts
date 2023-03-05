import * as signalR from "@microsoft/signalr";
import * as config from "./config.json"
import { MerchantResponse, Config, CardRarity } from "./types"
import { alert } from "./utils"

const configObj: Config = config

// config
const keepAliveInterval = 60000 // 1 minutes
const scanned: string[] = []; // scanned merchange entries

// helpers
const parseMerchantGroup = (merchantGroup: MerchantResponse): void => {
  console.log(new Date())
  const activeMerchant = merchantGroup.activeMerchants[0]
  // if already scanned, skip
  if (scanned.includes(activeMerchant.id)) return
  scanned.push(activeMerchant.id)
  // check against config
  const cardName = activeMerchant.card.name
  // if match, alert
  if (configObj.cards.includes(cardName)) {
    console.log("\tAlert", cardName)
    alert(activeMerchant)
  }
  // otherwise log
  else console.log("\tSkipping", cardName)
}

const start = () => {
  connection.invoke("SubscribeToServer", configObj.server)
  .then(() => connection.invoke("GetKnownActiveMerchantGroups", configObj.server))
  .then((data: MerchantResponse[]): void => data.forEach(merchantGroup => parseMerchantGroup(merchantGroup)))
}

// start connections
let connection = new signalR.HubConnectionBuilder()
  .withUrl("https://lostmerchants.com/MerchantHub", {
    skipNegotiation: true,
    transport: signalR.HttpTransportType.WebSockets
  })
  .withAutomaticReconnect([
    1000, // 1 second
    300000, // 5 minutes
    300000, // 5 minutes
    300000, // 5 minutes
  ])
  .build();

// hooks
connection.on("UpdateMerchantGroup", (data, merchantGroup): void => parseMerchantGroup(merchantGroup));
connection.onreconnected(() => {
  console.log("Reconnected", new Date())
  start()
})

// configuration
connection.serverTimeoutInMilliseconds = 600000 // 5 minute
connection.keepAliveIntervalInMilliseconds = keepAliveInterval

connection.start()
  .then(() => start())
// send keepalive
setInterval(() => {
  connection.invoke("HasNewerClient", 0)
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
}, keepAliveInterval)