import { registerBidder } from "../src/adapters/bidderFactory.js";
const spec = {
  code: "UniversalBid",
  isBidRequestValid: (input) => input,
  buildRequests: (bidRequests, bidderRequest) => ({ data: bidRequests, url: "url", method: "POST" }),
  interpretResponse: (input) => input,
  getUserSyncs: () => void 0,
  onBidWon: () => void 0,
  onSetTargeting: () => void 0,
  onTimeout: () => void 0
};
registerBidder(spec);
export {
  spec
};
