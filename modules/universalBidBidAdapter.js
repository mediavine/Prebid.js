var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __require = typeof require !== "undefined" ? require : (x) => {
  throw new Error('Dynamic require of "' + x + '" is not supported');
};
import { getStorageManager } from "../src/storageManager.js";
import { registerBidder } from "../src/adapters/bidderFactory.js";
import { config } from "../src/config.js";
import { logError } from "../src/utils.js";
var MediaType;
(function(MediaType2) {
  MediaType2["banner"] = "banner";
})(MediaType || (MediaType = {}));
const BIDDER_CODE = "universalBid";
let mvTokens = getFromAll("mv_tokens") || {};
const spec = {
  code: BIDDER_CODE,
  supportedMediaTypes: [MediaType.banner],
  isBidRequestValid: (bidRequest) => {
    return true;
  },
  buildRequests: (bidRequests, bidderRequest) => {
    const bidderConfig = config.getConfig(BIDDER_CODE);
    if (!bidderConfig.network) {
      logError(`
        No network was provided for UniversalBid's Bid Adapter.
        Universal Bid requires a network value assigned to
        a property in the the universalBid config object 
        inside of Prebid's BidderSettings. For example,
        pbjs.bidderSettings.universalBid.network should be 
        your network's name.
      `);
    }
    return {
      data: __spreadProps(__spreadValues({}, bidderRequest), {
        uuid: mvTokens.mv_uuid,
        uuidVersion: mvTokens.version,
        network: bidderConfig.network
      }),
      url: `https://${bidderConfig.domain}/bidRequest`,
      method: "POST",
      options: void 0
    };
  },
  interpretResponse(serverResponse, request) {
    const body = serverResponse.body;
    if (typeof body !== "object" || !body.bidResponses || !body.mvTokens) {
      return [];
    }
    mvTokens = body.mvTokens;
    saveToAll("mv_tokens", JSON.stringify(body.mvTokens));
    const bidResponses = [];
    body.bidResponses.forEach((rtbResponse) => {
      rtbResponse.seatbid.forEach((seatbid) => {
        seatbid.bid.forEach((bid) => {
          if (!bid.adm) {
            return;
          }
          const bidResponse = {
            netRevenue: true,
            currency: "USD",
            mediaType: MediaType.banner
          };
          bidResponse.requestId = bid.impid;
          bidResponse.ad = bid.adm;
          bidResponse.cpm = bid.price;
          bidResponse.height = bid.h;
          bidResponse.width = bid.w;
          bidResponse.ttl = bid.exp;
          bidResponse.creativeId = bid.crid;
          bidResponse.campaignId = bid.cid;
          bidResponses.push(bidResponse);
        });
      });
    });
    return bidResponses;
  },
  getUserSyncs: (syncOptions, response) => {
    const bidderConfig = config.getConfig(BIDDER_CODE);
    let qParams = "";
    qParams += `mv_uuid=${mvTokens.mv_uuid}&version=${mvTokens.version}&`;
    qParams += `src=${bidderConfig.domain}&`;
    qParams += `origin=${document.location.origin}&`;
    qParams += `us_privacy=${"TODO"}&`;
    qParams += `network=${bidderConfig.network}&`;
    return [
      {
        type: "iframe",
        url: `https://${bidderConfig.domain}/usersync/uvbSync?${qParams}`
      }
    ];
  },
  transformBidParams: (obj) => obj
};
function getFromAll(key) {
  let value;
  value = window.document.cookie.match("(^|;)\\s*" + key + "\\s*=\\s*([^;]*)\\s*(;|$)");
  value = value ? decodeURIComponent(value[2]) : null;
  try {
    value = JSON.parse(value);
  } catch (e) {
  }
  return value;
}
function saveToAll(key, val) {
  let storage = getStorageManager();
  if (storage.cookiesAreEnabled()) {
    storage.setCookie(key, val, void 0, void 0, void 0, void 0);
  }
  if (storage.localStorageIsEnabled()) {
    storage.setDataInLocalStorage(key, val, void 0);
  }
}
registerBidder(spec);
export {
  spec
};
