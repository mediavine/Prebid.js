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
import { registerBidder } from "../src/adapters/bidderFactory.js";
import { getStorageManager } from "../src/storageManager.js";
import { config } from "../src/config.js";
import { logError } from "../src/utils.js";
import { BANNER } from "../src/mediaTypes";
const BIDDER_CODE = `universalBid`;
let mvToken;
const spec = {
  code: BIDDER_CODE,
  supportedMediaTypes: [BANNER],
  isBidRequestValid: (bidRequest) => {
    if (window.$uvbid && window.$uvbid.isBidRequestValid) {
      return window.$uvbid.isBidRequestValid(bidRequest);
    }
    return true;
  },
  buildRequests: (bidRequests, bidderRequest) => {
    if (window.$uvbid && window.$uvbid.buildRequests) {
      return window.$uvbid.buildRequests(bidRequests, bidderRequest);
    }
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
        uuid: mvToken.mv_uuid,
        uuidVersion: mvToken.version,
        network: bidderConfig.network
      }),
      url: `${bidderConfig.domain}/bidRequest`,
      method: "POST",
      options: void 0
    };
  },
  interpretResponse(serverResponse, request) {
    if (window.$uvbid) {
      return window.$uvbid.interpretResponse(serverResponse, request);
    } else {
      const body = serverResponse.body;
      if (typeof body !== "object" || !body.bidResponses || !body.mvTokens) {
        return [];
      }
      mvToken = body.mvTokens;
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
              mediaType: BANNER
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
    }
  },
  getUserSyncs: (syncOptions, response, gdprConsent, uspConsent) => {
    if (window.$uvbid && window.$uvbid.getUserSyncs) {
      return window.$uvbid.getUserSyncs(syncOptions, response, gdprConsent, uspConsent);
    } else {
      const bidderConfig = config.getConfig(BIDDER_CODE);
      let qParams = "";
      qParams += `mv_uuid=${mvToken.mv_uuid}&version=${mvToken.version}&`;
      qParams += `src=${bidderConfig.domain}&`;
      qParams += `origin=${document.location.origin}&`;
      qParams += `us_privacy=${uspConsent}&`;
      qParams += `gdpr_consent=${gdprConsent}&`;
      qParams += `network=${bidderConfig.network}&`;
      return [
        {
          type: "iframe",
          url: `${bidderConfig.domain}/usersync/uvbSync?${qParams}`
        }
      ];
    }
  },
  transformBidParams: (obj) => obj
};
const storage = getStorageManager();
const getMvToken = () => {
  storage.cookiesAreEnabled((enabled) => {
    if (!enabled) {
      return;
    }
    storage.getCookie(`mv_tokens`, (result) => {
      mvToken = mvToken || result;
    });
  });
  storage.localStorageIsEnabled((enabled) => {
    if (!enabled) {
      return;
    }
    storage.getDataFromLocalStorage(`mv_tokens`, (result) => {
      mvToken = mvToken || result;
    });
  });
};
function saveToAll(key, val) {
  storage.cookiesAreEnabled((enabled) => enabled && storage.setCookie(key, val, void 0, void 0, void 0, void 0));
  storage.localStorageIsEnabled((enabled) => enabled && storage.setDataInLocalStorage(key, val, void 0));
}
getMvToken();
registerBidder(spec);
export {
  spec
};
