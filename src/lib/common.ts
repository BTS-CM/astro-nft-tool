/**
 * Convert human readable quantity into the token's blockchain representation
 * @param {number} satoshis
 * @param {number} precision
 * @returns {number}
 */
function blockchainFloat(satoshis: number, precision: number) {
  return satoshis * 10 ** precision;
}

/**
 * Copy the provided text to the user's clipboard
 * @param {String} text
 */
function copyToClipboard(text: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      console.log("Text copied to clipboard");
    })
    .catch((error) => {
      console.error("Error copying text to clipboard:", error);
    });
}

/**
 * Convert the token's blockchain representation into a human readable quantity
 * @param {number} satoshis
 * @param {number} precision
 * @returns {number}
 */
function humanReadableFloat(satoshis: number, precision: number) {
  return parseFloat((satoshis / 10 ** precision).toFixed(precision));
}

/**
 * Trim market order prices
 * @param {string} price
 * @param {number} precision
 * @returns {number}
 */
function trimPrice(price: string, precision: number) {
  return parseFloat(price).toFixed(precision);
}

/**
 * Convert date time string to time since string
 * @param {string} timestamp
 * @returns
 */
function getTimeSince(timestamp: string) {
  const now = new Date();
  const timeDiff = now.getTime() - new Date(timestamp).getTime();

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);

  let timeSince = "";
  if (days > 0) {
    timeSince += `${days}d `;
  }
  if (hours > 0 || days > 0) {
    timeSince += `${hours}h `;
  }
  timeSince += `${minutes}m`;

  return timeSince;
}

type PermissionFlags = {
  charge_market_fee: number;
  white_list: number;
  override_authority: number;
  transfer_restricted: number;
  disable_force_settle: number;
  global_settle: number;
  disable_confidential: number;
  witness_fed_asset: number;
  committee_fed_asset: number;
  lock_max_supply: number;
  disable_new_supply: number;
  disable_mcr_update: number;
  disable_icr_update: number;
  disable_mssr_update: number;
  disable_bsrm_update: number;
  disable_collateral_bidding: number;
};

const permission_flags: PermissionFlags = {
  charge_market_fee: 0x01,
  white_list: 0x02,
  override_authority: 0x04,
  transfer_restricted: 0x08,
  disable_force_settle: 0x10,
  global_settle: 0x20,
  disable_confidential: 0x40,
  witness_fed_asset: 0x80,
  committee_fed_asset: 0x100,
  lock_max_supply: 0x200,
  disable_new_supply: 0x400,
  disable_mcr_update: 0x800,
  disable_icr_update: 0x1000,
  disable_mssr_update: 0x2000,
  disable_bsrm_update: 0x4000,
  disable_collateral_bidding: 0x8000,
};

const uia_permission_mask: string[] = [
  "charge_market_fee",
  "white_list",
  "override_authority",
  "transfer_restricted",
  "disable_confidential",
];

type FlagBooleans = { [key: string]: boolean };

/**
 * Given flag mask, return an object with booleans indicating which flags are set
 * @param mask The bitmask representing the flags to check.
 * @returns An object with keys as flag names and boolean values indicating if each flag is set.
 */
function getFlagBooleans(mask: number): FlagBooleans {
  const booleans: FlagBooleans = {};

  for (let flag in permission_flags) {
    if (flag in permission_flags) {
      const key = flag as keyof typeof permission_flags;
      if (mask & permission_flags[key]) {
        booleans[key] = true;
      } else {
        booleans[key] = false;
      }
    }
  }

  return booleans;
}

/**
 * Delaying the execution of the function until the user stops typing
 * @param {function} func
 * @param {number} delay
 * @returns {function}
 */
function debounce(func: Function, delay: number) {
  let timerId: any;
  return (...args: any[]) => {
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

/**
 * Checks the current order of the base and quote assets and returns a boolean identifying the order
 * @param {string} _baseID
 * @param {string} _quoteID
 * @returns {boolean}
 */
function isInvertedMarket(_baseID: string, _quoteID: string) {
  const baseID = parseInt(_baseID.split(".")[2], 10);
  const quoteID = parseInt(_quoteID.split(".")[2], 10);
  return baseID > quoteID;
}

export {
  debounce,
  blockchainFloat,
  copyToClipboard,
  humanReadableFloat,
  trimPrice,
  getTimeSince,
  getFlagBooleans,
  isInvertedMarket,
};
