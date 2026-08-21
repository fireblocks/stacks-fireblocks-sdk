var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod2) => function __require() {
  try {
    return mod2 || (0, cb[__getOwnPropNames(cb)[0]])((mod2 = { exports: {} }).exports, mod2), mod2.exports;
  } catch (e) {
    throw mod2 = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod2, isNodeMode, target) => (target = mod2 != null ? __create(__getProtoOf(mod2)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod2 || !mod2.__esModule ? __defProp(target, "default", { value: mod2, enumerable: true }) : target,
  mod2
));
var __toCommonJS = (mod2) => __copyProps(__defProp({}, "__esModule", { value: true }), mod2);

// node_modules/@stacks/common/dist/config.js
var require_config = __commonJS({
  "node_modules/@stacks/common/dist/config.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.config = void 0;
    var config2 = {
      network: {
        layer1: "placeholder"
      },
      logLevel: "debug"
    };
    exports2.config = config2;
  }
});

// node_modules/@stacks/common/dist/errors.js
var require_errors = __commonJS({
  "node_modules/@stacks/common/dist/errors.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.PreconditionFailedError = exports2.PayloadTooLargeError = exports2.ValidationError = exports2.BadPathError = exports2.NotEnoughProofError = exports2.ConflictError = exports2.DoesNotExist = exports2.GaiaHubError = exports2.NoSessionDataError = exports2.InvalidStateError = exports2.FailedDecryptionError = exports2.SignatureVerificationError = exports2.LoginFailedError = exports2.InvalidAmountError = exports2.NotEnoughFundsError = exports2.InvalidDIDError = exports2.RemoteServiceError = exports2.MissingParameterError = exports2.InvalidParameterError = exports2.BlockstackError = exports2.ERROR_CODES = void 0;
    exports2.ERROR_CODES = {
      MISSING_PARAMETER: "missing_parameter",
      REMOTE_SERVICE_ERROR: "remote_service_error",
      INVALID_STATE: "invalid_state",
      NO_SESSION_DATA: "no_session_data",
      DOES_NOT_EXIST: "does_not_exist",
      FAILED_DECRYPTION_ERROR: "failed_decryption_error",
      INVALID_DID_ERROR: "invalid_did_error",
      NOT_ENOUGH_FUNDS_ERROR: "not_enough_error",
      INVALID_AMOUNT_ERROR: "invalid_amount_error",
      LOGIN_FAILED_ERROR: "login_failed",
      SIGNATURE_VERIFICATION_ERROR: "signature_verification_failure",
      CONFLICT_ERROR: "conflict_error",
      NOT_ENOUGH_PROOF_ERROR: "not_enough_proof_error",
      BAD_PATH_ERROR: "bad_path_error",
      VALIDATION_ERROR: "validation_error",
      PAYLOAD_TOO_LARGE_ERROR: "payload_too_large_error",
      PRECONDITION_FAILED_ERROR: "precondition_failed_error",
      UNKNOWN: "unknown"
    };
    Object.freeze(exports2.ERROR_CODES);
    var BlockstackError = class extends Error {
      constructor(error) {
        super();
        let message = error.message;
        let bugDetails = `Error Code: ${error.code}`;
        let stack = this.stack;
        if (!stack) {
          try {
            throw new Error();
          } catch (e) {
            stack = e.stack;
          }
        } else {
          bugDetails += `Stack Trace:
${stack}`;
        }
        message += `
If you believe this exception is caused by a bug in stacks.js,
      please file a bug report: https://github.com/blockstack/stacks.js/issues

${bugDetails}`;
        this.message = message;
        this.code = error.code;
        this.parameter = error.parameter ? error.parameter : void 0;
      }
      toString() {
        return `${super.toString()}
    code: ${this.code} param: ${this.parameter ? this.parameter : "n/a"}`;
      }
    };
    exports2.BlockstackError = BlockstackError;
    var InvalidParameterError = class extends BlockstackError {
      constructor(parameter, message = "") {
        super({ code: exports2.ERROR_CODES.MISSING_PARAMETER, message, parameter });
        this.name = "MissingParametersError";
      }
    };
    exports2.InvalidParameterError = InvalidParameterError;
    var MissingParameterError = class extends BlockstackError {
      constructor(parameter, message = "") {
        super({ code: exports2.ERROR_CODES.MISSING_PARAMETER, message, parameter });
        this.name = "MissingParametersError";
      }
    };
    exports2.MissingParameterError = MissingParameterError;
    var RemoteServiceError = class extends BlockstackError {
      constructor(response, message = "") {
        super({ code: exports2.ERROR_CODES.REMOTE_SERVICE_ERROR, message });
        this.response = response;
      }
    };
    exports2.RemoteServiceError = RemoteServiceError;
    var InvalidDIDError = class extends BlockstackError {
      constructor(message = "") {
        super({ code: exports2.ERROR_CODES.INVALID_DID_ERROR, message });
        this.name = "InvalidDIDError";
      }
    };
    exports2.InvalidDIDError = InvalidDIDError;
    var NotEnoughFundsError = class extends BlockstackError {
      constructor(leftToFund) {
        const message = `Not enough UTXOs to fund. Left to fund: ${leftToFund}`;
        super({ code: exports2.ERROR_CODES.NOT_ENOUGH_FUNDS_ERROR, message });
        this.leftToFund = leftToFund;
        this.name = "NotEnoughFundsError";
        this.message = message;
      }
    };
    exports2.NotEnoughFundsError = NotEnoughFundsError;
    var InvalidAmountError = class extends BlockstackError {
      constructor(fees, specifiedAmount) {
        const message = `Not enough coin to fund fees transaction fees. Fees would be ${fees}, specified spend is  ${specifiedAmount}`;
        super({ code: exports2.ERROR_CODES.INVALID_AMOUNT_ERROR, message });
        this.specifiedAmount = specifiedAmount;
        this.fees = fees;
        this.name = "InvalidAmountError";
        this.message = message;
      }
    };
    exports2.InvalidAmountError = InvalidAmountError;
    var LoginFailedError = class extends BlockstackError {
      constructor(reason) {
        const message = `Failed to login: ${reason}`;
        super({ code: exports2.ERROR_CODES.LOGIN_FAILED_ERROR, message });
        this.message = message;
        this.name = "LoginFailedError";
      }
    };
    exports2.LoginFailedError = LoginFailedError;
    var SignatureVerificationError = class extends BlockstackError {
      constructor(reason) {
        const message = `Failed to verify signature: ${reason}`;
        super({ code: exports2.ERROR_CODES.SIGNATURE_VERIFICATION_ERROR, message });
        this.message = message;
        this.name = "SignatureVerificationError";
      }
    };
    exports2.SignatureVerificationError = SignatureVerificationError;
    var FailedDecryptionError = class extends BlockstackError {
      constructor(message = "Unable to decrypt cipher object.") {
        super({ code: exports2.ERROR_CODES.FAILED_DECRYPTION_ERROR, message });
        this.message = message;
        this.name = "FailedDecryptionError";
      }
    };
    exports2.FailedDecryptionError = FailedDecryptionError;
    var InvalidStateError = class extends BlockstackError {
      constructor(message) {
        super({ code: exports2.ERROR_CODES.INVALID_STATE, message });
        this.message = message;
        this.name = "InvalidStateError";
      }
    };
    exports2.InvalidStateError = InvalidStateError;
    var NoSessionDataError = class extends BlockstackError {
      constructor(message) {
        super({ code: exports2.ERROR_CODES.INVALID_STATE, message });
        this.message = message;
        this.name = "NoSessionDataError";
      }
    };
    exports2.NoSessionDataError = NoSessionDataError;
    var GaiaHubError = class extends BlockstackError {
      constructor(error, response) {
        super(error);
        if (response) {
          this.hubError = {
            statusCode: response.status,
            statusText: response.statusText
          };
          if (typeof response.body === "string") {
            this.hubError.message = response.body;
          } else if (typeof response.body === "object") {
            Object.assign(this.hubError, response.body);
          }
        }
      }
    };
    exports2.GaiaHubError = GaiaHubError;
    var DoesNotExist = class extends GaiaHubError {
      constructor(message, response) {
        super({ message, code: exports2.ERROR_CODES.DOES_NOT_EXIST }, response);
        this.name = "DoesNotExist";
      }
    };
    exports2.DoesNotExist = DoesNotExist;
    var ConflictError = class extends GaiaHubError {
      constructor(message, response) {
        super({ message, code: exports2.ERROR_CODES.CONFLICT_ERROR }, response);
        this.name = "ConflictError";
      }
    };
    exports2.ConflictError = ConflictError;
    var NotEnoughProofError = class extends GaiaHubError {
      constructor(message, response) {
        super({ message, code: exports2.ERROR_CODES.NOT_ENOUGH_PROOF_ERROR }, response);
        this.name = "NotEnoughProofError";
      }
    };
    exports2.NotEnoughProofError = NotEnoughProofError;
    var BadPathError = class extends GaiaHubError {
      constructor(message, response) {
        super({ message, code: exports2.ERROR_CODES.BAD_PATH_ERROR }, response);
        this.name = "BadPathError";
      }
    };
    exports2.BadPathError = BadPathError;
    var ValidationError2 = class extends GaiaHubError {
      constructor(message, response) {
        super({ message, code: exports2.ERROR_CODES.VALIDATION_ERROR }, response);
        this.name = "ValidationError";
      }
    };
    exports2.ValidationError = ValidationError2;
    var PayloadTooLargeError = class extends GaiaHubError {
      constructor(message, response, maxUploadByteSize) {
        super({ message, code: exports2.ERROR_CODES.PAYLOAD_TOO_LARGE_ERROR }, response);
        this.name = "PayloadTooLargeError";
        this.maxUploadByteSize = maxUploadByteSize;
      }
    };
    exports2.PayloadTooLargeError = PayloadTooLargeError;
    var PreconditionFailedError = class extends GaiaHubError {
      constructor(message, response) {
        super({ message, code: exports2.ERROR_CODES.PRECONDITION_FAILED_ERROR }, response);
        this.name = "PreconditionFailedError";
      }
    };
    exports2.PreconditionFailedError = PreconditionFailedError;
  }
});

// node_modules/@stacks/common/dist/logger.js
var require_logger = __commonJS({
  "node_modules/@stacks/common/dist/logger.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Logger = void 0;
    var config_1 = require_config();
    var levels = ["debug", "info", "warn", "error", "none"];
    var levelToInt = {};
    var intToLevel = {};
    for (let index = 0; index < levels.length; index++) {
      const level = levels[index];
      levelToInt[level] = index;
      intToLevel[index] = level;
    }
    var Logger = class {
      static error(message) {
        if (!this.shouldLog("error"))
          return;
        console.error(this.logMessage("error", message));
      }
      static warn(message) {
        if (!this.shouldLog("warn"))
          return;
        console.warn(this.logMessage("warn", message));
      }
      static info(message) {
        if (!this.shouldLog("info"))
          return;
        console.log(this.logMessage("info", message));
      }
      static debug(message) {
        if (!this.shouldLog("debug"))
          return;
        console.log(this.logMessage("debug", message));
      }
      static logMessage(level, message) {
        return `[${level.toUpperCase()}] ${message}`;
      }
      static shouldLog(level) {
        const currentLevel = levelToInt[config_1.config.logLevel];
        return currentLevel <= levelToInt[level];
      }
    };
    exports2.Logger = Logger;
  }
});

// node_modules/@stacks/common/dist/utils.js
var require_utils = __commonJS({
  "node_modules/@stacks/common/dist/utils.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.BLOCKSTACK_HANDLER = void 0;
    exports2.nextYear = nextYear;
    exports2.nextMonth = nextMonth;
    exports2.nextHour = nextHour;
    exports2.megabytesToBytes = megabytesToBytes;
    exports2.getAesCbcOutputLength = getAesCbcOutputLength;
    exports2.getBase64OutputLength = getBase64OutputLength;
    exports2.updateQueryStringParameter = updateQueryStringParameter;
    exports2.isLaterVersion = isLaterVersion;
    exports2.makeUUID4 = makeUUID4;
    exports2.isSameOriginAbsoluteUrl = isSameOriginAbsoluteUrl;
    exports2.getGlobalScope = getGlobalScope;
    exports2.getGlobalObject = getGlobalObject;
    exports2.getGlobalObjects = getGlobalObjects;
    exports2.intToBytes = intToBytes;
    exports2.intToBigInt = intToBigInt;
    exports2.with0x = with0x;
    exports2.without0x = without0x;
    exports2.hexToBigInt = hexToBigInt;
    exports2.intToHex = intToHex;
    exports2.hexToInt = hexToInt;
    exports2.bigIntToBytes = bigIntToBytes;
    exports2.toTwos = toTwos;
    exports2.bytesToTwosBigInt = bytesToTwosBigInt;
    exports2.fromTwos = fromTwos;
    exports2.bytesToHex = bytesToHex4;
    exports2.hexToBytes = hexToBytes4;
    exports2.utf8ToBytes = utf8ToBytes;
    exports2.bytesToUtf8 = bytesToUtf8;
    exports2.asciiToBytes = asciiToBytes2;
    exports2.bytesToAscii = bytesToAscii;
    exports2.octetsToBytes = octetsToBytes;
    exports2.concatBytes = concatBytes4;
    exports2.concatArray = concatArray;
    exports2.isInstance = isInstance;
    exports2.validateHash256 = validateHash256;
    var logger_1 = require_logger();
    exports2.BLOCKSTACK_HANDLER = "blockstack";
    function nextYear() {
      return new Date((/* @__PURE__ */ new Date()).setFullYear((/* @__PURE__ */ new Date()).getFullYear() + 1));
    }
    function nextMonth() {
      return new Date((/* @__PURE__ */ new Date()).setMonth((/* @__PURE__ */ new Date()).getMonth() + 1));
    }
    function nextHour() {
      return new Date((/* @__PURE__ */ new Date()).setHours((/* @__PURE__ */ new Date()).getHours() + 1));
    }
    function megabytesToBytes(megabytes) {
      if (!Number.isFinite(megabytes)) {
        return 0;
      }
      return Math.floor(megabytes * 1024 * 1024);
    }
    function getAesCbcOutputLength(inputByteLength) {
      const cipherTextLength = (Math.floor(inputByteLength / 16) + 1) * 16;
      return cipherTextLength;
    }
    function getBase64OutputLength(inputByteLength) {
      const encodedLength = Math.ceil(inputByteLength / 3) * 4;
      return encodedLength;
    }
    function updateQueryStringParameter(uri, key, value) {
      const re = new RegExp(`([?&])${key}=.*?(&|$)`, "i");
      const separator = uri.indexOf("?") !== -1 ? "&" : "?";
      if (uri.match(re)) {
        return uri.replace(re, `$1${key}=${value}$2`);
      } else {
        return `${uri}${separator}${key}=${value}`;
      }
    }
    function isLaterVersion(v1, v2) {
      if (v1 === void 0 || v1 === "") {
        v1 = "0.0.0";
      }
      if (v2 === void 0 || v1 === "") {
        v2 = "0.0.0";
      }
      const v1tuple = v1.split(".").map((x) => parseInt(x, 10));
      const v2tuple = v2.split(".").map((x) => parseInt(x, 10));
      for (let index = 0; index < v2.length; index++) {
        if (index >= v1.length) {
          v2tuple.push(0);
        }
        if (v1tuple[index] < v2tuple[index]) {
          return false;
        }
      }
      return true;
    }
    function makeUUID4() {
      let d = (/* @__PURE__ */ new Date()).getTime();
      if (typeof performance !== "undefined" && typeof performance.now === "function") {
        d += performance.now();
      }
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === "x" ? r : r & 3 | 8).toString(16);
      });
    }
    function isSameOriginAbsoluteUrl(uri1, uri2) {
      try {
        const parsedUri1 = new URL(uri1);
        const parsedUri2 = new URL(uri2);
        const port1 = parseInt(parsedUri1.port || "0", 10) | 0 || (parsedUri1.protocol === "https:" ? 443 : 80);
        const port2 = parseInt(parsedUri2.port || "0", 10) | 0 || (parsedUri2.protocol === "https:" ? 443 : 80);
        const match2 = {
          scheme: parsedUri1.protocol === parsedUri2.protocol,
          hostname: parsedUri1.hostname === parsedUri2.hostname,
          port: port1 === port2,
          absolute: (uri1.includes("http://") || uri1.includes("https://")) && (uri2.includes("http://") || uri2.includes("https://"))
        };
        return match2.scheme && match2.hostname && match2.port && match2.absolute;
      } catch (error) {
        console.log(error);
        console.log("Parsing error in same URL origin check");
        return false;
      }
    }
    function getGlobalScope() {
      if (typeof self !== "undefined") {
        return self;
      }
      if (typeof window !== "undefined") {
        return window;
      }
      if (typeof global !== "undefined") {
        return global;
      }
      throw new Error("Unexpected runtime environment - no supported global scope (`window`, `self`, `global`) available");
    }
    function getAPIUsageErrorMessage(scopeObject, apiName, usageDesc) {
      if (usageDesc) {
        return `Use of '${usageDesc}' requires \`${apiName}\` which is unavailable on the '${scopeObject}' object within the currently executing environment.`;
      } else {
        return `\`${apiName}\` is unavailable on the '${scopeObject}' object within the currently executing environment.`;
      }
    }
    function getGlobalObject(name, { throwIfUnavailable, usageDesc, returnEmptyObject } = {}) {
      let globalScope = void 0;
      try {
        globalScope = getGlobalScope();
        if (globalScope) {
          const obj = globalScope[name];
          if (obj) {
            return obj;
          }
        }
      } catch (error) {
        logger_1.Logger.error(`Error getting object '${name}' from global scope '${globalScope}': ${error}`);
      }
      if (throwIfUnavailable) {
        const errMsg = getAPIUsageErrorMessage(globalScope, name.toString(), usageDesc);
        logger_1.Logger.error(errMsg);
        throw new Error(errMsg);
      }
      if (returnEmptyObject) {
        return {};
      }
      return void 0;
    }
    function getGlobalObjects(names, { throwIfUnavailable, usageDesc, returnEmptyObject } = {}) {
      let globalScope;
      try {
        globalScope = getGlobalScope();
      } catch (error) {
        logger_1.Logger.error(`Error getting global scope: ${error}`);
        if (throwIfUnavailable) {
          const errMsg = getAPIUsageErrorMessage(globalScope, names[0].toString(), usageDesc);
          logger_1.Logger.error(errMsg);
          throw errMsg;
        } else if (returnEmptyObject) {
          globalScope = {};
        }
      }
      const result = {};
      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        try {
          if (globalScope) {
            const obj = globalScope[name];
            if (obj) {
              result[name] = obj;
            } else if (throwIfUnavailable) {
              const errMsg = getAPIUsageErrorMessage(globalScope, name.toString(), usageDesc);
              logger_1.Logger.error(errMsg);
              throw new Error(errMsg);
            } else if (returnEmptyObject) {
              result[name] = {};
            }
          }
        } catch (error) {
          if (throwIfUnavailable) {
            const errMsg = getAPIUsageErrorMessage(globalScope, name.toString(), usageDesc);
            logger_1.Logger.error(errMsg);
            throw new Error(errMsg);
          }
        }
      }
      return result;
    }
    function intToBytes(value, byteLength) {
      return bigIntToBytes(intToBigInt(value), byteLength);
    }
    function intToBigInt(value) {
      if (typeof value === "bigint")
        return value;
      if (typeof value === "string")
        return BigInt(value);
      if (typeof value === "number") {
        if (!Number.isInteger(value)) {
          throw new RangeError(`Invalid value. Values of type 'number' must be an integer.`);
        }
        if (value > Number.MAX_SAFE_INTEGER) {
          throw new RangeError(`Invalid value. Values of type 'number' must be less than or equal to ${Number.MAX_SAFE_INTEGER}. For larger values, try using a BigInt instead.`);
        }
        return BigInt(value);
      }
      if (isInstance(value, Uint8Array))
        return BigInt(`0x${bytesToHex4(value)}`);
      throw new TypeError(`intToBigInt: Invalid value type. Must be a number, bigint, BigInt-compatible string, or Uint8Array.`);
    }
    function with0x(value) {
      return /^0x/i.test(value) ? value : `0x${value}`;
    }
    function without0x(value) {
      return /^0x/i.test(value) ? value.slice(2) : value;
    }
    function hexToBigInt(hex4) {
      if (typeof hex4 !== "string")
        throw new TypeError(`hexToBigInt: expected string, got ${typeof hex4}`);
      return BigInt(`0x${hex4}`);
    }
    function intToHex(integer, byteLength = 8) {
      const value = typeof integer === "bigint" ? integer : intToBigInt(integer);
      return value.toString(16).padStart(byteLength * 2, "0");
    }
    function hexToInt(hex4) {
      return parseInt(hex4, 16);
    }
    function bigIntToBytes(value, length = 16) {
      const hex4 = intToHex(value, length);
      return hexToBytes4(hex4);
    }
    function toTwos(value, width) {
      if (value < -(BigInt(1) << width - BigInt(1)) || (BigInt(1) << width - BigInt(1)) - BigInt(1) < value) {
        throw `Unable to represent integer in width: ${width}`;
      }
      if (value >= BigInt(0)) {
        return BigInt(value);
      }
      return value + (BigInt(1) << width);
    }
    function nthBit(value, n) {
      return value & BigInt(1) << n;
    }
    function bytesToTwosBigInt(bytes2) {
      return fromTwos(BigInt(`0x${bytesToHex4(bytes2)}`), BigInt(bytes2.byteLength * 8));
    }
    function fromTwos(value, width) {
      if (nthBit(value, width - BigInt(1))) {
        return value - (BigInt(1) << width);
      }
      return value;
    }
    var hexes = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
    function bytesToHex4(uint8a) {
      if (!(uint8a instanceof Uint8Array))
        throw new Error("Uint8Array expected");
      let hex4 = "";
      for (const u of uint8a) {
        hex4 += hexes[u];
      }
      return hex4;
    }
    function hexToBytes4(hex4) {
      if (typeof hex4 !== "string") {
        throw new TypeError(`hexToBytes: expected string, got ${typeof hex4}`);
      }
      hex4 = without0x(hex4);
      hex4 = hex4.length % 2 ? `0${hex4}` : hex4;
      const array2 = new Uint8Array(hex4.length / 2);
      for (let i = 0; i < array2.length; i++) {
        const j = i * 2;
        const hexByte = hex4.slice(j, j + 2);
        const byte = Number.parseInt(hexByte, 16);
        if (Number.isNaN(byte) || byte < 0)
          throw new Error("Invalid byte sequence");
        array2[i] = byte;
      }
      return array2;
    }
    function utf8ToBytes(str2) {
      return new TextEncoder().encode(str2);
    }
    function bytesToUtf8(arr) {
      return new TextDecoder().decode(arr);
    }
    function asciiToBytes2(str2) {
      const byteArray = [];
      for (let i = 0; i < str2.length; i++) {
        byteArray.push(str2.charCodeAt(i) & 255);
      }
      return new Uint8Array(byteArray);
    }
    function bytesToAscii(arr) {
      return String.fromCharCode.apply(null, arr);
    }
    function isNotOctet(octet) {
      return !Number.isInteger(octet) || octet < 0 || octet > 255;
    }
    function octetsToBytes(numbers) {
      if (numbers.some(isNotOctet))
        throw new Error("Some values are invalid bytes.");
      return new Uint8Array(numbers);
    }
    function concatBytes4(...arrays) {
      if (!arrays.every((a) => a instanceof Uint8Array))
        throw new Error("Uint8Array list expected");
      if (arrays.length === 1)
        return arrays[0];
      const length = arrays.reduce((a, arr) => a + arr.length, 0);
      const result = new Uint8Array(length);
      for (let i = 0, pad = 0; i < arrays.length; i++) {
        const arr = arrays[i];
        result.set(arr, pad);
        pad += arr.length;
      }
      return result;
    }
    function concatArray(elements) {
      return concatBytes4(...elements.map((e) => {
        if (typeof e === "number")
          return octetsToBytes([e]);
        if (e instanceof Array)
          return octetsToBytes(e);
        return e;
      }));
    }
    function isInstance(object, clazz) {
      return object instanceof clazz || object?.constructor?.name?.toLowerCase() === clazz.name;
    }
    function validateHash256(hex4) {
      hex4 = without0x(hex4);
      if (hex4.length !== 64)
        return false;
      return /^[0-9a-fA-F]+$/.test(hex4);
    }
  }
});

// node_modules/@stacks/common/dist/constants.js
var require_constants = __commonJS({
  "node_modules/@stacks/common/dist/constants.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.PRIVATE_KEY_BYTES_UNCOMPRESSED = exports2.PRIVATE_KEY_BYTES_COMPRESSED = exports2.GAIA_URL = exports2.DEVNET_URL = exports2.HIRO_TESTNET_URL = exports2.HIRO_MAINNET_URL = void 0;
    exports2.HIRO_MAINNET_URL = "https://api.mainnet.hiro.so";
    exports2.HIRO_TESTNET_URL = "https://api.testnet.hiro.so";
    exports2.DEVNET_URL = "http://localhost:3999";
    exports2.GAIA_URL = "https://hub.blockstack.org";
    exports2.PRIVATE_KEY_BYTES_COMPRESSED = 33;
    exports2.PRIVATE_KEY_BYTES_UNCOMPRESSED = 32;
  }
});

// node_modules/@stacks/common/dist/signatures.js
var require_signatures = __commonJS({
  "node_modules/@stacks/common/dist/signatures.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.parseRecoverableSignatureVrs = parseRecoverableSignatureVrs;
    exports2.signatureVrsToRsv = signatureVrsToRsv2;
    exports2.signatureRsvToVrs = signatureRsvToVrs;
    var utils_1 = require_utils();
    var COORDINATE_BYTES = 32;
    function parseRecoverableSignatureVrs(signature) {
      if (signature.length < COORDINATE_BYTES * 2 * 2 + 1) {
        throw new Error("Invalid signature");
      }
      const recoveryIdHex = signature.slice(0, 2);
      const r = signature.slice(2, 2 + COORDINATE_BYTES * 2);
      const s = signature.slice(2 + COORDINATE_BYTES * 2);
      return {
        recoveryId: (0, utils_1.hexToInt)(recoveryIdHex),
        r,
        s
      };
    }
    function signatureVrsToRsv2(signature) {
      return signature.slice(2) + signature.slice(0, 2);
    }
    function signatureRsvToVrs(signature) {
      return signature.slice(-2) + signature.slice(0, -2);
    }
  }
});

// node_modules/@stacks/common/dist/keys.js
var require_keys = __commonJS({
  "node_modules/@stacks/common/dist/keys.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.privateKeyToBytes = privateKeyToBytes;
    var utils_1 = require_utils();
    function privateKeyToBytes(privateKey) {
      const privateKeyBuffer = typeof privateKey === "string" ? (0, utils_1.hexToBytes)(privateKey) : privateKey;
      if (privateKeyBuffer.length != 32 && privateKeyBuffer.length != 33) {
        throw new Error(`Improperly formatted private-key. Private-key byte length should be 32 or 33. Length provided: ${privateKeyBuffer.length}`);
      }
      if (privateKeyBuffer.length == 33 && privateKeyBuffer[32] !== 1) {
        throw new Error("Improperly formatted private-key. 33 bytes indicate compressed key, but the last byte must be == 01");
      }
      return privateKeyBuffer;
    }
  }
});

// node_modules/@stacks/common/dist/buffer.js
var require_buffer = __commonJS({
  "node_modules/@stacks/common/dist/buffer.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.equals = equals;
    exports2.alloc = alloc;
    exports2.readUInt16BE = readUInt16BE;
    exports2.writeUInt16BE = writeUInt16BE;
    exports2.readUInt8 = readUInt8;
    exports2.writeUInt8 = writeUInt8;
    exports2.readUInt16LE = readUInt16LE;
    exports2.writeUInt16LE = writeUInt16LE;
    exports2.readUInt32BE = readUInt32BE;
    exports2.writeUInt32BE = writeUInt32BE;
    exports2.readUInt32LE = readUInt32LE;
    exports2.writeUInt32LE = writeUInt32LE;
    function equals(a, b) {
      if (a.byteLength !== b.byteLength)
        return false;
      for (let i = 0; i < a.byteLength; i++) {
        if (a[i] !== b[i])
          return false;
      }
      return true;
    }
    function alloc(length, value) {
      const a = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        a[i] = value;
      }
      return a;
    }
    function readUInt16BE(source, offset) {
      return (source[offset + 0] << 8 | source[offset + 1]) >>> 0;
    }
    function writeUInt16BE(destination, value, offset = 0) {
      destination[offset + 0] = value >>> 8;
      destination[offset + 1] = value >>> 0;
      return destination;
    }
    function readUInt8(source, offset) {
      return source[offset];
    }
    function writeUInt8(destination, value, offset = 0) {
      destination[offset] = value;
      return destination;
    }
    function readUInt16LE(source, offset) {
      return source[offset + 0] << 0 >>> 0 | source[offset + 1] << 8 >>> 0;
    }
    function writeUInt16LE(destination, value, offset = 0) {
      destination[offset + 0] = value & 255;
      value >>>= 8;
      destination[offset + 1] = value & 255;
      return destination;
    }
    function readUInt32BE(source, offset) {
      return source[offset] * 2 ** 24 + source[offset + 1] * 2 ** 16 + source[offset + 2] * 2 ** 8 + source[offset + 3];
    }
    function writeUInt32BE(destination, value, offset = 0) {
      destination[offset + 3] = value;
      value >>>= 8;
      destination[offset + 2] = value;
      value >>>= 8;
      destination[offset + 1] = value;
      value >>>= 8;
      destination[offset] = value;
      return destination;
    }
    function readUInt32LE(source, offset) {
      return source[offset + 0] << 0 >>> 0 | source[offset + 1] << 8 >>> 0 | source[offset + 2] << 16 >>> 0 | source[offset + 3] << 24 >>> 0;
    }
    function writeUInt32LE(destination, value, offset = 0) {
      destination[offset + 0] = value & 255;
      value >>>= 8;
      destination[offset + 1] = value & 255;
      value >>>= 8;
      destination[offset + 2] = value & 255;
      value >>>= 8;
      destination[offset + 3] = value & 255;
      return destination;
    }
  }
});

// node_modules/@stacks/common/dist/types.js
var require_types = __commonJS({
  "node_modules/@stacks/common/dist/types.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@stacks/common/dist/fetch.js
var require_fetch = __commonJS({
  "node_modules/@stacks/common/dist/fetch.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.setFetchOptions = exports2.getFetchOptions = void 0;
    exports2.fetchWrapper = fetchWrapper;
    exports2.hostMatches = hostMatches;
    exports2.createApiKeyMiddleware = createApiKeyMiddleware;
    exports2.createFetchFn = createFetchFn;
    var defaultFetchOpts = {
      referrerPolicy: "origin",
      headers: {
        "x-hiro-product": "stacksjs"
      }
    };
    var getFetchOptions = () => {
      return defaultFetchOpts;
    };
    exports2.getFetchOptions = getFetchOptions;
    var setFetchOptions = (ops) => {
      return Object.assign(defaultFetchOpts, ops);
    };
    exports2.setFetchOptions = setFetchOptions;
    async function fetchWrapper(input, init) {
      const fetchOpts = {};
      Object.assign(fetchOpts, defaultFetchOpts, init);
      const fetchResult = await fetch(input, fetchOpts);
      return fetchResult;
    }
    function hostMatches(host, pattern) {
      if (typeof pattern === "string")
        return pattern === host;
      return pattern.exec(host);
    }
    function createApiKeyMiddleware({ apiKey, host = /(.*)api(.*)(\.stacks\.co|\.hiro\.so)$/i, httpHeader = "x-api-key" }) {
      return {
        pre: (context) => {
          const reqUrl = new URL(context.url);
          if (!hostMatches(reqUrl.host, host))
            return;
          const headers = context.init.headers instanceof Headers ? context.init.headers : context.init.headers = new Headers(context.init.headers);
          headers.set(httpHeader, apiKey);
        }
      };
    }
    function argsForCreateFetchFn(args) {
      let fetchLib = fetchWrapper;
      let middlewares = [];
      if (args.length > 0 && typeof args[0] === "function") {
        fetchLib = args.shift();
      }
      if (args.length > 0) {
        middlewares = args;
      }
      return { fetchLib, middlewares };
    }
    function createFetchFn(...args) {
      const { fetchLib, middlewares } = argsForCreateFetchFn(args);
      const fetchFn = async (url, init) => {
        let fetchParams = { url, init: init ?? {} };
        for (const middleware of middlewares) {
          if (typeof middleware.pre === "function") {
            const result = await Promise.resolve(middleware.pre({
              fetch: fetchLib,
              ...fetchParams
            }));
            fetchParams = result ?? fetchParams;
          }
        }
        let response = await fetchLib(fetchParams.url, fetchParams.init);
        for (const middleware of middlewares) {
          if (typeof middleware.post === "function") {
            const result = await Promise.resolve(middleware.post({
              fetch: fetchLib,
              url: fetchParams.url,
              init: fetchParams.init,
              response: response?.clone() ?? response
            }));
            response = result ?? response;
          }
        }
        return response;
      };
      return fetchFn;
    }
  }
});

// node_modules/@stacks/common/dist/index.js
var require_dist = __commonJS({
  "node_modules/@stacks/common/dist/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_config(), exports2);
    __exportStar(require_errors(), exports2);
    __exportStar(require_logger(), exports2);
    __exportStar(require_utils(), exports2);
    __exportStar(require_constants(), exports2);
    __exportStar(require_signatures(), exports2);
    __exportStar(require_keys(), exports2);
    __exportStar(require_buffer(), exports2);
    __exportStar(require_types(), exports2);
    __exportStar(require_fetch(), exports2);
  }
});

// node_modules/@stacks/bitcoin-staking/dist/types.js
var require_types2 = __commonJS({
  "node_modules/@stacks/bitcoin-staking/dist/types.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@stacks/bitcoin-staking/dist/constants.js
var require_constants2 = __commonJS({
  "node_modules/@stacks/bitcoin-staking/dist/constants.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.SEGWIT_V1 = exports2.SEGWIT_V0 = exports2.SegwitPrefix = exports2.SEGWIT_V1_ADDR_PREFIX = exports2.SEGWIT_V0_ADDR_PREFIX = exports2.SEGWIT_ADDR_PREFIXES = exports2.B58_ADDR_PREFIXES = exports2.BitcoinNetworkVersion = exports2.PoXAddressVersion = exports2.RESERVE_RATIO_BPS = exports2.MAX_NUM_CYCLES = exports2.BOND_GAP_CYCLES = exports2.BOND_LENGTH_CYCLES = exports2.POX5_CONTRACT_NAME = void 0;
    exports2.POX5_CONTRACT_NAME = "pox-5";
    exports2.BOND_LENGTH_CYCLES = 12;
    exports2.BOND_GAP_CYCLES = 2;
    exports2.MAX_NUM_CYCLES = 96;
    exports2.RESERVE_RATIO_BPS = 1500;
    var PoXAddressVersion;
    (function(PoXAddressVersion2) {
      PoXAddressVersion2[PoXAddressVersion2["P2PKH"] = 0] = "P2PKH";
      PoXAddressVersion2[PoXAddressVersion2["P2SH"] = 1] = "P2SH";
      PoXAddressVersion2[PoXAddressVersion2["P2SHP2WPKH"] = 2] = "P2SHP2WPKH";
      PoXAddressVersion2[PoXAddressVersion2["P2SHP2WSH"] = 3] = "P2SHP2WSH";
      PoXAddressVersion2[PoXAddressVersion2["P2WPKH"] = 4] = "P2WPKH";
      PoXAddressVersion2[PoXAddressVersion2["P2WSH"] = 5] = "P2WSH";
      PoXAddressVersion2[PoXAddressVersion2["P2TR"] = 6] = "P2TR";
    })(PoXAddressVersion || (exports2.PoXAddressVersion = PoXAddressVersion = {}));
    exports2.BitcoinNetworkVersion = {
      mainnet: { P2PKH: 0, P2SH: 5 },
      testnet: { P2PKH: 111, P2SH: 196 },
      devnet: { P2PKH: 111, P2SH: 196 },
      mocknet: { P2PKH: 111, P2SH: 196 }
    };
    exports2.B58_ADDR_PREFIXES = /^(1|3|m|n|2)/;
    exports2.SEGWIT_ADDR_PREFIXES = /^(bc|tb|bcrt)/i;
    exports2.SEGWIT_V0_ADDR_PREFIX = /^(bc1q|tb1q|bcrt1q)/i;
    exports2.SEGWIT_V1_ADDR_PREFIX = /^(bc1p|tb1p|bcrt1p)/i;
    exports2.SegwitPrefix = {
      mainnet: "bc",
      testnet: "tb",
      devnet: "bcrt",
      mocknet: "bcrt"
    };
    exports2.SEGWIT_V0 = 0;
    exports2.SEGWIT_V1 = 1;
  }
});

// node_modules/@stacks/bitcoin-staking/dist/network.js
var require_network = __commonJS({
  "node_modules/@stacks/bitcoin-staking/dist/network.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.networkNameFrom = networkNameFrom;
    var network_1 = require("@stacks/network");
    function networkNameFrom(network) {
      if (typeof network === "string")
        return network;
      if (network.chainId === network_1.STACKS_MAINNET.chainId)
        return "mainnet";
      if (network.magicBytes === network_1.STACKS_DEVNET.magicBytes)
        return "devnet";
      return "testnet";
    }
  }
});

// node_modules/@noble/curves/utils.js
function abool(value, title = "") {
  if (typeof value !== "boolean") {
    const prefix2 = title && `"${title}" `;
    throw new TypeError(prefix2 + "expected boolean, got type=" + typeof value);
  }
  return value;
}
function abignumber(n) {
  if (typeof n === "bigint") {
    if (!isPosBig(n))
      throw new RangeError("positive bigint expected, got " + n);
  } else
    anumber(n);
  return n;
}
function asafenumber(value, title = "") {
  if (typeof value !== "number") {
    const prefix2 = title && `"${title}" `;
    throw new TypeError(prefix2 + "expected number, got type=" + typeof value);
  }
  if (!Number.isSafeInteger(value)) {
    const prefix2 = title && `"${title}" `;
    throw new RangeError(prefix2 + "expected safe integer, got " + value);
  }
}
function numberToHexUnpadded(num2) {
  const hex4 = abignumber(num2).toString(16);
  return hex4.length & 1 ? "0" + hex4 : hex4;
}
function hexToNumber(hex4) {
  if (typeof hex4 !== "string")
    throw new TypeError("hex string expected, got " + typeof hex4);
  return hex4 === "" ? _0n : BigInt("0x" + hex4);
}
function bytesToNumberBE(bytes2) {
  return hexToNumber((0, import_utils.bytesToHex)(bytes2));
}
function bytesToNumberLE(bytes2) {
  return hexToNumber((0, import_utils.bytesToHex)(copyBytes((0, import_utils.abytes)(bytes2)).reverse()));
}
function numberToBytesBE(n, len) {
  (0, import_utils.anumber)(len);
  if (len === 0)
    throw new RangeError("zero length");
  n = abignumber(n);
  const hex4 = n.toString(16);
  if (hex4.length > len * 2)
    throw new RangeError("number too large");
  return (0, import_utils.hexToBytes)(hex4.padStart(len * 2, "0"));
}
function numberToBytesLE(n, len) {
  return numberToBytesBE(n, len).reverse();
}
function copyBytes(bytes2) {
  return Uint8Array.from(abytes(bytes2));
}
function asciiToBytes(ascii) {
  if (typeof ascii !== "string")
    throw new TypeError("ascii string expected, got " + typeof ascii);
  return Uint8Array.from(ascii, (c, i) => {
    const charCode = c.charCodeAt(0);
    if (c.length !== 1 || charCode > 127) {
      throw new RangeError(`string contains non-ASCII character "${ascii[i]}" with code ${charCode} at position ${i}`);
    }
    return charCode;
  });
}
function inRange(n, min, max) {
  return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
}
function aInRange(title, n, min, max) {
  if (!inRange(n, min, max))
    throw new RangeError("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
}
function bitLen(n) {
  if (n < _0n)
    throw new Error("expected non-negative bigint, got " + n);
  let len;
  for (len = 0; n > _0n; n >>= _1n, len += 1)
    ;
  return len;
}
function createHmacDrbg(hashLen, qByteLen, hmacFn) {
  (0, import_utils.anumber)(hashLen, "hashLen");
  (0, import_utils.anumber)(qByteLen, "qByteLen");
  if (typeof hmacFn !== "function")
    throw new TypeError("hmacFn must be a function");
  const u8n = (len) => new Uint8Array(len);
  const NULL2 = Uint8Array.of();
  const byte0 = Uint8Array.of(0);
  const byte1 = Uint8Array.of(1);
  const _maxDrbgIters = 1e3;
  let v = u8n(hashLen);
  let k = u8n(hashLen);
  let i = 0;
  const reset = () => {
    v.fill(1);
    k.fill(0);
    i = 0;
  };
  const h = (...msgs) => hmacFn(k, concatBytes(v, ...msgs));
  const reseed = (seed = NULL2) => {
    k = h(byte0, seed);
    v = h();
    if (seed.length === 0)
      return;
    k = h(byte1, seed);
    v = h();
  };
  const gen = () => {
    if (i++ >= _maxDrbgIters)
      throw new Error("drbg: tried max amount of iterations");
    let len = 0;
    const out = [];
    while (len < qByteLen) {
      v = h();
      const sl = v.slice();
      out.push(sl);
      len += v.length;
    }
    return concatBytes(...out);
  };
  const genUntil = (seed, pred) => {
    reset();
    reseed(seed);
    let res = void 0;
    while ((res = pred(gen())) === void 0)
      reseed();
    reset();
    return res;
  };
  return genUntil;
}
function validateObject(object, fields = {}, optFields = {}) {
  if (Object.prototype.toString.call(object) !== "[object Object]")
    throw new TypeError("expected valid options object");
  function checkField(fieldName, expectedType, isOpt) {
    if (!isOpt && expectedType !== "function" && !Object.hasOwn(object, fieldName))
      throw new TypeError(`param "${fieldName}" is invalid: expected own property`);
    const val = object[fieldName];
    if (isOpt && val === void 0)
      return;
    const current = typeof val;
    if (current !== expectedType || val === null)
      throw new TypeError(`param "${fieldName}" is invalid: expected ${expectedType}, got ${current}`);
  }
  const iter = (f, isOpt) => Object.entries(f).forEach(([k, v]) => checkField(k, v, isOpt));
  iter(fields, false);
  iter(optFields, true);
}
var import_utils, abytes, anumber, bytesToHex2, concatBytes, hexToBytes2, isBytes, randomBytes, _0n, _1n, isPosBig, bitMask;
var init_utils = __esm({
  "node_modules/@noble/curves/utils.js"() {
    import_utils = require("@noble/hashes/utils.js");
    abytes = (value, length, title) => (0, import_utils.abytes)(value, length, title);
    anumber = import_utils.anumber;
    bytesToHex2 = import_utils.bytesToHex;
    concatBytes = (...arrays) => (0, import_utils.concatBytes)(...arrays);
    hexToBytes2 = (hex4) => (0, import_utils.hexToBytes)(hex4);
    isBytes = import_utils.isBytes;
    randomBytes = (bytesLength) => (0, import_utils.randomBytes)(bytesLength);
    _0n = /* @__PURE__ */ BigInt(0);
    _1n = /* @__PURE__ */ BigInt(1);
    isPosBig = (n) => typeof n === "bigint" && _0n <= n;
    bitMask = (n) => (_1n << BigInt(n)) - _1n;
  }
});

// node_modules/@noble/curves/abstract/modular.js
function mod(a, b) {
  if (b <= _0n2)
    throw new Error("mod: expected positive modulus, got " + b);
  const result = a % b;
  return result >= _0n2 ? result : b + result;
}
function pow2(x, power, modulo) {
  if (power < _0n2)
    throw new Error("pow2: expected non-negative exponent, got " + power);
  let res = x;
  while (power-- > _0n2) {
    res *= res;
    res %= modulo;
  }
  return res;
}
function invert(number, modulo) {
  if (number === _0n2)
    throw new Error("invert: expected non-zero number");
  if (modulo <= _0n2)
    throw new Error("invert: expected positive modulus, got " + modulo);
  let a = mod(number, modulo);
  let b = modulo;
  let x = _0n2, y = _1n2, u = _1n2, v = _0n2;
  while (a !== _0n2) {
    const q = b / a;
    const r = b - a * q;
    const m = x - u * q;
    const n = y - v * q;
    b = a, a = r, x = u, y = v, u = m, v = n;
  }
  const gcd4 = b;
  if (gcd4 !== _1n2)
    throw new Error("invert: does not exist");
  return mod(x, modulo);
}
function assertIsSquare(Fp, root, n) {
  const F = Fp;
  if (!F.eql(F.sqr(root), n))
    throw new Error("Cannot find square root");
}
function sqrt3mod4(Fp, n) {
  const F = Fp;
  const p1div4 = (F.ORDER + _1n2) / _4n;
  const root = F.pow(n, p1div4);
  assertIsSquare(F, root, n);
  return root;
}
function sqrt5mod8(Fp, n) {
  const F = Fp;
  const p5div8 = (F.ORDER - _5n) / _8n;
  const n2 = F.mul(n, _2n);
  const v = F.pow(n2, p5div8);
  const nv = F.mul(n, v);
  const i = F.mul(F.mul(nv, _2n), v);
  const root = F.mul(nv, F.sub(i, F.ONE));
  assertIsSquare(F, root, n);
  return root;
}
function sqrt9mod16(P) {
  const Fp_ = Field(P);
  const tn = tonelliShanks(P);
  const c1 = tn(Fp_, Fp_.neg(Fp_.ONE));
  const c2 = tn(Fp_, c1);
  const c3 = tn(Fp_, Fp_.neg(c1));
  const c4 = (P + _7n) / _16n;
  return ((Fp, n) => {
    const F = Fp;
    let tv1 = F.pow(n, c4);
    let tv2 = F.mul(tv1, c1);
    const tv3 = F.mul(tv1, c2);
    const tv4 = F.mul(tv1, c3);
    const e1 = F.eql(F.sqr(tv2), n);
    const e2 = F.eql(F.sqr(tv3), n);
    tv1 = F.cmov(tv1, tv2, e1);
    tv2 = F.cmov(tv4, tv3, e2);
    const e3 = F.eql(F.sqr(tv2), n);
    const root = F.cmov(tv1, tv2, e3);
    assertIsSquare(F, root, n);
    return root;
  });
}
function tonelliShanks(P) {
  if (P < _3n)
    throw new Error("sqrt is not defined for small field");
  let Q = P - _1n2;
  let S = 0;
  while (Q % _2n === _0n2) {
    Q /= _2n;
    S++;
  }
  let Z = _2n;
  const _Fp = Field(P);
  while (FpLegendre(_Fp, Z) === 1) {
    if (Z++ > 1e3)
      throw new Error("Cannot find square root: probably non-prime P");
  }
  if (S === 1)
    return sqrt3mod4;
  let cc = _Fp.pow(Z, Q);
  const Q1div2 = (Q + _1n2) / _2n;
  return function tonelliSlow(Fp, n) {
    const F = Fp;
    if (F.is0(n))
      return n;
    if (FpLegendre(F, n) !== 1)
      throw new Error("Cannot find square root");
    let M = S;
    let c = F.mul(F.ONE, cc);
    let t = F.pow(n, Q);
    let R = F.pow(n, Q1div2);
    while (!F.eql(t, F.ONE)) {
      if (F.is0(t))
        return F.ZERO;
      let i = 1;
      let t_tmp = F.sqr(t);
      while (!F.eql(t_tmp, F.ONE)) {
        i++;
        t_tmp = F.sqr(t_tmp);
        if (i === M)
          throw new Error("Cannot find square root");
      }
      const exponent = _1n2 << BigInt(M - i - 1);
      const b = F.pow(c, exponent);
      M = i;
      c = F.sqr(b);
      t = F.mul(t, c);
      R = F.mul(R, b);
    }
    return R;
  };
}
function FpSqrt(P) {
  if (P % _4n === _3n)
    return sqrt3mod4;
  if (P % _8n === _5n)
    return sqrt5mod8;
  if (P % _16n === _9n)
    return sqrt9mod16(P);
  return tonelliShanks(P);
}
function validateField(field) {
  const initial = {
    ORDER: "bigint",
    BYTES: "number",
    BITS: "number"
  };
  const opts = FIELD_FIELDS.reduce((map, val) => {
    map[val] = "function";
    return map;
  }, initial);
  validateObject(field, opts);
  asafenumber(field.BYTES, "BYTES");
  asafenumber(field.BITS, "BITS");
  if (field.BYTES < 1 || field.BITS < 1)
    throw new Error("invalid field: expected BYTES/BITS > 0");
  if (field.ORDER <= _1n2)
    throw new Error("invalid field: expected ORDER > 1, got " + field.ORDER);
  return field;
}
function FpPow(Fp, num2, power) {
  const F = Fp;
  if (power < _0n2)
    throw new Error("invalid exponent, negatives unsupported");
  if (power === _0n2)
    return F.ONE;
  if (power === _1n2)
    return num2;
  let p = F.ONE;
  let d = num2;
  while (power > _0n2) {
    if (power & _1n2)
      p = F.mul(p, d);
    d = F.sqr(d);
    power >>= _1n2;
  }
  return p;
}
function FpInvertBatch(Fp, nums, passZero = false) {
  const F = Fp;
  const inverted = new Array(nums.length).fill(passZero ? F.ZERO : void 0);
  const multipliedAcc = nums.reduce((acc, num2, i) => {
    if (F.is0(num2))
      return acc;
    inverted[i] = acc;
    return F.mul(acc, num2);
  }, F.ONE);
  const invertedAcc = F.inv(multipliedAcc);
  nums.reduceRight((acc, num2, i) => {
    if (F.is0(num2))
      return acc;
    inverted[i] = F.mul(acc, inverted[i]);
    return F.mul(acc, num2);
  }, invertedAcc);
  return inverted;
}
function FpLegendre(Fp, n) {
  const F = Fp;
  const p1mod2 = (F.ORDER - _1n2) / _2n;
  const powered = F.pow(n, p1mod2);
  const yes = F.eql(powered, F.ONE);
  const zero = F.eql(powered, F.ZERO);
  const no = F.eql(powered, F.neg(F.ONE));
  if (!yes && !zero && !no)
    throw new Error("invalid Legendre symbol result");
  return yes ? 1 : zero ? 0 : -1;
}
function nLength(n, nBitLength) {
  if (nBitLength !== void 0)
    anumber(nBitLength);
  if (n <= _0n2)
    throw new Error("invalid n length: expected positive n, got " + n);
  if (nBitLength !== void 0 && nBitLength < 1)
    throw new Error("invalid n length: expected positive bit length, got " + nBitLength);
  const bits = bitLen(n);
  if (nBitLength !== void 0 && nBitLength < bits)
    throw new Error(`invalid n length: expected bit length (${bits}) >= n.length (${nBitLength})`);
  const _nBitLength = nBitLength !== void 0 ? nBitLength : bits;
  const nByteLength = Math.ceil(_nBitLength / 8);
  return { nBitLength: _nBitLength, nByteLength };
}
function Field(ORDER, opts = {}) {
  return new _Field(ORDER, opts);
}
function getFieldBytesLength(fieldOrder) {
  if (typeof fieldOrder !== "bigint")
    throw new Error("field order must be bigint");
  if (fieldOrder <= _1n2)
    throw new Error("field order must be greater than 1");
  const bitLength = bitLen(fieldOrder - _1n2);
  return Math.ceil(bitLength / 8);
}
function getMinHashLength(fieldOrder) {
  const length = getFieldBytesLength(fieldOrder);
  return length + Math.ceil(length / 2);
}
function mapHashToField(key, fieldOrder, isLE = false) {
  abytes(key);
  const len = key.length;
  const fieldLen = getFieldBytesLength(fieldOrder);
  const minLen = Math.max(getMinHashLength(fieldOrder), 16);
  if (len < minLen || len > 1024)
    throw new Error("expected " + minLen + "-1024 bytes of input, got " + len);
  const num2 = isLE ? bytesToNumberLE(key) : bytesToNumberBE(key);
  const reduced = mod(num2, fieldOrder - _1n2) + _1n2;
  return isLE ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
}
var _0n2, _1n2, _2n, _3n, _4n, _5n, _7n, _8n, _9n, _16n, FIELD_FIELDS, FIELD_SQRT, _Field;
var init_modular = __esm({
  "node_modules/@noble/curves/abstract/modular.js"() {
    init_utils();
    _0n2 = /* @__PURE__ */ BigInt(0);
    _1n2 = /* @__PURE__ */ BigInt(1);
    _2n = /* @__PURE__ */ BigInt(2);
    _3n = /* @__PURE__ */ BigInt(3);
    _4n = /* @__PURE__ */ BigInt(4);
    _5n = /* @__PURE__ */ BigInt(5);
    _7n = /* @__PURE__ */ BigInt(7);
    _8n = /* @__PURE__ */ BigInt(8);
    _9n = /* @__PURE__ */ BigInt(9);
    _16n = /* @__PURE__ */ BigInt(16);
    FIELD_FIELDS = [
      "create",
      "isValid",
      "is0",
      "neg",
      "inv",
      "sqrt",
      "sqr",
      "eql",
      "add",
      "sub",
      "mul",
      "pow",
      "div",
      "addN",
      "subN",
      "mulN",
      "sqrN"
    ];
    FIELD_SQRT = /* @__PURE__ */ new WeakMap();
    _Field = class {
      ORDER;
      BITS;
      BYTES;
      isLE;
      ZERO = _0n2;
      ONE = _1n2;
      _lengths;
      _mod;
      constructor(ORDER, opts = {}) {
        if (ORDER <= _1n2)
          throw new Error("invalid field: expected ORDER > 1, got " + ORDER);
        let _nbitLength = void 0;
        this.isLE = false;
        if (opts != null && typeof opts === "object") {
          if (typeof opts.BITS === "number")
            _nbitLength = opts.BITS;
          if (typeof opts.sqrt === "function")
            Object.defineProperty(this, "sqrt", { value: opts.sqrt, enumerable: true });
          if (typeof opts.isLE === "boolean")
            this.isLE = opts.isLE;
          if (opts.allowedLengths)
            this._lengths = Object.freeze(opts.allowedLengths.slice());
          if (typeof opts.modFromBytes === "boolean")
            this._mod = opts.modFromBytes;
        }
        const { nBitLength, nByteLength } = nLength(ORDER, _nbitLength);
        if (nByteLength > 2048)
          throw new Error("invalid field: expected ORDER of <= 2048 bytes");
        this.ORDER = ORDER;
        this.BITS = nBitLength;
        this.BYTES = nByteLength;
        Object.freeze(this);
      }
      create(num2) {
        return mod(num2, this.ORDER);
      }
      isValid(num2) {
        if (typeof num2 !== "bigint")
          throw new TypeError("invalid field element: expected bigint, got " + typeof num2);
        return _0n2 <= num2 && num2 < this.ORDER;
      }
      is0(num2) {
        return num2 === _0n2;
      }
      // is valid and invertible
      isValidNot0(num2) {
        return !this.is0(num2) && this.isValid(num2);
      }
      isOdd(num2) {
        return (num2 & _1n2) === _1n2;
      }
      neg(num2) {
        return mod(-num2, this.ORDER);
      }
      eql(lhs, rhs) {
        return lhs === rhs;
      }
      sqr(num2) {
        return mod(num2 * num2, this.ORDER);
      }
      add(lhs, rhs) {
        return mod(lhs + rhs, this.ORDER);
      }
      sub(lhs, rhs) {
        return mod(lhs - rhs, this.ORDER);
      }
      mul(lhs, rhs) {
        return mod(lhs * rhs, this.ORDER);
      }
      pow(num2, power) {
        return FpPow(this, num2, power);
      }
      div(lhs, rhs) {
        return mod(lhs * invert(rhs, this.ORDER), this.ORDER);
      }
      // Same as above, but doesn't normalize
      sqrN(num2) {
        return num2 * num2;
      }
      addN(lhs, rhs) {
        return lhs + rhs;
      }
      subN(lhs, rhs) {
        return lhs - rhs;
      }
      mulN(lhs, rhs) {
        return lhs * rhs;
      }
      inv(num2) {
        return invert(num2, this.ORDER);
      }
      sqrt(num2) {
        let sqrt = FIELD_SQRT.get(this);
        if (!sqrt)
          FIELD_SQRT.set(this, sqrt = FpSqrt(this.ORDER));
        return sqrt(this, num2);
      }
      toBytes(num2) {
        return this.isLE ? numberToBytesLE(num2, this.BYTES) : numberToBytesBE(num2, this.BYTES);
      }
      fromBytes(bytes2, skipValidation = false) {
        abytes(bytes2);
        const { _lengths: allowedLengths, BYTES, isLE, ORDER, _mod: modFromBytes } = this;
        if (allowedLengths) {
          if (bytes2.length < 1 || !allowedLengths.includes(bytes2.length) || bytes2.length > BYTES) {
            throw new Error("Field.fromBytes: expected " + allowedLengths + " bytes, got " + bytes2.length);
          }
          const padded = new Uint8Array(BYTES);
          padded.set(bytes2, isLE ? 0 : padded.length - bytes2.length);
          bytes2 = padded;
        }
        if (bytes2.length !== BYTES)
          throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes2.length);
        let scalar = isLE ? bytesToNumberLE(bytes2) : bytesToNumberBE(bytes2);
        if (modFromBytes)
          scalar = mod(scalar, ORDER);
        if (!skipValidation) {
          if (!this.isValid(scalar))
            throw new Error("invalid field element: outside of range 0..ORDER");
        }
        return scalar;
      }
      // TODO: we don't need it here, move out to separate fn
      invertBatch(lst) {
        return FpInvertBatch(this, lst);
      }
      // We can't move this out because Fp6, Fp12 implement it
      // and it's unclear what to return in there.
      cmov(a, b, condition) {
        abool(condition, "condition");
        return condition ? b : a;
      }
    };
    Object.freeze(_Field.prototype);
  }
});

// node_modules/@noble/curves/abstract/curve.js
function negateCt(condition, item) {
  const neg = item.negate();
  return condition ? neg : item;
}
function normalizeZ(c, points) {
  const invertedZs = FpInvertBatch(c.Fp, points.map((p) => p.Z));
  return points.map((p, i) => c.fromAffine(p.toAffine(invertedZs[i])));
}
function validateW(W, bits) {
  if (!Number.isSafeInteger(W) || W <= 0 || W > bits)
    throw new Error("invalid window size, expected [1.." + bits + "], got W=" + W);
}
function calcWOpts(W, scalarBits) {
  validateW(W, scalarBits);
  const windows = Math.ceil(scalarBits / W) + 1;
  const windowSize = 2 ** (W - 1);
  const maxNumber = 2 ** W;
  const mask = bitMask(W);
  const shiftBy = BigInt(W);
  return { windows, windowSize, mask, maxNumber, shiftBy };
}
function calcOffsets(n, window2, wOpts) {
  const { windowSize, mask, maxNumber, shiftBy } = wOpts;
  let wbits = Number(n & mask);
  let nextN = n >> shiftBy;
  if (wbits > windowSize) {
    wbits -= maxNumber;
    nextN += _1n3;
  }
  const offsetStart = window2 * windowSize;
  const offset = offsetStart + Math.abs(wbits) - 1;
  const isZero = wbits === 0;
  const isNeg = wbits < 0;
  const isNegF = window2 % 2 !== 0;
  const offsetF = offsetStart;
  return { nextN, offset, isZero, isNeg, isNegF, offsetF };
}
function getW(P) {
  return pointWindowSizes.get(P) || 1;
}
function assert0(n) {
  if (n !== _0n3)
    throw new Error("invalid wNAF");
}
function mulEndoUnsafe(Point2, point, k1, k2) {
  let acc = point;
  let p1 = Point2.ZERO;
  let p2 = Point2.ZERO;
  while (k1 > _0n3 || k2 > _0n3) {
    if (k1 & _1n3)
      p1 = p1.add(acc);
    if (k2 & _1n3)
      p2 = p2.add(acc);
    acc = acc.double();
    k1 >>= _1n3;
    k2 >>= _1n3;
  }
  return { p1, p2 };
}
function createField(order, field, isLE) {
  if (field) {
    if (field.ORDER !== order)
      throw new Error("Field.ORDER must match order: Fp == p, Fn == n");
    validateField(field);
    return field;
  } else {
    return Field(order, { isLE });
  }
}
function createCurveFields(type, CURVE, curveOpts = {}, FpFnLE) {
  if (FpFnLE === void 0)
    FpFnLE = type === "edwards";
  if (!CURVE || typeof CURVE !== "object")
    throw new Error(`expected valid ${type} CURVE object`);
  for (const p of ["p", "n", "h"]) {
    const val = CURVE[p];
    if (!(typeof val === "bigint" && val > _0n3))
      throw new Error(`CURVE.${p} must be positive bigint`);
  }
  const Fp = createField(CURVE.p, curveOpts.Fp, FpFnLE);
  const Fn2 = createField(CURVE.n, curveOpts.Fn, FpFnLE);
  const _b = type === "weierstrass" ? "b" : "d";
  const params = ["Gx", "Gy", "a", _b];
  for (const p of params) {
    if (!Fp.isValid(CURVE[p]))
      throw new Error(`CURVE.${p} must be valid field element of CURVE.Fp`);
  }
  CURVE = Object.freeze(Object.assign({}, CURVE));
  return { CURVE, Fp, Fn: Fn2 };
}
function createKeygen(randomSecretKey, getPublicKey) {
  return function keygen(seed) {
    const secretKey = randomSecretKey(seed);
    return { secretKey, publicKey: getPublicKey(secretKey) };
  };
}
var _0n3, _1n3, pointPrecomputes, pointWindowSizes, wNAF;
var init_curve = __esm({
  "node_modules/@noble/curves/abstract/curve.js"() {
    init_utils();
    init_modular();
    _0n3 = /* @__PURE__ */ BigInt(0);
    _1n3 = /* @__PURE__ */ BigInt(1);
    pointPrecomputes = /* @__PURE__ */ new WeakMap();
    pointWindowSizes = /* @__PURE__ */ new WeakMap();
    wNAF = class {
      BASE;
      ZERO;
      Fn;
      bits;
      // Parametrized with a given Point class (not individual point)
      constructor(Point2, bits) {
        this.BASE = Point2.BASE;
        this.ZERO = Point2.ZERO;
        this.Fn = Point2.Fn;
        this.bits = bits;
      }
      // non-const time multiplication ladder
      _unsafeLadder(elm, n, p = this.ZERO) {
        let d = elm;
        while (n > _0n3) {
          if (n & _1n3)
            p = p.add(d);
          d = d.double();
          n >>= _1n3;
        }
        return p;
      }
      /**
       * Creates a wNAF precomputation window. Used for caching.
       * Default window size is set by `utils.precompute()` and is equal to 8.
       * Number of precomputed points depends on the curve size:
       * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
       * - 𝑊 is the window size
       * - 𝑛 is the bitlength of the curve order.
       * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
       * @param point - Point instance
       * @param W - window size
       * @returns precomputed point tables flattened to a single array
       */
      precomputeWindow(point, W) {
        const { windows, windowSize } = calcWOpts(W, this.bits);
        const points = [];
        let p = point;
        let base = p;
        for (let window2 = 0; window2 < windows; window2++) {
          base = p;
          points.push(base);
          for (let i = 1; i < windowSize; i++) {
            base = base.add(p);
            points.push(base);
          }
          p = base.double();
        }
        return points;
      }
      /**
       * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
       * More compact implementation:
       * https://github.com/paulmillr/noble-secp256k1/blob/47cb1669b6e506ad66b35fe7d76132ae97465da2/index.ts#L502-L541
       * @returns real and fake (for const-time) points
       */
      wNAF(W, precomputes, n) {
        if (!this.Fn.isValid(n))
          throw new Error("invalid scalar");
        let p = this.ZERO;
        let f = this.BASE;
        const wo = calcWOpts(W, this.bits);
        for (let window2 = 0; window2 < wo.windows; window2++) {
          const { nextN, offset, isZero, isNeg, isNegF, offsetF } = calcOffsets(n, window2, wo);
          n = nextN;
          if (isZero) {
            f = f.add(negateCt(isNegF, precomputes[offsetF]));
          } else {
            p = p.add(negateCt(isNeg, precomputes[offset]));
          }
        }
        assert0(n);
        return { p, f };
      }
      /**
       * Implements unsafe EC multiplication using precomputed tables
       * and w-ary non-adjacent form.
       * @param acc - accumulator point to add result of multiplication
       * @returns point
       */
      wNAFUnsafe(W, precomputes, n, acc = this.ZERO) {
        const wo = calcWOpts(W, this.bits);
        for (let window2 = 0; window2 < wo.windows; window2++) {
          if (n === _0n3)
            break;
          const { nextN, offset, isZero, isNeg } = calcOffsets(n, window2, wo);
          n = nextN;
          if (isZero) {
            continue;
          } else {
            const item = precomputes[offset];
            acc = acc.add(isNeg ? item.negate() : item);
          }
        }
        assert0(n);
        return acc;
      }
      getPrecomputes(W, point, transform) {
        let comp = pointPrecomputes.get(point);
        if (!comp) {
          comp = this.precomputeWindow(point, W);
          if (W !== 1) {
            if (typeof transform === "function")
              comp = transform(comp);
            pointPrecomputes.set(point, comp);
          }
        }
        return comp;
      }
      cached(point, scalar, transform) {
        const W = getW(point);
        return this.wNAF(W, this.getPrecomputes(W, point, transform), scalar);
      }
      unsafe(point, scalar, transform, prev) {
        const W = getW(point);
        if (W === 1)
          return this._unsafeLadder(point, scalar, prev);
        return this.wNAFUnsafe(W, this.getPrecomputes(W, point, transform), scalar, prev);
      }
      // We calculate precomputes for elliptic curve point multiplication
      // using windowed method. This specifies window size and
      // stores precomputed values. Usually only base point would be precomputed.
      createCache(P, W) {
        validateW(W, this.bits);
        pointWindowSizes.set(P, W);
        pointPrecomputes.delete(P);
      }
      hasCache(elm) {
        return getW(elm) !== 1;
      }
    };
  }
});

// node_modules/@noble/curves/abstract/weierstrass.js
function _splitEndoScalar(k, basis, n) {
  aInRange("scalar", k, _0n4, n);
  const [[a1, b1], [a2, b2]] = basis;
  const c1 = divNearest(b2 * k, n);
  const c2 = divNearest(-b1 * k, n);
  let k1 = k - c1 * a1 - c2 * a2;
  let k2 = -c1 * b1 - c2 * b2;
  const k1neg = k1 < _0n4;
  const k2neg = k2 < _0n4;
  if (k1neg)
    k1 = -k1;
  if (k2neg)
    k2 = -k2;
  const MAX_NUM = bitMask(Math.ceil(bitLen(n) / 2)) + _1n4;
  if (k1 < _0n4 || k1 >= MAX_NUM || k2 < _0n4 || k2 >= MAX_NUM) {
    throw new Error("splitScalar (endomorphism): failed for k");
  }
  return { k1neg, k1, k2neg, k2 };
}
function validateSigFormat(format) {
  if (!["compact", "recovered", "der"].includes(format))
    throw new Error('Signature format must be "compact", "recovered", or "der"');
  return format;
}
function validateSigOpts(opts, def2) {
  validateObject(opts);
  const optsn = {};
  for (let optName of Object.keys(def2)) {
    optsn[optName] = opts[optName] === void 0 ? def2[optName] : opts[optName];
  }
  abool(optsn.lowS, "lowS");
  abool(optsn.prehash, "prehash");
  if (optsn.format !== void 0)
    validateSigFormat(optsn.format);
  return optsn;
}
function weierstrass(params, extraOpts = {}) {
  const validated = createCurveFields("weierstrass", params, extraOpts);
  const Fp = validated.Fp;
  const Fn2 = validated.Fn;
  let CURVE = validated.CURVE;
  const { h: cofactor, n: CURVE_ORDER2 } = CURVE;
  validateObject(extraOpts, {}, {
    allowInfinityPoint: "boolean",
    clearCofactor: "function",
    isTorsionFree: "function",
    fromBytes: "function",
    toBytes: "function",
    endo: "object"
  });
  const { endo, allowInfinityPoint } = extraOpts;
  if (endo) {
    if (!Fp.is0(CURVE.a) || typeof endo.beta !== "bigint" || !Array.isArray(endo.basises)) {
      throw new Error('invalid endo: expected "beta": bigint and "basises": array');
    }
  }
  const lengths = getWLengths(Fp, Fn2);
  function assertCompressionIsSupported() {
    if (!Fp.isOdd)
      throw new Error("compression is not supported: Field does not have .isOdd()");
  }
  function pointToBytes2(_c, point, isCompressed) {
    if (allowInfinityPoint && point.is0())
      return Uint8Array.of(0);
    const { x, y } = point.toAffine();
    const bx = Fp.toBytes(x);
    abool(isCompressed, "isCompressed");
    if (isCompressed) {
      assertCompressionIsSupported();
      const hasEvenY = !Fp.isOdd(y);
      return concatBytes(pprefix(hasEvenY), bx);
    } else {
      return concatBytes(Uint8Array.of(4), bx, Fp.toBytes(y));
    }
  }
  function pointFromBytes(bytes2) {
    abytes(bytes2, void 0, "Point");
    const { publicKey: comp, publicKeyUncompressed: uncomp } = lengths;
    const length = bytes2.length;
    const head = bytes2[0];
    const tail = bytes2.subarray(1);
    if (allowInfinityPoint && length === 1 && head === 0)
      return { x: Fp.ZERO, y: Fp.ZERO };
    if (length === comp && (head === 2 || head === 3)) {
      const x = Fp.fromBytes(tail);
      if (!Fp.isValid(x))
        throw new Error("bad point: is not on curve, wrong x");
      const y2 = weierstrassEquation(x);
      let y;
      try {
        y = Fp.sqrt(y2);
      } catch (sqrtError) {
        const err = sqrtError instanceof Error ? ": " + sqrtError.message : "";
        throw new Error("bad point: is not on curve, sqrt error" + err);
      }
      assertCompressionIsSupported();
      const evenY = Fp.isOdd(y);
      const evenH = (head & 1) === 1;
      if (evenH !== evenY)
        y = Fp.neg(y);
      return { x, y };
    } else if (length === uncomp && head === 4) {
      const L = Fp.BYTES;
      const x = Fp.fromBytes(tail.subarray(0, L));
      const y = Fp.fromBytes(tail.subarray(L, L * 2));
      if (!isValidXY(x, y))
        throw new Error("bad point: is not on curve");
      return { x, y };
    } else {
      throw new Error(`bad point: got length ${length}, expected compressed=${comp} or uncompressed=${uncomp}`);
    }
  }
  const encodePoint = extraOpts.toBytes === void 0 ? pointToBytes2 : extraOpts.toBytes;
  const decodePoint = extraOpts.fromBytes === void 0 ? pointFromBytes : extraOpts.fromBytes;
  function weierstrassEquation(x) {
    const x2 = Fp.sqr(x);
    const x3 = Fp.mul(x2, x);
    return Fp.add(Fp.add(x3, Fp.mul(x, CURVE.a)), CURVE.b);
  }
  function isValidXY(x, y) {
    const left = Fp.sqr(y);
    const right = weierstrassEquation(x);
    return Fp.eql(left, right);
  }
  if (!isValidXY(CURVE.Gx, CURVE.Gy))
    throw new Error("bad curve params: generator point");
  const _4a3 = Fp.mul(Fp.pow(CURVE.a, _3n2), _4n2);
  const _27b2 = Fp.mul(Fp.sqr(CURVE.b), BigInt(27));
  if (Fp.is0(Fp.add(_4a3, _27b2)))
    throw new Error("bad curve params: a or b");
  function acoord(title, n, banZero = false) {
    if (!Fp.isValid(n) || banZero && Fp.is0(n))
      throw new Error(`bad point coordinate ${title}`);
    return n;
  }
  function aprjpoint(other) {
    if (!(other instanceof Point2))
      throw new Error("Weierstrass Point expected");
  }
  function splitEndoScalarN(k) {
    if (!endo || !endo.basises)
      throw new Error("no endo");
    return _splitEndoScalar(k, endo.basises, Fn2.ORDER);
  }
  function finishEndo(endoBeta, k1p, k2p, k1neg, k2neg) {
    k2p = new Point2(Fp.mul(k2p.X, endoBeta), k2p.Y, k2p.Z);
    k1p = negateCt(k1neg, k1p);
    k2p = negateCt(k2neg, k2p);
    return k1p.add(k2p);
  }
  class Point2 {
    // base / generator point
    static BASE = new Point2(CURVE.Gx, CURVE.Gy, Fp.ONE);
    // zero / infinity / identity point
    static ZERO = new Point2(Fp.ZERO, Fp.ONE, Fp.ZERO);
    // 0, 1, 0
    // math field
    static Fp = Fp;
    // scalar field
    static Fn = Fn2;
    X;
    Y;
    Z;
    /** Does NOT validate if the point is valid. Use `.assertValidity()`. */
    constructor(X, Y, Z) {
      this.X = acoord("x", X);
      this.Y = acoord("y", Y, true);
      this.Z = acoord("z", Z);
      Object.freeze(this);
    }
    static CURVE() {
      return CURVE;
    }
    /** Does NOT validate if the point is valid. Use `.assertValidity()`. */
    static fromAffine(p) {
      const { x, y } = p || {};
      if (!p || !Fp.isValid(x) || !Fp.isValid(y))
        throw new Error("invalid affine point");
      if (p instanceof Point2)
        throw new Error("projective point not allowed");
      if (Fp.is0(x) && Fp.is0(y))
        return Point2.ZERO;
      return new Point2(x, y, Fp.ONE);
    }
    static fromBytes(bytes2) {
      const P = Point2.fromAffine(decodePoint(abytes(bytes2, void 0, "point")));
      P.assertValidity();
      return P;
    }
    static fromHex(hex4) {
      return Point2.fromBytes(hexToBytes2(hex4));
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    /**
     *
     * @param windowSize
     * @param isLazy - true will defer table computation until the first multiplication
     * @returns
     */
    precompute(windowSize = 8, isLazy = true) {
      wnaf.createCache(this, windowSize);
      if (!isLazy)
        this.multiply(_3n2);
      return this;
    }
    // TODO: return `this`
    /** A point on curve is valid if it conforms to equation. */
    assertValidity() {
      const p = this;
      if (p.is0()) {
        if (extraOpts.allowInfinityPoint && Fp.is0(p.X) && Fp.eql(p.Y, Fp.ONE) && Fp.is0(p.Z))
          return;
        throw new Error("bad point: ZERO");
      }
      const { x, y } = p.toAffine();
      if (!Fp.isValid(x) || !Fp.isValid(y))
        throw new Error("bad point: x or y not field elements");
      if (!isValidXY(x, y))
        throw new Error("bad point: equation left != right");
      if (!p.isTorsionFree())
        throw new Error("bad point: not in prime-order subgroup");
    }
    hasEvenY() {
      const { y } = this.toAffine();
      if (!Fp.isOdd)
        throw new Error("Field doesn't support isOdd");
      return !Fp.isOdd(y);
    }
    /** Compare one point to another. */
    equals(other) {
      aprjpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
      const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
      return U1 && U2;
    }
    /** Flips point to one corresponding to (x, -y) in Affine coordinates. */
    negate() {
      return new Point2(this.X, Fp.neg(this.Y), this.Z);
    }
    // Renes-Costello-Batina exception-free doubling formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 3
    // Cost: 8M + 3S + 3*a + 2*b3 + 15add.
    double() {
      const { a, b } = CURVE;
      const b3 = Fp.mul(b, _3n2);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
      let t0 = Fp.mul(X1, X1);
      let t1 = Fp.mul(Y1, Y1);
      let t2 = Fp.mul(Z1, Z1);
      let t3 = Fp.mul(X1, Y1);
      t3 = Fp.add(t3, t3);
      Z3 = Fp.mul(X1, Z1);
      Z3 = Fp.add(Z3, Z3);
      X3 = Fp.mul(a, Z3);
      Y3 = Fp.mul(b3, t2);
      Y3 = Fp.add(X3, Y3);
      X3 = Fp.sub(t1, Y3);
      Y3 = Fp.add(t1, Y3);
      Y3 = Fp.mul(X3, Y3);
      X3 = Fp.mul(t3, X3);
      Z3 = Fp.mul(b3, Z3);
      t2 = Fp.mul(a, t2);
      t3 = Fp.sub(t0, t2);
      t3 = Fp.mul(a, t3);
      t3 = Fp.add(t3, Z3);
      Z3 = Fp.add(t0, t0);
      t0 = Fp.add(Z3, t0);
      t0 = Fp.add(t0, t2);
      t0 = Fp.mul(t0, t3);
      Y3 = Fp.add(Y3, t0);
      t2 = Fp.mul(Y1, Z1);
      t2 = Fp.add(t2, t2);
      t0 = Fp.mul(t2, t3);
      X3 = Fp.sub(X3, t0);
      Z3 = Fp.mul(t2, t1);
      Z3 = Fp.add(Z3, Z3);
      Z3 = Fp.add(Z3, Z3);
      return new Point2(X3, Y3, Z3);
    }
    // Renes-Costello-Batina exception-free addition formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 1
    // Cost: 12M + 0S + 3*a + 3*b3 + 23add.
    add(other) {
      aprjpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
      const a = CURVE.a;
      const b3 = Fp.mul(CURVE.b, _3n2);
      let t0 = Fp.mul(X1, X2);
      let t1 = Fp.mul(Y1, Y2);
      let t2 = Fp.mul(Z1, Z2);
      let t3 = Fp.add(X1, Y1);
      let t4 = Fp.add(X2, Y2);
      t3 = Fp.mul(t3, t4);
      t4 = Fp.add(t0, t1);
      t3 = Fp.sub(t3, t4);
      t4 = Fp.add(X1, Z1);
      let t5 = Fp.add(X2, Z2);
      t4 = Fp.mul(t4, t5);
      t5 = Fp.add(t0, t2);
      t4 = Fp.sub(t4, t5);
      t5 = Fp.add(Y1, Z1);
      X3 = Fp.add(Y2, Z2);
      t5 = Fp.mul(t5, X3);
      X3 = Fp.add(t1, t2);
      t5 = Fp.sub(t5, X3);
      Z3 = Fp.mul(a, t4);
      X3 = Fp.mul(b3, t2);
      Z3 = Fp.add(X3, Z3);
      X3 = Fp.sub(t1, Z3);
      Z3 = Fp.add(t1, Z3);
      Y3 = Fp.mul(X3, Z3);
      t1 = Fp.add(t0, t0);
      t1 = Fp.add(t1, t0);
      t2 = Fp.mul(a, t2);
      t4 = Fp.mul(b3, t4);
      t1 = Fp.add(t1, t2);
      t2 = Fp.sub(t0, t2);
      t2 = Fp.mul(a, t2);
      t4 = Fp.add(t4, t2);
      t0 = Fp.mul(t1, t4);
      Y3 = Fp.add(Y3, t0);
      t0 = Fp.mul(t5, t4);
      X3 = Fp.mul(t3, X3);
      X3 = Fp.sub(X3, t0);
      t0 = Fp.mul(t3, t1);
      Z3 = Fp.mul(t5, Z3);
      Z3 = Fp.add(Z3, t0);
      return new Point2(X3, Y3, Z3);
    }
    subtract(other) {
      aprjpoint(other);
      return this.add(other.negate());
    }
    is0() {
      return this.equals(Point2.ZERO);
    }
    /**
     * Constant time multiplication.
     * Uses wNAF method. Windowed method may be 10% faster,
     * but takes 2x longer to generate and consumes 2x memory.
     * Uses precomputes when available.
     * Uses endomorphism for Koblitz curves.
     * @param scalar - by which the point would be multiplied
     * @returns New point
     */
    multiply(scalar) {
      const { endo: endo2 } = extraOpts;
      if (!Fn2.isValidNot0(scalar))
        throw new RangeError("invalid scalar: out of range");
      let point, fake;
      const mul = (n) => wnaf.cached(this, n, (p) => normalizeZ(Point2, p));
      if (endo2) {
        const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(scalar);
        const { p: k1p, f: k1f } = mul(k1);
        const { p: k2p, f: k2f } = mul(k2);
        fake = k1f.add(k2f);
        point = finishEndo(endo2.beta, k1p, k2p, k1neg, k2neg);
      } else {
        const { p, f } = mul(scalar);
        point = p;
        fake = f;
      }
      return normalizeZ(Point2, [point, fake])[0];
    }
    /**
     * Non-constant-time multiplication. Uses double-and-add algorithm.
     * It's faster, but should only be used when you don't care about
     * an exposed secret key e.g. sig verification, which works over *public* keys.
     */
    multiplyUnsafe(scalar) {
      const { endo: endo2 } = extraOpts;
      const p = this;
      const sc = scalar;
      if (!Fn2.isValid(sc))
        throw new RangeError("invalid scalar: out of range");
      if (sc === _0n4 || p.is0())
        return Point2.ZERO;
      if (sc === _1n4)
        return p;
      if (wnaf.hasCache(this))
        return this.multiply(sc);
      if (endo2) {
        const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(sc);
        const { p1, p2 } = mulEndoUnsafe(Point2, p, k1, k2);
        return finishEndo(endo2.beta, p1, p2, k1neg, k2neg);
      } else {
        return wnaf.unsafe(p, sc);
      }
    }
    /**
     * Converts Projective point to affine (x, y) coordinates.
     * (X, Y, Z) ∋ (x=X/Z, y=Y/Z).
     * @param invertedZ - Z^-1 (inverted zero) - optional, precomputation is useful for invertBatch
     */
    toAffine(invertedZ) {
      const p = this;
      let iz = invertedZ;
      const { X, Y, Z } = p;
      if (Fp.eql(Z, Fp.ONE))
        return { x: X, y: Y };
      const is0 = p.is0();
      if (iz == null)
        iz = is0 ? Fp.ONE : Fp.inv(Z);
      const x = Fp.mul(X, iz);
      const y = Fp.mul(Y, iz);
      const zz = Fp.mul(Z, iz);
      if (is0)
        return { x: Fp.ZERO, y: Fp.ZERO };
      if (!Fp.eql(zz, Fp.ONE))
        throw new Error("invZ was invalid");
      return { x, y };
    }
    /**
     * Checks whether Point is free of torsion elements (is in prime subgroup).
     * Always torsion-free for cofactor=1 curves.
     */
    isTorsionFree() {
      const { isTorsionFree } = extraOpts;
      if (cofactor === _1n4)
        return true;
      if (isTorsionFree)
        return isTorsionFree(Point2, this);
      return wnaf.unsafe(this, CURVE_ORDER2).is0();
    }
    clearCofactor() {
      const { clearCofactor } = extraOpts;
      if (cofactor === _1n4)
        return this;
      if (clearCofactor)
        return clearCofactor(Point2, this);
      return this.multiplyUnsafe(cofactor);
    }
    isSmallOrder() {
      if (cofactor === _1n4)
        return this.is0();
      return this.clearCofactor().is0();
    }
    toBytes(isCompressed = true) {
      abool(isCompressed, "isCompressed");
      this.assertValidity();
      return encodePoint(Point2, this, isCompressed);
    }
    toHex(isCompressed = true) {
      return bytesToHex2(this.toBytes(isCompressed));
    }
    toString() {
      return `<Point ${this.is0() ? "ZERO" : this.toHex()}>`;
    }
  }
  const bits = Fn2.BITS;
  const wnaf = new wNAF(Point2, extraOpts.endo ? Math.ceil(bits / 2) : bits);
  if (bits >= 8)
    Point2.BASE.precompute(8);
  Object.freeze(Point2.prototype);
  Object.freeze(Point2);
  return Point2;
}
function pprefix(hasEvenY) {
  return Uint8Array.of(hasEvenY ? 2 : 3);
}
function getWLengths(Fp, Fn2) {
  return {
    secretKey: Fn2.BYTES,
    publicKey: 1 + Fp.BYTES,
    publicKeyUncompressed: 1 + 2 * Fp.BYTES,
    publicKeyHasPrefix: true,
    // Raw compact `(r || s)` signature width; DER and recovered signatures use
    // different lengths outside this helper.
    signature: 2 * Fn2.BYTES
  };
}
function ecdh(Point2, ecdhOpts = {}) {
  const { Fn: Fn2 } = Point2;
  const randomBytes_2 = ecdhOpts.randomBytes === void 0 ? randomBytes : ecdhOpts.randomBytes;
  const lengths = Object.assign(getWLengths(Point2.Fp, Fn2), {
    seed: Math.max(getMinHashLength(Fn2.ORDER), 16)
  });
  function isValidSecretKey(secretKey) {
    try {
      const num2 = Fn2.fromBytes(secretKey);
      return Fn2.isValidNot0(num2);
    } catch (error) {
      return false;
    }
  }
  function isValidPublicKey(publicKey, isCompressed) {
    const { publicKey: comp, publicKeyUncompressed } = lengths;
    try {
      const l = publicKey.length;
      if (isCompressed === true && l !== comp)
        return false;
      if (isCompressed === false && l !== publicKeyUncompressed)
        return false;
      return !!Point2.fromBytes(publicKey);
    } catch (error) {
      return false;
    }
  }
  function randomSecretKey(seed) {
    seed = seed === void 0 ? randomBytes_2(lengths.seed) : seed;
    return mapHashToField(abytes(seed, lengths.seed, "seed"), Fn2.ORDER);
  }
  function getPublicKey(secretKey, isCompressed = true) {
    return Point2.BASE.multiply(Fn2.fromBytes(secretKey)).toBytes(isCompressed);
  }
  function isProbPub(item) {
    const { secretKey, publicKey, publicKeyUncompressed } = lengths;
    const allowedLengths = Fn2._lengths;
    if (!isBytes(item))
      return void 0;
    const l = abytes(item, void 0, "key").length;
    const isPub = l === publicKey || l === publicKeyUncompressed;
    const isSec = l === secretKey || !!allowedLengths?.includes(l);
    if (isPub && isSec)
      return void 0;
    return isPub;
  }
  function getSharedSecret(secretKeyA, publicKeyB, isCompressed = true) {
    if (isProbPub(secretKeyA) === true)
      throw new Error("first arg must be private key");
    if (isProbPub(publicKeyB) === false)
      throw new Error("second arg must be public key");
    const s = Fn2.fromBytes(secretKeyA);
    const b = Point2.fromBytes(publicKeyB);
    return b.multiply(s).toBytes(isCompressed);
  }
  const utils4 = {
    isValidSecretKey,
    isValidPublicKey,
    randomSecretKey
  };
  const keygen = createKeygen(randomSecretKey, getPublicKey);
  Object.freeze(utils4);
  Object.freeze(lengths);
  return Object.freeze({ getPublicKey, getSharedSecret, keygen, Point: Point2, utils: utils4, lengths });
}
function ecdsa(Point2, hash, ecdsaOpts = {}) {
  const hash_ = hash;
  (0, import_utils4.ahash)(hash_);
  validateObject(ecdsaOpts, {}, {
    hmac: "function",
    lowS: "boolean",
    randomBytes: "function",
    bits2int: "function",
    bits2int_modN: "function"
  });
  ecdsaOpts = Object.assign({}, ecdsaOpts);
  const randomBytes3 = ecdsaOpts.randomBytes === void 0 ? randomBytes : ecdsaOpts.randomBytes;
  const hmac = ecdsaOpts.hmac === void 0 ? (key, msg) => (0, import_hmac.hmac)(hash_, key, msg) : ecdsaOpts.hmac;
  const { Fp, Fn: Fn2 } = Point2;
  const { ORDER: CURVE_ORDER2, BITS: fnBits } = Fn2;
  const { keygen, getPublicKey, getSharedSecret, utils: utils4, lengths } = ecdh(Point2, ecdsaOpts);
  const defaultSigOpts = {
    prehash: true,
    lowS: typeof ecdsaOpts.lowS === "boolean" ? ecdsaOpts.lowS : true,
    format: "compact",
    extraEntropy: false
  };
  const hasLargeRecoveryLifts = CURVE_ORDER2 * _2n2 + _1n4 < Fp.ORDER;
  function isBiggerThanHalfOrder(number) {
    const HALF = CURVE_ORDER2 >> _1n4;
    return number > HALF;
  }
  function validateRS(title, num2) {
    if (!Fn2.isValidNot0(num2))
      throw new Error(`invalid signature ${title}: out of range 1..Point.Fn.ORDER`);
    return num2;
  }
  function assertRecoverableCurve() {
    if (hasLargeRecoveryLifts)
      throw new Error('"recovered" sig type is not supported for cofactor >2 curves');
  }
  function validateSigLength(bytes2, format) {
    validateSigFormat(format);
    const size = lengths.signature;
    const sizer = format === "compact" ? size : format === "recovered" ? size + 1 : void 0;
    return abytes(bytes2, sizer);
  }
  class Signature {
    r;
    s;
    recovery;
    constructor(r, s, recovery) {
      this.r = validateRS("r", r);
      this.s = validateRS("s", s);
      if (recovery != null) {
        assertRecoverableCurve();
        if (![0, 1, 2, 3].includes(recovery))
          throw new Error("invalid recovery id");
        this.recovery = recovery;
      }
      Object.freeze(this);
    }
    static fromBytes(bytes2, format = defaultSigOpts.format) {
      validateSigLength(bytes2, format);
      let recid;
      if (format === "der") {
        const { r: r2, s: s2 } = DER.toSig(abytes(bytes2));
        return new Signature(r2, s2);
      }
      if (format === "recovered") {
        recid = bytes2[0];
        format = "compact";
        bytes2 = bytes2.subarray(1);
      }
      const L = lengths.signature / 2;
      const r = bytes2.subarray(0, L);
      const s = bytes2.subarray(L, L * 2);
      return new Signature(Fn2.fromBytes(r), Fn2.fromBytes(s), recid);
    }
    static fromHex(hex4, format) {
      return this.fromBytes(hexToBytes2(hex4), format);
    }
    assertRecovery() {
      const { recovery } = this;
      if (recovery == null)
        throw new Error("invalid recovery id: must be present");
      return recovery;
    }
    addRecoveryBit(recovery) {
      return new Signature(this.r, this.s, recovery);
    }
    // Unlike the top-level helper below, this method expects a digest that has
    // already been hashed to the curve's message representative.
    recoverPublicKey(messageHash) {
      const { r, s } = this;
      const recovery = this.assertRecovery();
      const radj = recovery === 2 || recovery === 3 ? r + CURVE_ORDER2 : r;
      if (!Fp.isValid(radj))
        throw new Error("invalid recovery id: sig.r+curve.n != R.x");
      const x = Fp.toBytes(radj);
      const R = Point2.fromBytes(concatBytes(pprefix((recovery & 1) === 0), x));
      const ir = Fn2.inv(radj);
      const h = bits2int_modN(abytes(messageHash, void 0, "msgHash"));
      const u1 = Fn2.create(-h * ir);
      const u2 = Fn2.create(s * ir);
      const Q = Point2.BASE.multiplyUnsafe(u1).add(R.multiplyUnsafe(u2));
      if (Q.is0())
        throw new Error("invalid recovery: point at infinify");
      Q.assertValidity();
      return Q;
    }
    // Signatures should be low-s, to prevent malleability.
    hasHighS() {
      return isBiggerThanHalfOrder(this.s);
    }
    toBytes(format = defaultSigOpts.format) {
      validateSigFormat(format);
      if (format === "der")
        return hexToBytes2(DER.hexFromSig(this));
      const { r, s } = this;
      const rb = Fn2.toBytes(r);
      const sb = Fn2.toBytes(s);
      if (format === "recovered") {
        assertRecoverableCurve();
        return concatBytes(Uint8Array.of(this.assertRecovery()), rb, sb);
      }
      return concatBytes(rb, sb);
    }
    toHex(format) {
      return bytesToHex2(this.toBytes(format));
    }
  }
  Object.freeze(Signature.prototype);
  Object.freeze(Signature);
  const bits2int = ecdsaOpts.bits2int === void 0 ? function bits2int_def(bytes2) {
    if (bytes2.length > 8192)
      throw new Error("input is too large");
    const num2 = bytesToNumberBE(bytes2);
    const delta = bytes2.length * 8 - fnBits;
    return delta > 0 ? num2 >> BigInt(delta) : num2;
  } : ecdsaOpts.bits2int;
  const bits2int_modN = ecdsaOpts.bits2int_modN === void 0 ? function bits2int_modN_def(bytes2) {
    return Fn2.create(bits2int(bytes2));
  } : ecdsaOpts.bits2int_modN;
  const ORDER_MASK = bitMask(fnBits);
  function int2octets(num2) {
    aInRange("num < 2^" + fnBits, num2, _0n4, ORDER_MASK);
    return Fn2.toBytes(num2);
  }
  function validateMsgAndHash(message, prehash) {
    abytes(message, void 0, "message");
    return prehash ? abytes(hash_(message), void 0, "prehashed message") : message;
  }
  function prepSig(message, secretKey, opts) {
    const { lowS, prehash, extraEntropy } = validateSigOpts(opts, defaultSigOpts);
    message = validateMsgAndHash(message, prehash);
    const h1int = bits2int_modN(message);
    const d = Fn2.fromBytes(secretKey);
    if (!Fn2.isValidNot0(d))
      throw new Error("invalid private key");
    const seedArgs = [int2octets(d), int2octets(h1int)];
    if (extraEntropy != null && extraEntropy !== false) {
      const e = extraEntropy === true ? randomBytes3(lengths.secretKey) : extraEntropy;
      seedArgs.push(abytes(e, void 0, "extraEntropy"));
    }
    const seed = concatBytes(...seedArgs);
    const m = h1int;
    function k2sig(kBytes) {
      const k = bits2int(kBytes);
      if (!Fn2.isValidNot0(k))
        return;
      const ik = Fn2.inv(k);
      const q = Point2.BASE.multiply(k).toAffine();
      const r = Fn2.create(q.x);
      if (r === _0n4)
        return;
      const s = Fn2.create(ik * Fn2.create(m + r * d));
      if (s === _0n4)
        return;
      let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n4);
      let normS = s;
      if (lowS && isBiggerThanHalfOrder(s)) {
        normS = Fn2.neg(s);
        recovery ^= 1;
      }
      return new Signature(r, normS, hasLargeRecoveryLifts ? void 0 : recovery);
    }
    return { seed, k2sig };
  }
  function sign(message, secretKey, opts = {}) {
    const { seed, k2sig } = prepSig(message, secretKey, opts);
    const drbg = createHmacDrbg(hash_.outputLen, Fn2.BYTES, hmac);
    const sig = drbg(seed, k2sig);
    return sig.toBytes(opts.format);
  }
  function verify(signature, message, publicKey, opts = {}) {
    const { lowS, prehash, format } = validateSigOpts(opts, defaultSigOpts);
    publicKey = abytes(publicKey, void 0, "publicKey");
    message = validateMsgAndHash(message, prehash);
    if (!isBytes(signature)) {
      const end = signature instanceof Signature ? ", use sig.toBytes()" : "";
      throw new Error("verify expects Uint8Array signature" + end);
    }
    validateSigLength(signature, format);
    try {
      const sig = Signature.fromBytes(signature, format);
      const P = Point2.fromBytes(publicKey);
      if (lowS && sig.hasHighS())
        return false;
      const { r, s } = sig;
      const h = bits2int_modN(message);
      const is = Fn2.inv(s);
      const u1 = Fn2.create(h * is);
      const u2 = Fn2.create(r * is);
      const R = Point2.BASE.multiplyUnsafe(u1).add(P.multiplyUnsafe(u2));
      if (R.is0())
        return false;
      const v = Fn2.create(R.x);
      return v === r;
    } catch (e) {
      return false;
    }
  }
  function recoverPublicKey(signature, message, opts = {}) {
    const { prehash } = validateSigOpts(opts, defaultSigOpts);
    message = validateMsgAndHash(message, prehash);
    return Signature.fromBytes(signature, "recovered").recoverPublicKey(message).toBytes();
  }
  return Object.freeze({
    keygen,
    getPublicKey,
    getSharedSecret,
    utils: utils4,
    lengths,
    Point: Point2,
    sign,
    verify,
    recoverPublicKey,
    Signature,
    hash: hash_
  });
}
var import_hmac, import_utils4, divNearest, DERErr, DER, _0n4, _1n4, _2n2, _3n2, _4n2;
var init_weierstrass = __esm({
  "node_modules/@noble/curves/abstract/weierstrass.js"() {
    import_hmac = require("@noble/hashes/hmac.js");
    import_utils4 = require("@noble/hashes/utils.js");
    init_utils();
    init_curve();
    init_modular();
    divNearest = (num2, den) => (num2 + (num2 >= 0 ? den : -den) / _2n2) / den;
    DERErr = class extends Error {
      constructor(m = "") {
        super(m);
      }
    };
    DER = {
      // asn.1 DER encoding utils
      Err: DERErr,
      // Basic building block is TLV (Tag-Length-Value)
      _tlv: {
        encode: (tag, data) => {
          const { Err: E } = DER;
          asafenumber(tag, "tag");
          if (tag < 0 || tag > 255)
            throw new E("tlv.encode: wrong tag");
          if (typeof data !== "string")
            throw new TypeError('"data" expected string, got type=' + typeof data);
          if (data.length & 1)
            throw new E("tlv.encode: unpadded data");
          const dataLen = data.length / 2;
          const len = numberToHexUnpadded(dataLen);
          if (len.length / 2 & 128)
            throw new E("tlv.encode: long form length too big");
          const lenLen = dataLen > 127 ? numberToHexUnpadded(len.length / 2 | 128) : "";
          const t = numberToHexUnpadded(tag);
          return t + lenLen + len + data;
        },
        // v - value, l - left bytes (unparsed)
        decode(tag, data) {
          const { Err: E } = DER;
          data = abytes(data, void 0, "DER data");
          let pos = 0;
          if (tag < 0 || tag > 255)
            throw new E("tlv.encode: wrong tag");
          if (data.length < 2 || data[pos++] !== tag)
            throw new E("tlv.decode: wrong tlv");
          const first = data[pos++];
          const isLong = !!(first & 128);
          let length = 0;
          if (!isLong)
            length = first;
          else {
            const lenLen = first & 127;
            if (!lenLen)
              throw new E("tlv.decode(long): indefinite length not supported");
            if (lenLen > 4)
              throw new E("tlv.decode(long): byte length is too big");
            const lengthBytes = data.subarray(pos, pos + lenLen);
            if (lengthBytes.length !== lenLen)
              throw new E("tlv.decode: length bytes not complete");
            if (lengthBytes[0] === 0)
              throw new E("tlv.decode(long): zero leftmost byte");
            for (const b of lengthBytes)
              length = length << 8 | b;
            pos += lenLen;
            if (length < 128)
              throw new E("tlv.decode(long): not minimal encoding");
          }
          const v = data.subarray(pos, pos + length);
          if (v.length !== length)
            throw new E("tlv.decode: wrong value length");
          return { v, l: data.subarray(pos + length) };
        }
      },
      // https://crypto.stackexchange.com/a/57734 Leftmost bit of first byte is 'negative' flag,
      // since we always use positive integers here. It must always be empty:
      // - add zero byte if exists
      // - if next byte doesn't have a flag, leading zero is not allowed (minimal encoding)
      _int: {
        encode(num2) {
          const { Err: E } = DER;
          abignumber(num2);
          if (num2 < _0n4)
            throw new E("integer: negative integers are not allowed");
          let hex4 = numberToHexUnpadded(num2);
          if (Number.parseInt(hex4[0], 16) & 8)
            hex4 = "00" + hex4;
          if (hex4.length & 1)
            throw new E("unexpected DER parsing assertion: unpadded hex");
          return hex4;
        },
        decode(data) {
          const { Err: E } = DER;
          if (data.length < 1)
            throw new E("invalid signature integer: empty");
          if (data[0] & 128)
            throw new E("invalid signature integer: negative");
          if (data.length > 1 && data[0] === 0 && !(data[1] & 128))
            throw new E("invalid signature integer: unnecessary leading zero");
          return bytesToNumberBE(data);
        }
      },
      toSig(bytes2) {
        const { Err: E, _int: int, _tlv: tlv } = DER;
        const data = abytes(bytes2, void 0, "signature");
        const { v: seqBytes, l: seqLeftBytes } = tlv.decode(48, data);
        if (seqLeftBytes.length)
          throw new E("invalid signature: left bytes after parsing");
        const { v: rBytes, l: rLeftBytes } = tlv.decode(2, seqBytes);
        const { v: sBytes, l: sLeftBytes } = tlv.decode(2, rLeftBytes);
        if (sLeftBytes.length)
          throw new E("invalid signature: left bytes after parsing");
        return { r: int.decode(rBytes), s: int.decode(sBytes) };
      },
      hexFromSig(sig) {
        const { _tlv: tlv, _int: int } = DER;
        const rs = tlv.encode(2, int.encode(sig.r));
        const ss = tlv.encode(2, int.encode(sig.s));
        const seq = rs + ss;
        return tlv.encode(48, seq);
      }
    };
    Object.freeze(DER._tlv);
    Object.freeze(DER._int);
    Object.freeze(DER);
    _0n4 = /* @__PURE__ */ BigInt(0);
    _1n4 = /* @__PURE__ */ BigInt(1);
    _2n2 = /* @__PURE__ */ BigInt(2);
    _3n2 = /* @__PURE__ */ BigInt(3);
    _4n2 = /* @__PURE__ */ BigInt(4);
  }
});

// node_modules/@noble/curves/secp256k1.js
function sqrtMod(y) {
  const P = secp256k1_CURVE.p;
  const _3n3 = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
  const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
  const b2 = y * y * y % P;
  const b3 = b2 * b2 * y % P;
  const b6 = pow2(b3, _3n3, P) * b3 % P;
  const b9 = pow2(b6, _3n3, P) * b3 % P;
  const b11 = pow2(b9, _2n3, P) * b2 % P;
  const b22 = pow2(b11, _11n, P) * b11 % P;
  const b44 = pow2(b22, _22n, P) * b22 % P;
  const b88 = pow2(b44, _44n, P) * b44 % P;
  const b176 = pow2(b88, _88n, P) * b88 % P;
  const b220 = pow2(b176, _44n, P) * b44 % P;
  const b223 = pow2(b220, _3n3, P) * b3 % P;
  const t1 = pow2(b223, _23n, P) * b22 % P;
  const t2 = pow2(t1, _6n, P) * b2 % P;
  const root = pow2(t2, _2n3, P);
  if (!Fpk1.eql(Fpk1.sqr(root), y))
    throw new Error("Cannot find square root");
  return root;
}
function taggedHash(tag, ...messages) {
  let tagP = TAGGED_HASH_PREFIXES[tag];
  if (tagP === void 0) {
    const tagH = (0, import_sha2.sha256)(asciiToBytes(tag));
    tagP = concatBytes(tagH, tagH);
    TAGGED_HASH_PREFIXES[tag] = tagP;
  }
  return (0, import_sha2.sha256)(concatBytes(tagP, ...messages));
}
function schnorrGetExtPubKey(priv) {
  const { Fn: Fn2, BASE } = Pointk1;
  const d_ = Fn2.fromBytes(priv);
  const p = BASE.multiply(d_);
  const scalar = hasEven(p.y) ? d_ : Fn2.neg(d_);
  return { scalar, bytes: pointToBytes(p) };
}
function lift_x(x) {
  const Fp = Fpk1;
  if (!Fp.isValidNot0(x))
    throw new Error("invalid x: Fail if x \u2265 p");
  const xx = Fp.create(x * x);
  const c = Fp.create(xx * x + BigInt(7));
  let y = Fp.sqrt(c);
  if (!hasEven(y))
    y = Fp.neg(y);
  const p = Pointk1.fromAffine({ x, y });
  p.assertValidity();
  return p;
}
function challenge(...args) {
  return Pointk1.Fn.create(num(taggedHash("BIP0340/challenge", ...args)));
}
function schnorrGetPublicKey(secretKey) {
  return schnorrGetExtPubKey(secretKey).bytes;
}
function schnorrSign(message, secretKey, auxRand = (0, import_utils6.randomBytes)(32)) {
  const { Fn: Fn2, BASE } = Pointk1;
  const m = abytes(message, void 0, "message");
  const { bytes: px, scalar: d } = schnorrGetExtPubKey(secretKey);
  const a = abytes(auxRand, 32, "auxRand");
  const t = Fn2.toBytes(d ^ num(taggedHash("BIP0340/aux", a)));
  const rand = taggedHash("BIP0340/nonce", t, px, m);
  const k_ = Fn2.create(num(rand));
  if (k_ === 0n)
    throw new Error("sign failed: k is zero");
  const p = BASE.multiply(k_);
  const k = hasEven(p.y) ? k_ : Fn2.neg(k_);
  const rx = pointToBytes(p);
  const e = challenge(rx, px, m);
  const sig = new Uint8Array(64);
  sig.set(rx, 0);
  sig.set(Fn2.toBytes(Fn2.create(k + e * d)), 32);
  if (!schnorrVerify(sig, m, px))
    throw new Error("sign: Invalid signature produced");
  return sig;
}
function schnorrVerify(signature, message, publicKey) {
  const { Fp, Fn: Fn2, BASE } = Pointk1;
  const sig = abytes(signature, 64, "signature");
  const m = abytes(message, void 0, "message");
  const pub = abytes(publicKey, 32, "publicKey");
  try {
    const P = lift_x(num(pub));
    const r = num(sig.subarray(0, 32));
    if (!Fp.isValidNot0(r))
      return false;
    const s = num(sig.subarray(32, 64));
    if (!Fn2.isValidNot0(s))
      return false;
    const e = challenge(Fn2.toBytes(r), pointToBytes(P), m);
    const R = BASE.multiplyUnsafe(s).add(P.multiplyUnsafe(Fn2.neg(e)));
    const { x, y } = R.toAffine();
    if (R.is0() || !hasEven(y) || x !== r)
      return false;
    return true;
  } catch (error) {
    return false;
  }
}
var import_sha2, import_utils6, secp256k1_CURVE, secp256k1_ENDO, _0n5, _2n3, Fpk1, Pointk1, secp256k1, TAGGED_HASH_PREFIXES, pointToBytes, hasEven, num, schnorr;
var init_secp256k1 = __esm({
  "node_modules/@noble/curves/secp256k1.js"() {
    import_sha2 = require("@noble/hashes/sha2.js");
    import_utils6 = require("@noble/hashes/utils.js");
    init_curve();
    init_modular();
    init_weierstrass();
    init_utils();
    secp256k1_CURVE = {
      p: BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f"),
      n: BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141"),
      h: BigInt(1),
      a: BigInt(0),
      b: BigInt(7),
      Gx: BigInt("0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"),
      Gy: BigInt("0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8")
    };
    secp256k1_ENDO = {
      beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
      basises: [
        [BigInt("0x3086d221a7d46bcde86c90e49284eb15"), -BigInt("0xe4437ed6010e88286f547fa90abfe4c3")],
        [BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8"), BigInt("0x3086d221a7d46bcde86c90e49284eb15")]
      ]
    };
    _0n5 = /* @__PURE__ */ BigInt(0);
    _2n3 = /* @__PURE__ */ BigInt(2);
    Fpk1 = Field(secp256k1_CURVE.p, { sqrt: sqrtMod });
    Pointk1 = /* @__PURE__ */ weierstrass(secp256k1_CURVE, {
      Fp: Fpk1,
      endo: secp256k1_ENDO
    });
    secp256k1 = /* @__PURE__ */ ecdsa(Pointk1, import_sha2.sha256);
    TAGGED_HASH_PREFIXES = {};
    pointToBytes = (point) => point.toBytes(true).slice(1);
    hasEven = (y) => y % _2n3 === _0n5;
    num = bytesToNumberBE;
    schnorr = /* @__PURE__ */ (() => {
      const size = 32;
      const seedLength = 48;
      const randomSecretKey = (seed) => {
        seed = seed === void 0 ? (0, import_utils6.randomBytes)(seedLength) : seed;
        return mapHashToField(seed, secp256k1_CURVE.n);
      };
      return Object.freeze({
        keygen: createKeygen(randomSecretKey, schnorrGetPublicKey),
        getPublicKey: schnorrGetPublicKey,
        sign: schnorrSign,
        verify: schnorrVerify,
        Point: Pointk1,
        utils: Object.freeze({
          randomSecretKey,
          taggedHash,
          lift_x,
          pointToBytes
        }),
        lengths: Object.freeze({
          secretKey: size,
          publicKey: size,
          publicKeyHasPrefix: false,
          signature: size * 2,
          seed: seedLength
        })
      });
    })();
  }
});

// node_modules/micro-packed/node_modules/@scure/base/index.js
function isBytes2(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
function abytes2(b) {
  if (!isBytes2(b))
    throw new TypeError("Uint8Array expected");
}
function isArrayOf(isString, arr) {
  if (!Array.isArray(arr))
    return false;
  if (arr.length === 0)
    return true;
  if (isString) {
    return arr.every((item) => typeof item === "string");
  } else {
    return arr.every((item) => Number.isSafeInteger(item));
  }
}
function afn(input) {
  if (typeof input !== "function")
    throw new TypeError("function expected");
  return true;
}
function astr(label, input) {
  if (typeof input !== "string")
    throw new TypeError(`${label}: string expected`);
  return true;
}
function anumber2(n) {
  if (typeof n !== "number")
    throw new TypeError(`number expected, got ${typeof n}`);
  if (!Number.isSafeInteger(n))
    throw new RangeError(`invalid integer: ${n}`);
}
function aArr(input) {
  if (!Array.isArray(input))
    throw new TypeError("array expected");
}
function astrArr(label, input) {
  if (!isArrayOf(true, input))
    throw new TypeError(`${label}: array of strings expected`);
}
function anumArr(label, input) {
  if (!isArrayOf(false, input))
    throw new TypeError(`${label}: array of numbers expected`);
}
// @__NO_SIDE_EFFECTS__
function chain(...args) {
  const id = (a) => a;
  const wrap2 = (a, b) => (c) => a(b(c));
  const encode = args.map((x) => x.encode).reduceRight(wrap2, id);
  const decode = args.map((x) => x.decode).reduce(wrap2, id);
  return { encode, decode };
}
// @__NO_SIDE_EFFECTS__
function alphabet(letters) {
  const lettersA = typeof letters === "string" ? letters.split("") : letters;
  const len = lettersA.length;
  astrArr("alphabet", lettersA);
  const indexes = new Map(lettersA.map((l, i) => [l, i]));
  return {
    encode: (digits) => {
      aArr(digits);
      return digits.map((i) => {
        if (!Number.isSafeInteger(i) || i < 0 || i >= len)
          throw new Error(`alphabet.encode: digit index outside alphabet "${i}". Allowed: ${letters}`);
        return lettersA[i];
      });
    },
    decode: (input) => {
      aArr(input);
      return input.map((letter) => {
        astr("alphabet.decode", letter);
        const i = indexes.get(letter);
        if (i === void 0)
          throw new Error(`Unknown letter: "${letter}". Allowed: ${letters}`);
        return i;
      });
    }
  };
}
// @__NO_SIDE_EFFECTS__
function join(separator = "") {
  astr("join", separator);
  return {
    encode: (from) => {
      astrArr("join.decode", from);
      return from.join(separator);
    },
    decode: (to) => {
      astr("join.decode", to);
      return to.split(separator);
    }
  };
}
// @__NO_SIDE_EFFECTS__
function normalize(fn) {
  afn(fn);
  return { encode: (from) => from, decode: (to) => fn(to) };
}
function convertRadix2(data, from, to, padding2) {
  aArr(data);
  if (from <= 0 || from > 32)
    throw new RangeError(`convertRadix2: wrong from=${from}`);
  if (to <= 0 || to > 32)
    throw new RangeError(`convertRadix2: wrong to=${to}`);
  if (/* @__PURE__ */ radix2carry(from, to) > 32) {
    throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${/* @__PURE__ */ radix2carry(from, to)}`);
  }
  let carry = 0;
  let pos = 0;
  const max = powers[from];
  const mask = powers[to] - 1;
  const res = [];
  for (const n of data) {
    anumber2(n);
    if (n >= max)
      throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
    carry = carry << from | n;
    if (pos + from > 32)
      throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
    pos += from;
    for (; pos >= to; pos -= to)
      res.push((carry >> pos - to & mask) >>> 0);
    const pow = powers[pos];
    if (pow === void 0)
      throw new Error("invalid carry");
    carry &= pow - 1;
  }
  carry = carry << to - pos & mask;
  if (!padding2 && pos >= from)
    throw new Error("Excess padding");
  if (!padding2 && carry > 0)
    throw new Error(`Non-zero padding: ${carry}`);
  if (padding2 && pos > 0)
    res.push(carry >>> 0);
  return res;
}
// @__NO_SIDE_EFFECTS__
function radix2(bits, revPadding = false) {
  anumber2(bits);
  if (bits <= 0 || bits > 32)
    throw new RangeError("radix2: bits should be in (0..32]");
  if (/* @__PURE__ */ radix2carry(8, bits) > 32 || /* @__PURE__ */ radix2carry(bits, 8) > 32)
    throw new RangeError("radix2: carry overflow");
  return {
    encode: (bytes2) => {
      if (!isBytes2(bytes2))
        throw new TypeError("radix2.encode input should be Uint8Array");
      return convertRadix2(Array.from(bytes2), 8, bits, !revPadding);
    },
    decode: (digits) => {
      anumArr("radix2.decode", digits);
      return Uint8Array.from(convertRadix2(digits, bits, 8, revPadding));
    }
  };
}
var gcd, radix2carry, powers, _isWellFormedShim, _isWellFormed, utf8Fallback, utf8, hasHexBuiltin, hexBuiltin, hex;
var init_base = __esm({
  "node_modules/micro-packed/node_modules/@scure/base/index.js"() {
    gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    radix2carry = /* @__NO_SIDE_EFFECTS__ */ (from, to) => from + (to - gcd(from, to));
    powers = /* @__PURE__ */ (() => {
      let res = [];
      for (let i = 0; i < 40; i++)
        res.push(2 ** i);
      return res;
    })();
    _isWellFormedShim = (str2) => {
      try {
        return encodeURI(str2) !== null;
      } catch {
        return false;
      }
    };
    _isWellFormed = /* @__PURE__ */ (() => (
      // Pick the native check once so utf8.decode doesn't re-probe String.prototype on every call.
      typeof "".isWellFormed === "function" ? (str2) => str2.isWellFormed() : _isWellFormedShim
    ))();
    utf8Fallback = /* @__PURE__ */ Object.freeze({
      encode(data) {
        abytes2(data);
        let res = "";
        for (let i = 0; i < data.length; ) {
          const a = data[i++];
          if (a < 128) {
            res += String.fromCharCode(a);
            continue;
          }
          if (a < 194 || i >= data.length)
            throw new TypeError(`invalid utf8 at byte ${i - 1}`);
          const b = data[i++];
          if ((b & 192) !== 128)
            throw new TypeError(`invalid utf8 at byte ${i - 1}`);
          let cp = (a & 31) << 6 | b & 63;
          if (a >= 224) {
            if (i >= data.length)
              throw new TypeError(`invalid utf8 at byte ${i - 1}`);
            const c = data[i++];
            if ((c & 192) !== 128 || a === 224 && b < 160 || a === 237 && b >= 160)
              throw new TypeError(`invalid utf8 at byte ${i - 1}`);
            cp = (a & 15) << 12 | (b & 63) << 6 | c & 63;
            if (a >= 240) {
              if (i >= data.length)
                throw new TypeError(`invalid utf8 at byte ${i - 1}`);
              const d = data[i++];
              if (a > 244 || (d & 192) !== 128 || a === 240 && b < 144 || a === 244 && b >= 144)
                throw new TypeError(`invalid utf8 at byte ${i - 1}`);
              cp = (a & 7) << 18 | (b & 63) << 12 | (c & 63) << 6 | d & 63;
            }
          }
          if (cp < 65536)
            res += String.fromCharCode(cp);
          else {
            cp -= 65536;
            res += String.fromCharCode((cp >> 10) + 55296, (cp & 1023) + 56320);
          }
        }
        return res;
      },
      decode(str2) {
        astr("utf8", str2);
        if (!_isWellFormed(str2))
          throw new TypeError("utf8 expected well-formed string");
        const res = new Uint8Array(str2.length * 3);
        let pos = 0;
        for (let i = 0; i < str2.length; i++) {
          let c = str2.charCodeAt(i);
          if (c < 128) {
            res[pos++] = c;
            continue;
          }
          if (c >= 55296 && c <= 57343) {
            const d = str2.charCodeAt(++i);
            c = 65536 + (c - 55296 << 10) + d - 56320;
          }
          if (c >= 65536) {
            res[pos++] = c >> 18 | 240;
            res[pos++] = c >> 12 & 63 | 128;
          } else if (c >= 2048)
            res[pos++] = c >> 12 | 224;
          else
            res[pos++] = c >> 6 | 192;
          if (c >= 2048)
            res[pos++] = c >> 6 & 63 | 128;
          res[pos++] = c & 63 | 128;
        }
        return res.subarray(0, pos);
      }
    });
    utf8 = /* @__PURE__ */ (() => {
      let _utf8Encoder;
      let _utf8Decoder;
      const utf8Builtin = {
        // ignoreBOM preserves an explicit leading U+FEFF;
        // fatal rejects invalid UTF-8 bytes instead of replacing them.
        encode(data) {
          abytes2(data);
          return (_utf8Decoder || (_utf8Decoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true }))).decode(data);
        },
        decode(str2) {
          astr("utf8", str2);
          if (!_isWellFormed(str2))
            throw new TypeError("utf8 expected well-formed string");
          return (_utf8Encoder || (_utf8Encoder = new TextEncoder())).encode(str2);
        }
      };
      return Object.freeze({
        // Select each direction once at module init, since
        // TextEncoder and TextDecoder can exist independently.
        encode: typeof TextDecoder === "function" ? utf8Builtin.encode : utf8Fallback.encode,
        decode: typeof TextEncoder === "function" ? utf8Builtin.decode : utf8Fallback.decode
      });
    })();
    hasHexBuiltin = /* @__PURE__ */ (() => (
      // Require both directions before enabling the native hex path so encode/decode stay symmetric.
      typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
    ))();
    hexBuiltin = {
      // Keep local type guards so the native path preserves library-level input errors.
      // Native toHex emits lowercase hex, matching the fallback alphabet and Node's hex strings.
      encode(data) {
        abytes2(data);
        return data.toHex();
      },
      // Native fromHex accepts either hex case and rejects odd-length / non-hex syntax.
      decode(s) {
        astr("hex", s);
        return Uint8Array.fromHex(s);
      }
    };
    hex = /* @__PURE__ */ Object.freeze(hasHexBuiltin ? hexBuiltin : /* @__PURE__ */ chain(/* @__PURE__ */ radix2(4), /* @__PURE__ */ alphabet("0123456789abcdef"), /* @__PURE__ */ join(""), /* @__PURE__ */ normalize((s) => {
      if (typeof s !== "string" || s.length % 2 !== 0)
        throw new TypeError(`hex.decode: expected string, got ${typeof s} with length ${s.length}`);
      return s.toLowerCase();
    })));
  }
});

// node_modules/micro-packed/index.js
function equalBytes(a, b) {
  if (a.length !== b.length)
    return false;
  for (let i = 0; i < a.length; i++)
    if (a[i] !== b[i])
      return false;
  return true;
}
function createFindBytes(needle) {
  if (needle.length === 1) {
    const byte = needle[0];
    return (data, pos = 0) => {
      const idx = data.indexOf(byte, pos);
      return idx === -1 ? void 0 : idx;
    };
  }
  const back = new Uint32Array(needle.length);
  for (let i = 1, j = 0; i < needle.length; i++) {
    while (j && needle[i] !== needle[j])
      j = back[j - 1];
    if (needle[i] === needle[j])
      back[i] = ++j;
  }
  return (data, pos = 0) => {
    for (let i = pos, j = 0; i < data.length; i++) {
      while (j && data[i] !== needle[j])
        j = back[j - 1];
      if (data[i] !== needle[j])
        continue;
      if (++j === needle.length)
        return i - needle.length + 1;
    }
    return void 0;
  };
}
function equal(a, b) {
  const aBytes = isBytes3(a);
  const bBytes = isBytes3(b);
  if (aBytes || bBytes)
    return aBytes && bBytes && equalBytes(a, b);
  return a === b;
}
function isBytes3(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
function concatBytes2(...arrays) {
  let sum = 0;
  for (let i = 0; i < arrays.length; i++) {
    const a = arrays[i];
    if (!isBytes3(a))
      throw new Error("Uint8Array expected");
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad = 0; i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad);
    pad += a.length;
  }
  return res;
}
function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}
function isNum(num2) {
  return Number.isSafeInteger(num2);
}
function checkBounds(value, bits, signed) {
  if (signed) {
    if (bits <= _0n6)
      throw new Error(`checkBounds: signed bits must be positive, got ${bits}`);
    const signBit = _2n4 ** (bits - _1n5);
    if (value < -signBit || value >= signBit)
      throw new Error(`value out of signed bounds. Expected ${-signBit} <= ${value} < ${signBit}`);
  } else {
    const max = _2n4 ** bits;
    if (_0n6 > value || value >= max)
      throw new Error(`value out of unsigned bounds. Expected 0 <= ${value} < ${max}`);
  }
}
function _wrap(inner) {
  const _inner = inner;
  return {
    // NOTE: we cannot export validate here, since it is likely mistake.
    // Raw inner throws propagate unchanged; path-aware errors must use w.err/r.err or validate().
    encodeStream: _inner.encodeStream,
    decodeStream: _inner.decodeStream,
    size: _inner.size,
    encode: (value) => {
      const w = new _Writer();
      _inner.encodeStream(w, value);
      return w.finish();
    },
    decode: (data, opts = {}) => {
      const r = new _Reader(data, opts);
      const res = _inner.decodeStream(r);
      r.finish();
      return res;
    }
  };
}
function validate(inner, fn) {
  if (!isCoder(inner))
    throw new TypeError(`validate: invalid inner value ${inner}`);
  if (typeof fn !== "function")
    throw new TypeError("validate: fn should be function");
  return _wrap({
    size: inner.size,
    encodeStream: (w, value) => {
      let res;
      try {
        res = fn(value);
      } catch (e) {
        throw w.err(e);
      }
      inner.encodeStream(w, res);
    },
    decodeStream: (r) => {
      const res = inner.decodeStream(r);
      try {
        return fn(res);
      } catch (e) {
        throw r.err(e);
      }
    }
  });
}
function isCoder(elm) {
  return isPlainObject(elm) && isBaseCoder(elm) && typeof elm.encodeStream === "function" && typeof elm.decodeStream === "function" && (elm.size === void 0 || isNum(elm.size) && elm.size >= 0);
}
function dict() {
  return {
    encode: (from) => {
      if (!Array.isArray(from))
        throw new Error("array expected");
      const to = {};
      const seen = /* @__PURE__ */ new Set();
      for (const item of from) {
        if (!Array.isArray(item) || item.length !== 2)
          throw new Error(`array of two elements expected`);
        const name = item[0];
        const value = item[1];
        validateFieldName(name, "dict: key");
        if (seen.has(name))
          throw new Error(`key(${name}) appears twice in struct`);
        seen.add(name);
        to[name] = value;
      }
      return to;
    },
    decode: (to) => {
      if (!isPlainObject(to))
        throw new Error(`expected plain object, got ${to}`);
      for (const name in to)
        validateFieldName(name, "dict: key");
      return Object.entries(to);
    }
  };
}
function tsEnum(e) {
  if (!isPlainObject(e))
    throw new Error("plain object expected");
  return {
    encode: (from) => {
      if (!isNum(from) || !(from in e))
        throw new Error(`wrong value ${from}`);
      return e[from];
    },
    decode: (to) => {
      if (typeof to !== "string")
        throw new Error(`wrong value ${typeof to}`);
      const value = e[to];
      if (!hasOwn(e, to) || !isNum(value))
        throw new Error(`wrong value ${to}`);
      return value;
    }
  };
}
function decimal(precision, round = false) {
  if (!isNum(precision) || precision < 0)
    throw new Error(`decimal/precision: wrong value ${precision}`);
  if (typeof round !== "boolean")
    throw new Error(`decimal/round: expected boolean, got ${typeof round}`);
  const decimalMask = _10n ** BigInt(precision);
  return {
    encode: (from) => {
      if (typeof from !== "bigint")
        throw new Error(`expected bigint, got ${typeof from}`);
      let s = (from < _0n6 ? -from : from).toString(10);
      let sep = s.length - precision;
      if (sep < 0) {
        s = s.padStart(s.length - sep, "0");
        sep = 0;
      }
      let i = s.length - 1;
      for (; i >= sep && s[i] === "0"; i--)
        ;
      let int = s.slice(0, sep);
      let frac = s.slice(sep, i + 1);
      if (!int)
        int = "0";
      if (from < _0n6)
        int = "-" + int;
      if (!frac)
        return int;
      return `${int}.${frac}`;
    },
    decode: (to) => {
      if (typeof to !== "string")
        throw new Error(`expected string, got ${typeof to}`);
      let neg = false;
      if (to.startsWith("-")) {
        neg = true;
        to = to.slice(1);
      }
      if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(to))
        throw new Error(`wrong string value=${to}`);
      let sep = to.indexOf(".");
      sep = sep === -1 ? to.length : sep;
      const intS = to.slice(0, sep);
      const fracS = to.slice(sep + 1).replace(/0+$/, "");
      const int = BigInt(intS) * decimalMask;
      if (!round && fracS.length > precision) {
        throw new Error(`fractional part cannot be represented with this precision (num=${to}, prec=${precision})`);
      }
      const fracLen = Math.min(fracS.length, precision);
      const frac = BigInt(fracS.slice(0, fracLen)) * _10n ** BigInt(precision - fracLen);
      const value = int + frac;
      if (neg && value === _0n6)
        throw new Error(`negative zero is not allowed`);
      return neg ? -value : value;
    }
  };
}
function match(lst) {
  if (!Array.isArray(lst))
    throw new Error(`expected array, got ${typeof lst}`);
  for (const i of lst)
    if (!isBaseCoder(i))
      throw new Error(`wrong base coder ${i}`);
  return {
    encode: (from) => {
      for (const c of lst) {
        let elm;
        try {
          elm = c.encode(from);
        } catch {
          continue;
        }
        if (elm !== void 0)
          return elm;
      }
      throw new Error(`match/encode: cannot find match in ${from}`);
    },
    decode: (to) => {
      for (const c of lst) {
        let elm;
        try {
          elm = c.decode(to);
        } catch {
          continue;
        }
        if (elm !== void 0)
          return elm;
      }
      throw new Error(`match/decode: cannot find match in ${to}`);
    }
  };
}
function prefix(len, inner) {
  if (!isCoder(inner))
    throw new Error(`prefix: invalid inner value ${inner}`);
  return apply(createBytes(len), reverse(inner));
}
function apply(inner, base) {
  if (!isCoder(inner))
    throw new TypeError(`apply: invalid inner value ${inner}`);
  if (!isBaseCoder(base))
    throw new TypeError(`apply: invalid base value ${base}`);
  return wrap({
    size: inner.size,
    encodeStream: (w, value) => {
      let innerValue;
      try {
        innerValue = base.decode(value);
      } catch (e) {
        throw w.err("" + e);
      }
      return inner.encodeStream(w, innerValue);
    },
    decodeStream: (r) => {
      const innerValue = inner.decodeStream(r);
      try {
        return base.encode(innerValue);
      } catch (e) {
        throw r.err("" + e);
      }
    }
  });
}
function flagged(path2, inner, def2) {
  if (typeof path2 !== "string" && !isCoder(path2))
    throw new TypeError(`flagged: wrong path=${path2}`);
  if (!isCoder(inner))
    throw new TypeError(`flagged: invalid inner value ${inner}`);
  const hasDef = def2 !== void 0;
  return wrap({
    encodeStream: (w, value) => {
      if (typeof path2 === "string") {
        if (Path.resolve(w.stack, path2))
          inner.encodeStream(w, value);
        else if (hasDef)
          inner.encodeStream(w, def2);
      } else {
        const present = value !== void 0;
        path2.encodeStream(w, present);
        if (present)
          inner.encodeStream(w, value);
        else if (hasDef)
          inner.encodeStream(w, def2);
      }
    },
    decodeStream: (r) => {
      let hasFlag = false;
      if (typeof path2 === "string")
        hasFlag = !!Path.resolve(r.stack, path2);
      else
        hasFlag = path2.decodeStream(r);
      if (hasFlag)
        return inner.decodeStream(r);
      else if (hasDef)
        inner.decodeStream(r);
      return;
    }
  });
}
function magic(inner, constant, check = true) {
  if (!isCoder(inner))
    throw new TypeError(`magic: invalid inner value ${inner}`);
  if (typeof check !== "boolean")
    throw new TypeError(`magic: expected boolean, got ${typeof check}`);
  return wrap({
    size: inner.size,
    encodeStream: (w, _value) => inner.encodeStream(w, constant),
    decodeStream: (r) => {
      const value = inner.decodeStream(r);
      const valueObj = value !== null && typeof value === "object" && !isBytes3(value);
      const constantObj = constant !== null && typeof constant === "object" && !isBytes3(constant);
      const canCompare = !valueObj || !constantObj;
      if (check && canCompare && !equal(value, constant)) {
        throw r.err(`magic: invalid value: ${value} !== ${constant}`);
      }
      return;
    },
    validate: (value) => {
      if (value !== void 0)
        throw new Error(`magic: wrong value=${typeof value}`);
      return value;
    }
  });
}
function sizeof(fields) {
  let size = 0;
  for (const f of fields) {
    if (f.size === void 0)
      return;
    if (!isNum(f.size))
      throw new Error(`sizeof: wrong element size=${size}`);
    size += f.size;
  }
  return size;
}
function struct(fields) {
  if (!isPlainObject(fields))
    throw new TypeError(`struct: expected plain object, got ${fields}`);
  const coders2 = [];
  for (const name in fields) {
    validateFieldName(name, "struct: field");
    if (!isCoder(fields[name]))
      throw new TypeError(`struct: field ${name} is not CoderType`);
    coders2.push(fields[name]);
  }
  return wrap({
    size: sizeof(coders2),
    encodeStream: (w, value) => {
      w.pushObj(value, (fieldFn) => {
        for (const name in fields)
          fieldFn(name, () => fields[name].encodeStream(w, value[name]));
      });
    },
    decodeStream: (r) => {
      const res = {};
      r.pushObj(res, (fieldFn) => {
        for (const name in fields)
          fieldFn(name, () => res[name] = fields[name].decodeStream(r));
      });
      return res;
    },
    validate: (value) => {
      if (typeof value !== "object" || value === null)
        throw new Error(`struct: invalid value ${value}`);
      return value;
    }
  });
}
function tuple(fields) {
  if (!Array.isArray(fields))
    throw new TypeError(`Packed.Tuple: got ${typeof fields} instead of array`);
  for (let i = 0; i < fields.length; i++) {
    if (!isCoder(fields[i]))
      throw new TypeError(`tuple: field ${i} is not CoderType`);
  }
  return wrap({
    size: sizeof(fields),
    encodeStream: (w, value) => {
      if (!Array.isArray(value))
        throw w.err(`tuple: invalid value ${value}`);
      w.pushObj(value, (fieldFn) => {
        for (let i = 0; i < fields.length; i++)
          fieldFn(`${i}`, () => fields[i].encodeStream(w, value[i]));
      });
    },
    decodeStream: (r) => {
      const res = [];
      r.pushObj(res, (fieldFn) => {
        for (let i = 0; i < fields.length; i++)
          fieldFn(`${i}`, () => res.push(fields[i].decodeStream(r)));
      });
      return res;
    },
    validate: (value) => {
      if (!Array.isArray(value))
        throw new Error(`tuple: invalid value ${value}`);
      if (value.length !== fields.length)
        throw new Error(`tuple: wrong length=${value.length}, expected ${fields.length}`);
      return value;
    }
  });
}
function array(len, inner) {
  if (!isCoder(inner))
    throw new TypeError(`array: invalid inner value ${inner}`);
  const _length = lengthCoder(typeof len === "string" ? `../${len}` : len);
  if (len === null && inner.size === 0)
    throw new Error("array: null length cannot use zero-size inner");
  return wrap({
    // `size: 0` is a valid fixed-size hint and must compose through arrays/tuples/structs.
    size: typeof len === "number" && inner.size !== void 0 ? len * inner.size : void 0,
    encodeStream: (w, value) => {
      const _w = w;
      _w.pushObj(value, (fieldFn) => {
        if (!isBytes3(len))
          _length.encodeStream(w, value.length);
        for (let i = 0; i < value.length; i++) {
          fieldFn(`${i}`, () => {
            const elm = value[i];
            const startPos = w.pos;
            inner.encodeStream(w, elm);
            if (isBytes3(len)) {
              if (len.length > _w.pos - startPos)
                return;
              const data = _w.finish(false).subarray(startPos, _w.pos);
              if (equalBytes(data.subarray(0, len.length), len))
                throw _w.err(`array: inner element encoding same as separator. elm=${elm} data=${data}`);
            }
          });
        }
      });
      if (isBytes3(len))
        w.bytes(len);
    },
    decodeStream: (r) => {
      const res = [];
      const _r = r;
      _r.pushObj(res, (fieldFn) => {
        if (len === null) {
          for (let i = 0; !r.isEnd(); i++) {
            fieldFn(`${i}`, () => {
              const progress = _r.progress();
              res.push(inner.decodeStream(r));
              if (_r.progress() === progress)
                throw r.err("array: inner decoder did not consume input");
            });
            if (inner.size && r.leftBytes < inner.size)
              break;
          }
        } else if (isBytes3(len)) {
          for (let i = 0; ; i++) {
            if (equalBytes(r.bytes(len.length, true), len)) {
              r.bytes(len.length);
              break;
            }
            fieldFn(`${i}`, () => {
              const progress = _r.progress();
              res.push(inner.decodeStream(r));
              if (_r.progress() === progress)
                throw r.err("array: inner decoder did not consume input");
            });
          }
        } else {
          let length;
          fieldFn("arrayLen", () => length = _length.decodeStream(r));
          for (let i = 0; i < length; i++)
            fieldFn(`${i}`, () => res.push(inner.decodeStream(r)));
        }
      });
      return res;
    },
    validate: (value) => {
      if (!Array.isArray(value))
        throw new Error(`array: invalid value ${value}`);
      return value;
    }
  });
}
var EMPTY, NULL, restrictedKeys, validateFieldName, findBytes, createView, _0n6, _1n5, _2n4, _8n2, _10n, _255n, hasOwn, utils, lengthCoder, Bitset, Path, _Reader, _Writer, swapEndianness, wrap, isBaseCoder, numberBigint, reverse, coders, bigint, U256BE, U64LE, I64LE, view, intView, U32LE, U32BE, I32LE, U16LE, U8, createBytes, string, createHex, flag;
var init_micro_packed = __esm({
  "node_modules/micro-packed/index.js"() {
    init_base();
    EMPTY = /* @__PURE__ */ Uint8Array.of();
    NULL = /* @__PURE__ */ Uint8Array.of(0);
    restrictedKeys = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);
    validateFieldName = (name, label) => {
      if (typeof name !== "string")
        throw new Error(`${label} should be string, got ${typeof name}`);
      if (name.includes(".."))
        throw new TypeError(`${label} ${name} cannot contain path parent ..`);
      if (name.includes("/"))
        throw new TypeError(`${label} ${name} cannot contain path separator /`);
      if (restrictedKeys.has(name))
        throw new Error(`${label} ${name} is reserved`);
    };
    findBytes = (needle, data, pos = 0) => createFindBytes(needle)(data, pos);
    createView = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
    _0n6 = /* @__PURE__ */ BigInt(0);
    _1n5 = /* @__PURE__ */ BigInt(1);
    _2n4 = /* @__PURE__ */ BigInt(2);
    _8n2 = /* @__PURE__ */ BigInt(8);
    _10n = /* @__PURE__ */ BigInt(10);
    _255n = /* @__PURE__ */ BigInt(255);
    hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
    utils = /* @__PURE__ */ Object.freeze({
      equalBytes,
      isBytes: isBytes3,
      isCoder,
      checkBounds,
      concatBytes: concatBytes2,
      createView,
      isPlainObject
    });
    lengthCoder = (len) => {
      if (len !== null && typeof len !== "string" && !isCoder(len) && !isBytes3(len) && !isNum(len)) {
        throw new TypeError(`lengthCoder: expected null | number | Uint8Array | CoderType, got ${len} (${typeof len})`);
      }
      if (typeof len === "number" && len < 0)
        throw new Error(`lengthCoder: wrong length=${len}`);
      if (isBytes3(len) && !len.length)
        throw new Error("lengthCoder: empty terminator");
      return {
        encodeStream(w, value) {
          if (len === null)
            return;
          if (isCoder(len))
            return len.encodeStream(w, value);
          let byteLen;
          if (typeof len === "number")
            byteLen = len;
          else if (typeof len === "string")
            byteLen = Path.resolve(w.stack, len);
          if (typeof byteLen === "bigint")
            byteLen = Number(byteLen);
          if (byteLen === void 0 || byteLen !== value)
            throw w.err(`Wrong length: ${byteLen} len=${len} exp=${value} (${typeof value})`);
        },
        decodeStream(r) {
          let byteLen;
          if (isCoder(len))
            byteLen = Number(len.decodeStream(r));
          else if (typeof len === "number")
            byteLen = len;
          else if (typeof len === "string")
            byteLen = Path.resolve(r.stack, len);
          if (typeof byteLen === "bigint")
            byteLen = Number(byteLen);
          if (!isNum(byteLen) || byteLen < 0)
            throw r.err(`Wrong length: ${byteLen}`);
          return byteLen;
        }
      };
    };
    Bitset = /* @__PURE__ */ Object.freeze({
      BITS: 32,
      FULL_MASK: -1 >>> 0,
      // 1<<32 will overflow
      len: (len) => {
        if (!isNum(len) || len < 0)
          throw new Error(`wrong len=${len}`);
        return Math.ceil(len / 32);
      },
      create: (len) => new Uint32Array(Bitset.len(len)),
      clean: (bs) => bs.fill(0),
      debug: (bs) => Array.from(bs).map((i) => (i >>> 0).toString(2).padStart(32, "0")),
      checkLen: (bs, len) => {
        if (Bitset.len(len) === bs.length)
          return;
        throw new Error(`wrong length=${bs.length}. Expected: ${Bitset.len(len)}`);
      },
      chunkLen: (bsLen, pos, len) => {
        if (!isNum(bsLen) || bsLen < 0)
          throw new Error(`wrong bsLen=${bsLen}`);
        if (!isNum(pos) || pos < 0)
          throw new Error(`wrong pos=${pos}`);
        if (!isNum(len) || len < 0)
          throw new Error(`wrong len=${len}`);
        if (pos > bsLen - len)
          throw new Error(`wrong range=${pos}/${len} of ${bsLen}`);
      },
      set: (bs, chunk, value, allowRewrite = true) => {
        if (!isNum(chunk) || chunk < 0 || chunk >= bs.length)
          return false;
        if (!allowRewrite && (bs[chunk] & value) !== 0)
          return false;
        bs[chunk] |= value;
        return true;
      },
      pos: (pos, i) => ({
        chunk: Math.floor((pos + i) / 32),
        mask: 1 << 32 - (pos + i) % 32 - 1
      }),
      indices: (bs, len, invert2 = false) => {
        Bitset.checkLen(bs, len);
        const { FULL_MASK, BITS } = Bitset;
        const left = BITS - len % BITS;
        const lastMask = left ? FULL_MASK >>> left << left : FULL_MASK;
        const res = [];
        for (let i = 0; i < bs.length; i++) {
          let c = bs[i];
          if (invert2)
            c = ~c;
          if (i === bs.length - 1)
            c &= lastMask;
          if (c === 0)
            continue;
          for (let j = 0; j < BITS; j++) {
            const m = 1 << BITS - j - 1;
            if (c & m)
              res.push(i * BITS + j);
          }
        }
        return res;
      },
      range: (arr) => {
        const res = [];
        let cur;
        for (const i of arr) {
          if (cur === void 0 || i !== cur.pos + cur.length)
            res.push(cur = { pos: i, length: 1 });
          else
            cur.length += 1;
        }
        return res;
      },
      rangeDebug: (bs, len, invert2 = false) => `[${Bitset.range(Bitset.indices(bs, len, invert2)).map((i) => `(${i.pos}/${i.length})`).join(", ")}]`,
      setRange: (bs, bsLen, pos, len, allowRewrite = true) => {
        Bitset.chunkLen(bsLen, pos, len);
        if (len === 0)
          return true;
        const { FULL_MASK, BITS } = Bitset;
        const first = pos % BITS ? Math.floor(pos / BITS) : void 0;
        const lastPos = pos + len;
        const last = lastPos % BITS ? Math.floor(lastPos / BITS) : void 0;
        const canSet = (chunk, value) => chunk >= 0 && chunk < bs.length && (bs[chunk] & value) === 0;
        if (!allowRewrite) {
          if (first !== void 0 && first === last) {
            if (!canSet(first, FULL_MASK >>> BITS - len << BITS - len - pos))
              return false;
          } else {
            if (first !== void 0 && !canSet(first, FULL_MASK >>> pos % BITS))
              return false;
            const start2 = first !== void 0 ? first + 1 : pos / BITS;
            const end2 = last !== void 0 ? last : lastPos / BITS;
            for (let i = start2; i < end2; i++)
              if (!canSet(i, FULL_MASK))
                return false;
            if (last !== void 0 && first !== last) {
              if (!canSet(last, FULL_MASK << BITS - lastPos % BITS))
                return false;
            }
          }
        }
        if (first !== void 0 && first === last)
          return Bitset.set(bs, first, FULL_MASK >>> BITS - len << BITS - len - pos, allowRewrite);
        if (first !== void 0) {
          if (!Bitset.set(bs, first, FULL_MASK >>> pos % BITS, allowRewrite))
            return false;
        }
        const start = first !== void 0 ? first + 1 : pos / BITS;
        const end = last !== void 0 ? last : lastPos / BITS;
        for (let i = start; i < end; i++)
          if (!Bitset.set(bs, i, FULL_MASK, allowRewrite))
            return false;
        if (last !== void 0 && first !== last) {
          if (!Bitset.set(bs, last, FULL_MASK << BITS - lastPos % BITS, allowRewrite))
            return false;
        }
        return true;
      }
    });
    Path = /* @__PURE__ */ Object.freeze({
      /**
       * Internal method for handling stack of paths (debug, errors, dynamic fields via path)
       * This callback shape forces stack cleanup by construction:
       * `.pop()` always happens after the wrapped function.
       * Also, this makes impossible:
       * - pushing field when stack is empty
       * - pushing field inside of field (real bug)
       * NOTE: we don't want to do '.pop' on error!
       */
      pushObj: (stack, obj, objFn) => {
        const last = { obj };
        stack.push(last);
        objFn((field, fieldFn) => {
          last.field = field;
          fieldFn();
          last.field = void 0;
        });
        stack.pop();
      },
      path: (stack) => {
        const res = [];
        for (const i of stack)
          if (i.field !== void 0)
            res.push(i.field === "" ? '""' : i.field);
        return res.join("/");
      },
      err: (name, stack, msg) => {
        const text = `${name}(${Path.path(stack)}): ${typeof msg === "string" ? msg : msg.message}`;
        const err = msg instanceof TypeError ? new TypeError(text) : msg instanceof RangeError ? new RangeError(text) : new Error(text);
        if (msg instanceof Error && msg.stack) {
          const from = `${msg.name}: ${msg.message}`;
          const to = `${err.name}: ${err.message}`;
          err.stack = msg.stack.startsWith(from) ? `${to}${msg.stack.slice(from.length)}` : msg.stack;
        }
        return err;
      },
      resolve: (stack, path2) => {
        const parts = path2.split("/");
        const objPath = stack.map((i2) => i2.obj);
        let i = 0;
        for (; i < parts.length; i++) {
          if (parts[i] === "..")
            objPath.pop();
          else
            break;
        }
        let cur = objPath.pop();
        for (; i < parts.length; i++) {
          if (!cur || cur[parts[i]] === void 0)
            return void 0;
          cur = cur[parts[i]];
        }
        return cur;
      }
    });
    _Reader = class __Reader {
      pos = 0;
      data;
      opts;
      stack;
      parent;
      parentOffset;
      bitBuf = 0;
      bitPos = 0;
      bs;
      // bitset
      view;
      constructor(data, opts = {}, stack = [], parent = void 0, parentOffset = 0) {
        this.data = data;
        this.opts = opts;
        this.stack = stack;
        this.parent = parent;
        this.parentOffset = parentOffset;
        this.view = createView(data);
      }
      /** Internal method for pointers. */
      _enablePointers() {
        if (this.parent)
          return this.parent._enablePointers();
        if (this.bs)
          return;
        this.bs = Bitset.create(this.data.length);
        Bitset.setRange(this.bs, this.data.length, 0, this.pos, this.opts.allowMultipleReads);
      }
      markBytesBS(pos, len) {
        if (this.parent)
          return this.parent.markBytesBS(this.parentOffset + pos, len);
        if (!len)
          return true;
        if (!this.bs)
          return true;
        return Bitset.setRange(this.bs, this.data.length, pos, len, false);
      }
      markBytes(len) {
        const pos = this.pos;
        const res = this.markBytesBS(pos, len);
        if (!this.opts.allowMultipleReads && !res)
          throw this.err(`multiple read pos=${pos} len=${len}`);
        this.pos += len;
        return res;
      }
      pushObj(obj, objFn) {
        return Path.pushObj(this.stack, obj, objFn);
      }
      readView(n, fn) {
        if (!isNum(n) || n < 0)
          throw this.err(`readView: wrong length=${n}`);
        if (this.pos + n > this.data.length)
          throw this.err("readView: Unexpected end of buffer");
        const res = fn(this.view, this.pos);
        this.markBytes(n);
        return res;
      }
      // read bytes by absolute offset
      absBytes(n) {
        if (!isNum(n) || n < 0 || n > this.data.length)
          throw new Error("Unexpected end of buffer");
        return this.data.subarray(n);
      }
      finish() {
        if (this.opts.allowUnreadBytes)
          return;
        if (this.bitPos) {
          throw this.err(`${this.bitPos} bits left after unpack: ${hex.encode(this.data.subarray(this.pos))}`);
        }
        if (this.bs && !this.parent) {
          const notRead = Bitset.indices(this.bs, this.data.length, true);
          if (notRead.length) {
            const formatted = Bitset.range(notRead).map(({ pos, length }) => `(${pos}/${length})[${hex.encode(this.data.subarray(pos, pos + length))}]`).join(", ");
            throw this.err(`unread byte ranges: ${formatted} (total=${this.data.length})`);
          } else
            return;
        }
        if (!this.isEnd()) {
          throw this.err(`${this.leftBytes} bytes ${this.bitPos} bits left after unpack: ${hex.encode(this.data.subarray(this.pos))}`);
        }
      }
      // User methods
      err(msg) {
        return Path.err("Reader", this.stack, msg);
      }
      offsetReader(n) {
        if (!isNum(n) || n < 0 || n > this.data.length)
          throw this.err("offsetReader: Unexpected end of buffer");
        return new __Reader(this.absBytes(n), this.opts, this.stack, this, n);
      }
      bytes(n, peek = false) {
        if (this.bitPos)
          throw this.err("readBytes: bitPos not empty");
        if (!isNum(n) || n < 0)
          throw this.err(`readBytes: wrong length=${n}`);
        if (this.pos + n > this.data.length)
          throw this.err("readBytes: Unexpected end of buffer");
        const slice = this.data.subarray(this.pos, this.pos + n);
        if (!peek)
          this.markBytes(n);
        return slice;
      }
      byte(peek = false) {
        if (this.bitPos)
          throw this.err("readByte: bitPos not empty");
        if (this.pos + 1 > this.data.length)
          throw this.err("readByte: Unexpected end of buffer");
        const data = this.data[this.pos];
        if (!peek)
          this.markBytes(1);
        return data;
      }
      get leftBytes() {
        return this.data.length - this.pos;
      }
      get totalBytes() {
        return this.data.length;
      }
      isEnd() {
        return this.pos >= this.data.length && !this.bitPos;
      }
      progress() {
        return this.pos * 8 - this.bitPos;
      }
      // bits are read in BE mode (left to right): (0b1000_0000).readBits(1) == 1
      bits(bits) {
        if (!isNum(bits) || bits < 0)
          throw this.err(`BitReader: wrong length=${bits}`);
        if (bits > 32)
          throw this.err("BitReader: cannot read more than 32 bits in single call");
        let out = 0;
        while (bits) {
          if (!this.bitPos) {
            this.bitBuf = this.byte();
            this.bitPos = 8;
          }
          const take = Math.min(bits, this.bitPos);
          this.bitPos -= take;
          out = out << take | this.bitBuf >> this.bitPos & 2 ** take - 1;
          this.bitBuf &= 2 ** this.bitPos - 1;
          bits -= take;
        }
        return out >>> 0;
      }
      find(needle, pos = this.pos) {
        if (!isBytes3(needle))
          throw this.err(`find: needle is not bytes! ${needle}`);
        if (this.bitPos)
          throw this.err("find: bitPos not empty");
        if (!needle.length)
          throw this.err(`find: needle is empty`);
        if (!isNum(pos) || pos < 0)
          throw this.err(`find: wrong pos=${pos}`);
        return findBytes(needle, this.data, pos);
      }
    };
    _Writer = class {
      pos = 0;
      stack;
      // We could have a single buffer here and re-alloc it with
      // x1.5-2 size each time it full, but it will be slower:
      // basic/encode bench: 395ns -> 560ns
      buffers = [];
      cleanBuffers = [];
      ptrs = [];
      bitBuf = 0;
      bitPos = 0;
      viewBuf = new Uint8Array(8);
      view;
      finished = false;
      constructor(stack = []) {
        this.stack = stack;
        this.view = createView(this.viewBuf);
      }
      pushObj(obj, objFn) {
        return Path.pushObj(this.stack, obj, objFn);
      }
      writeView(len, fn) {
        if (this.finished)
          throw this.err("buffer: finished");
        if (!isNum(len) || len < 0 || len > 8)
          throw new Error(`wrong writeView length=${len}`);
        fn(this.view);
        const buf = this.viewBuf.slice(0, len);
        this.bytes(buf);
        this.cleanBuffers.push(buf);
        this.viewBuf.fill(0);
      }
      // User methods
      err(msg) {
        return Path.err("Writer", this.stack, msg);
      }
      bytes(b) {
        if (this.finished)
          throw this.err("buffer: finished");
        if (this.bitPos)
          throw this.err("writeBytes: ends with non-empty bit buffer");
        this.buffers.push(b);
        this.pos += b.length;
      }
      byte(b) {
        if (this.finished)
          throw this.err("buffer: finished");
        if (this.bitPos)
          throw this.err("writeByte: ends with non-empty bit buffer");
        if (!isNum(b) || b < 0 || b > 255)
          throw this.err(`writeByte: wrong value=${b}`);
        const buf = new Uint8Array([b]);
        this.buffers.push(buf);
        this.cleanBuffers.push(buf);
        this.pos++;
      }
      finish(clean = true) {
        if (this.finished)
          throw this.err("buffer: finished");
        if (this.bitPos)
          throw this.err("buffer: ends with non-empty bit buffer");
        const buffers = this.buffers.concat(this.ptrs.map((i) => i.buffer));
        const sum = buffers.map((b) => b.length).reduce((a, b) => a + b, 0);
        const buf = new Uint8Array(sum);
        for (let i = 0, pad = 0; i < buffers.length; i++) {
          const a = buffers[i];
          buf.set(a, pad);
          pad += a.length;
        }
        for (let pos = this.pos, i = 0; i < this.ptrs.length; i++) {
          const ptr = this.ptrs[i];
          buf.set(ptr.ptr.encode(pos), ptr.pos);
          pos += ptr.buffer.length;
        }
        if (clean) {
          for (const b of this.cleanBuffers)
            b.fill(0);
          this.buffers = [];
          this.cleanBuffers = [];
          for (const p of this.ptrs)
            p.buffer.fill(0);
          this.ptrs = [];
          this.finished = true;
          this.bitBuf = 0;
        }
        return buf;
      }
      bits(value, bits) {
        if (this.finished)
          throw this.err("buffer: finished");
        if (!isNum(bits) || bits < 0)
          throw this.err(`writeBits: wrong length=${bits}`);
        if (bits > 32)
          throw this.err("writeBits: cannot write more than 32 bits in single call");
        if (!isNum(value) || value < 0)
          throw this.err(`writeBits: wrong value=${value}`);
        if (value >= 2 ** bits)
          throw this.err(`writeBits: value (${value}) >= 2**bits (${bits})`);
        while (bits) {
          const take = Math.min(bits, 8 - this.bitPos);
          this.bitBuf = this.bitBuf << take | value >> bits - take;
          this.bitPos += take;
          bits -= take;
          value &= 2 ** bits - 1;
          if (this.bitPos === 8) {
            this.bitPos = 0;
            const buf = new Uint8Array([this.bitBuf]);
            this.buffers.push(buf);
            this.cleanBuffers.push(buf);
            this.pos++;
          }
        }
      }
    };
    swapEndianness = (b) => Uint8Array.from(b).reverse();
    wrap = (inner) => {
      const _inner = inner;
      if (!isPlainObject(_inner))
        throw new TypeError(`wrap: invalid inner value ${_inner}`);
      if (typeof _inner.encodeStream !== "function")
        throw new TypeError("wrap: encodeStream should be function");
      if (typeof _inner.decodeStream !== "function")
        throw new TypeError("wrap: decodeStream should be function");
      if (_inner.size !== void 0 && (!isNum(_inner.size) || _inner.size < 0))
        throw new TypeError(`wrap: invalid size ${_inner.size}`);
      if (_inner.validate !== void 0 && typeof _inner.validate !== "function")
        throw new TypeError("wrap: validate should be function");
      const res = _wrap(_inner);
      return _inner.validate !== void 0 ? validate(res, _inner.validate) : res;
    };
    isBaseCoder = (elm) => isPlainObject(elm) && typeof elm.decode === "function" && typeof elm.encode === "function";
    numberBigint = /* @__PURE__ */ Object.freeze({
      encode: (from) => {
        if (typeof from !== "bigint")
          throw new Error(`expected bigint, got ${typeof from}`);
        if (from > BigInt(Number.MAX_SAFE_INTEGER))
          throw new Error(`element bigger than MAX_SAFE_INTEGER=${from}`);
        if (from < BigInt(Number.MIN_SAFE_INTEGER))
          throw new Error(`element smaller than MIN_SAFE_INTEGER=${from}`);
        return Number(from);
      },
      decode: (to) => {
        if (!isNum(to))
          throw new Error("element is not a safe integer");
        return BigInt(to);
      }
    });
    reverse = (coder) => {
      if (!isBaseCoder(coder))
        throw new Error("BaseCoder expected");
      return { encode: (to) => coder.decode(to), decode: (from) => coder.encode(from) };
    };
    coders = /* @__PURE__ */ Object.freeze({ dict, numberBigint, tsEnum, decimal, match, reverse });
    bigint = (size, le = false, signed = false, sized = true) => {
      if (!isNum(size) || size <= 0)
        throw new Error(`bigint/size: wrong value ${size}`);
      if (typeof le !== "boolean")
        throw new Error(`bigint/le: expected boolean, got ${typeof le}`);
      if (typeof signed !== "boolean")
        throw new Error(`bigint/signed: expected boolean, got ${typeof signed}`);
      if (typeof sized !== "boolean")
        throw new Error(`bigint/sized: expected boolean, got ${typeof sized}`);
      const bLen = BigInt(size);
      const signBit = _2n4 ** (_8n2 * bLen - _1n5);
      return wrap({
        size: sized ? size : void 0,
        encodeStream: (w, value) => {
          const zero = value === _0n6;
          if (signed && value < 0)
            value = value | signBit;
          const b = [];
          for (let i = 0; i < size; i++) {
            b.push(Number(value & _255n));
            value >>= _8n2;
          }
          let res = new Uint8Array(b).reverse();
          if (!sized) {
            let pos = 0;
            if (signed) {
              for (; pos < res.length - 1; pos++) {
                const next = res[pos + 1];
                if (res[pos] === 0 && (next & 128) === 0)
                  continue;
                if (res[pos] === 255 && (next & 128) !== 0)
                  continue;
                break;
              }
              res = zero ? res.subarray(res.length) : res.subarray(pos);
            } else {
              for (; pos < res.length; pos++)
                if (res[pos] !== 0)
                  break;
              res = res.subarray(pos);
            }
          }
          w.bytes(le ? res.reverse() : res);
        },
        decodeStream: (r) => {
          const value = r.bytes(sized ? size : Math.min(size, r.leftBytes));
          const b = le ? value : swapEndianness(value);
          let res = _0n6;
          for (let i = 0; i < b.length; i++)
            res |= BigInt(b[i]) << _8n2 * BigInt(i);
          const sBit = sized || !value.length ? signBit : _2n4 ** (_8n2 * BigInt(value.length) - _1n5);
          if (signed && res & sBit)
            res = (res ^ sBit) - sBit;
          return res;
        },
        validate: (value) => {
          if (typeof value !== "bigint")
            throw new Error(`bigint: invalid value: ${value}`);
          checkBounds(value, _8n2 * bLen, !!signed);
          return value;
        }
      });
    };
    U256BE = /* @__PURE__ */ Object.freeze(
      /* @__PURE__ */ bigint(32, false)
    );
    U64LE = /* @__PURE__ */ Object.freeze(
      /* @__PURE__ */ bigint(8, true)
    );
    I64LE = /* @__PURE__ */ Object.freeze(
      /* @__PURE__ */ bigint(8, true, true)
    );
    view = (len, opts) => wrap({
      size: len,
      encodeStream: (w, value) => w.writeView(len, (view2) => opts.write(view2, value)),
      decodeStream: (r) => r.readView(len, opts.read),
      validate: (value) => {
        if (typeof value !== "number")
          throw new TypeError(`viewCoder: expected number, got ${typeof value}`);
        if (opts.validate)
          opts.validate(value);
        return value;
      }
    });
    intView = (len, signed, opts) => {
      const bits = len * 8;
      const signBit = 2 ** (bits - 1);
      const validateSigned = (value) => {
        if (!isNum(value))
          throw new TypeError(`sintView: value is not safe integer: ${value}`);
        if (value < -signBit || value >= signBit) {
          throw new RangeError(`sintView: value out of bounds. Expected ${-signBit} <= ${value} < ${signBit}`);
        }
      };
      const maxVal = 2 ** bits;
      const validateUnsigned = (value) => {
        if (!isNum(value))
          throw new TypeError(`uintView: value is not safe integer: ${value}`);
        if (0 > value || value >= maxVal) {
          throw new RangeError(`uintView: value out of bounds. Expected 0 <= ${value} < ${maxVal}`);
        }
      };
      return view(len, {
        write: opts.write,
        read: opts.read,
        validate: signed ? validateSigned : validateUnsigned
      });
    };
    U32LE = /* @__PURE__ */ Object.freeze(
      /* @__PURE__ */ intView(4, false, {
        read: (view2, pos) => view2.getUint32(pos, true),
        write: (view2, value) => view2.setUint32(0, value, true)
      })
    );
    U32BE = /* @__PURE__ */ Object.freeze(
      /* @__PURE__ */ intView(4, false, {
        read: (view2, pos) => view2.getUint32(pos, false),
        write: (view2, value) => view2.setUint32(0, value, false)
      })
    );
    I32LE = /* @__PURE__ */ Object.freeze(
      /* @__PURE__ */ intView(4, true, {
        read: (view2, pos) => view2.getInt32(pos, true),
        write: (view2, value) => view2.setInt32(0, value, true)
      })
    );
    U16LE = /* @__PURE__ */ Object.freeze(
      /* @__PURE__ */ intView(2, false, {
        read: (view2, pos) => view2.getUint16(pos, true),
        write: (view2, value) => view2.setUint16(0, value, true)
      })
    );
    U8 = /* @__PURE__ */ Object.freeze(
      /* @__PURE__ */ intView(1, false, {
        read: (view2, pos) => view2.getUint8(pos),
        write: (view2, value) => view2.setUint8(0, value)
      })
    );
    createBytes = (len, le = false) => {
      if (typeof le !== "boolean")
        throw new TypeError(`bytes/le: expected boolean, got ${typeof le}`);
      const _length = lengthCoder(len);
      const _isb = isBytes3(len);
      const terminator = _isb ? Uint8Array.from(len) : void 0;
      const findTerminator = terminator && terminator.length ? createFindBytes(terminator) : void 0;
      return wrap({
        size: typeof len === "number" ? len : void 0,
        encodeStream: (w, value) => {
          if (!_isb)
            _length.encodeStream(w, value.length);
          w.bytes(le ? swapEndianness(value) : value);
          if (terminator)
            w.bytes(terminator);
        },
        decodeStream: (r) => {
          let bytes2;
          if (terminator) {
            const tPos = r.find(terminator);
            if (tPos === void 0)
              throw r.err(`bytes: cannot find terminator`);
            bytes2 = r.bytes(tPos - r.pos);
            r.bytes(terminator.length);
          } else {
            bytes2 = r.bytes(len === null ? r.leftBytes : _length.decodeStream(r));
          }
          return le ? swapEndianness(bytes2) : bytes2;
        },
        validate: (value) => {
          if (!isBytes3(value))
            throw new TypeError(`bytes: invalid value ${value}`);
          if (findTerminator) {
            const data = le ? swapEndianness(value) : value;
            if (findTerminator(data) !== void 0)
              throw new Error("bytes: value contains terminator");
          }
          return value;
        }
      });
    };
    string = (len, le = false) => validate(apply(createBytes(len, le), utf8), (value) => {
      if (typeof value !== "string")
        throw new Error(`expected string, got ${typeof value}`);
      return value;
    });
    createHex = (len, options = { isLE: false, with0x: false }) => {
      const isLE = options.isLE === void 0 ? false : options.isLE;
      const prefix2 = options.with0x === void 0 ? false : options.with0x;
      if (typeof isLE !== "boolean")
        throw new Error(`hex/isLE: expected boolean, got ${typeof isLE}`);
      if (typeof prefix2 !== "boolean")
        throw new Error(`hex/with0x: expected boolean, got ${typeof prefix2}`);
      let inner = apply(createBytes(len, isLE), hex);
      if (prefix2) {
        inner = apply(inner, {
          encode: (value) => `0x${value}`,
          decode: (value) => {
            if (!value.startsWith("0x"))
              throw new Error("hex(with0x=true).encode input should start with 0x");
            return value.slice(2);
          }
        });
      }
      return inner;
    };
    flag = (flagValue, xor = false) => {
      if (!isBytes3(flagValue))
        throw new TypeError(`flag/flagValue: expected Uint8Array, got ${typeof flagValue}`);
      if (flagValue.length === 0)
        throw new Error("flag/flagValue: empty marker");
      if (typeof xor !== "boolean")
        throw new TypeError(`flag/xor: expected boolean, got ${typeof xor}`);
      return wrap({
        // Marker flags encode one state as empty, so encoded length depends on the boolean value.
        size: void 0,
        encodeStream: (w, value) => {
          if (!!value !== xor)
            w.bytes(flagValue);
        },
        decodeStream: (r) => {
          let hasFlag = r.leftBytes >= flagValue.length;
          if (hasFlag) {
            hasFlag = equalBytes(r.bytes(flagValue.length, true), flagValue);
            if (hasFlag)
              r.bytes(flagValue.length);
          }
          return hasFlag !== xor;
        },
        validate: (value) => {
          if (value !== void 0 && typeof value !== "boolean")
            throw new Error(`flag: expected boolean value or undefined, got ${typeof value}`);
          return value;
        }
      });
    };
  }
});

// node_modules/@scure/btc-signer/utils.js
function signECDSA(hash, privateKey, lowR = false) {
  abytes(hash, 32, "hash");
  let sig = secp256k1.Signature.fromBytes(secp256k1.sign(hash, privateKey, { prehash: false }));
  if (lowR && !hasLowR(sig)) {
    const extraEntropy = new Uint8Array(32);
    let counter = 0;
    while (!hasLowR(sig)) {
      extraEntropy.set(U32LE.encode(counter++));
      sig = secp256k1.Signature.fromBytes(secp256k1.sign(hash, privateKey, { prehash: false, extraEntropy }));
      if (counter > 4294967295)
        throw new Error("lowR counter overflow: report the error");
    }
  }
  return sig.toBytes("der");
}
function validatePubkey(pub, type) {
  const len = pub.length;
  if (type === PubT.ecdsa) {
    if (len === 32)
      throw new RangeError("Expected non-Schnorr key");
    Point.fromBytes(pub);
    return pub;
  } else if (type === PubT.schnorr) {
    if (len !== 32)
      throw new RangeError("Expected 32-byte Schnorr key");
    schnorr.utils.lift_x(bytesToNumberBE(pub));
    return pub;
  } else {
    throw new TypeError("Unknown key type");
  }
}
function tapTweak(a, b) {
  const u = schnorr.utils;
  const t = u.taggedHash("TapTweak", a, b);
  const tn = bytesToNumberBE(t);
  if (tn >= CURVE_ORDER)
    throw new Error("tweak higher than curve order");
  return tn;
}
function taprootTweakPrivKey(privKey, merkleRoot = Uint8Array.of()) {
  const u = schnorr.utils;
  abytes(privKey, 32, "privKey");
  const seckey0 = bytesToNumberBE(privKey);
  const P = Point.BASE.multiply(seckey0);
  const seckey = hasEven2(P.y) ? seckey0 : Fn.neg(seckey0);
  const xP = u.pointToBytes(P);
  const t = tapTweak(xP, merkleRoot);
  return numberToBytesBE(Fn.add(seckey, t), 32);
}
function taprootTweakPubkey(pubKey, h) {
  const u = schnorr.utils;
  abytes(pubKey, 32, "pubKey");
  const t = tapTweak(pubKey, h);
  const P = u.lift_x(bytesToNumberBE(pubKey));
  const Q = P.add(Point.BASE.multiply(t));
  const parity = hasEven2(Q.y) ? 0 : 1;
  return [u.pointToBytes(Q), parity];
}
function compareBytes(a, b) {
  if (!isBytes4(a) || !isBytes4(b))
    throw new TypeError(`cmp: wrong type a=${typeof a} b=${typeof b}`);
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++)
    if (a[i] != b[i])
      return Math.sign(a[i] - b[i]);
  return Math.sign(a.length - b.length);
}
function reverseObject(obj) {
  const res = /* @__PURE__ */ Object.create(null);
  for (const k in obj) {
    if (res[obj[k]] !== void 0)
      throw new Error("duplicate key");
    res[obj[k]] = k;
  }
  return res;
}
var import_legacy, import_sha22, import_utils9, import_utils10, Point, Fn, CURVE_ORDER, hasEven2, isBytes4, concatBytes3, equalBytes2, sha2563, hash160, sha256x2, randomPrivateKeyBytes, pubSchnorr, pubECDSA, hasLowR, signSchnorr, tagSchnorr, PubT, TAPROOT_UNSPENDABLE_KEY, NETWORK, TEST_NETWORK;
var init_utils2 = __esm({
  "node_modules/@scure/btc-signer/utils.js"() {
    init_secp256k1();
    init_utils();
    import_legacy = require("@noble/hashes/legacy.js");
    import_sha22 = require("@noble/hashes/sha2.js");
    import_utils9 = require("@noble/hashes/utils.js");
    init_micro_packed();
    import_utils10 = require("@noble/hashes/utils.js");
    Point = /* @__PURE__ */ (() => secp256k1.Point)();
    Fn = /* @__PURE__ */ (() => Point.Fn)();
    CURVE_ORDER = /* @__PURE__ */ (() => Point.Fn.ORDER)();
    hasEven2 = (y) => y % 2n === 0n;
    isBytes4 = /* @__PURE__ */ (() => utils.isBytes)();
    concatBytes3 = /* @__PURE__ */ (() => utils.concatBytes)();
    equalBytes2 = /* @__PURE__ */ (() => utils.equalBytes)();
    sha2563 = /* @__PURE__ */ (() => import_sha22.sha256)();
    hash160 = (msg) => (0, import_legacy.ripemd160)(sha2563(msg));
    sha256x2 = (...msgs) => sha2563(sha2563(concatBytes3(...msgs)));
    randomPrivateKeyBytes = () => schnorr.utils.randomSecretKey();
    pubSchnorr = (priv) => schnorr.getPublicKey(priv);
    pubECDSA = (privateKey, isCompressed) => secp256k1.getPublicKey(privateKey, isCompressed);
    hasLowR = (sig) => sig.r < CURVE_ORDER / 2n;
    signSchnorr = (message, secretKey, auxRand) => schnorr.sign(message, secretKey, auxRand);
    tagSchnorr = (tag, ...messages) => schnorr.utils.taggedHash(tag, ...messages);
    PubT = /* @__PURE__ */ (() => Object.freeze({
      ecdsa: 0,
      schnorr: 1
    }))();
    TAPROOT_UNSPENDABLE_KEY = /* @__PURE__ */ (() => sha2563(Point.BASE.toBytes(false)))();
    NETWORK = /* @__PURE__ */ Object.freeze({
      bech32: "bc",
      pubKeyHash: 0,
      scriptHash: 5,
      wif: 128
    });
    TEST_NETWORK = /* @__PURE__ */ Object.freeze({
      bech32: "tb",
      pubKeyHash: 111,
      scriptHash: 196,
      wif: 239
    });
  }
});

// node_modules/@scure/btc-signer/node_modules/@scure/base/index.js
function isBytes5(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
function abytes3(b) {
  if (!isBytes5(b))
    throw new TypeError("Uint8Array expected");
}
function isArrayOf2(isString, arr) {
  if (!Array.isArray(arr))
    return false;
  if (arr.length === 0)
    return true;
  if (isString) {
    return arr.every((item) => typeof item === "string");
  } else {
    return arr.every((item) => Number.isSafeInteger(item));
  }
}
function afn2(input) {
  if (typeof input !== "function")
    throw new TypeError("function expected");
  return true;
}
function astr2(label, input) {
  if (typeof input !== "string")
    throw new TypeError(`${label}: string expected`);
  return true;
}
function anumber3(n) {
  if (typeof n !== "number")
    throw new TypeError(`number expected, got ${typeof n}`);
  if (!Number.isSafeInteger(n))
    throw new RangeError(`invalid integer: ${n}`);
}
function aArr2(input) {
  if (!Array.isArray(input))
    throw new TypeError("array expected");
}
function astrArr2(label, input) {
  if (!isArrayOf2(true, input))
    throw new TypeError(`${label}: array of strings expected`);
}
function anumArr2(label, input) {
  if (!isArrayOf2(false, input))
    throw new TypeError(`${label}: array of numbers expected`);
}
// @__NO_SIDE_EFFECTS__
function chain2(...args) {
  const id = (a) => a;
  const wrap2 = (a, b) => (c) => a(b(c));
  const encode = args.map((x) => x.encode).reduceRight(wrap2, id);
  const decode = args.map((x) => x.decode).reduce(wrap2, id);
  return { encode, decode };
}
// @__NO_SIDE_EFFECTS__
function alphabet2(letters) {
  const lettersA = typeof letters === "string" ? letters.split("") : letters;
  const len = lettersA.length;
  astrArr2("alphabet", lettersA);
  const indexes = new Map(lettersA.map((l, i) => [l, i]));
  return {
    encode: (digits) => {
      aArr2(digits);
      return digits.map((i) => {
        if (!Number.isSafeInteger(i) || i < 0 || i >= len)
          throw new Error(`alphabet.encode: digit index outside alphabet "${i}". Allowed: ${letters}`);
        return lettersA[i];
      });
    },
    decode: (input) => {
      aArr2(input);
      return input.map((letter) => {
        astr2("alphabet.decode", letter);
        const i = indexes.get(letter);
        if (i === void 0)
          throw new Error(`Unknown letter: "${letter}". Allowed: ${letters}`);
        return i;
      });
    }
  };
}
// @__NO_SIDE_EFFECTS__
function join2(separator = "") {
  astr2("join", separator);
  return {
    encode: (from) => {
      astrArr2("join.decode", from);
      return from.join(separator);
    },
    decode: (to) => {
      astr2("join.decode", to);
      return to.split(separator);
    }
  };
}
// @__NO_SIDE_EFFECTS__
function normalize2(fn) {
  afn2(fn);
  return { encode: (from) => from, decode: (to) => fn(to) };
}
function convertRadix(data, from, to) {
  if (from < 2)
    throw new RangeError(`convertRadix: invalid from=${from}, base cannot be less than 2`);
  if (to < 2)
    throw new RangeError(`convertRadix: invalid to=${to}, base cannot be less than 2`);
  aArr2(data);
  if (!data.length)
    return [];
  let pos = 0;
  const res = [];
  const digits = Array.from(data, (d) => {
    anumber3(d);
    if (d < 0 || d >= from)
      throw new Error(`invalid integer: ${d}`);
    return d;
  });
  const dlen = digits.length;
  while (true) {
    let carry = 0;
    let done = true;
    for (let i = pos; i < dlen; i++) {
      const digit = digits[i];
      const fromCarry = from * carry;
      const digitBase = fromCarry + digit;
      if (!Number.isSafeInteger(digitBase) || fromCarry / from !== carry || digitBase - digit !== fromCarry) {
        throw new Error("convertRadix: carry overflow");
      }
      const div = digitBase / to;
      carry = digitBase % to;
      const rounded = Math.floor(div);
      digits[i] = rounded;
      if (!Number.isSafeInteger(rounded) || rounded * to + carry !== digitBase)
        throw new Error("convertRadix: carry overflow");
      if (!done)
        continue;
      else if (!rounded)
        pos = i;
      else
        done = false;
    }
    res.push(carry);
    if (done)
      break;
  }
  for (let i = 0; i < data.length - 1 && data[i] === 0; i++)
    res.push(0);
  return res.reverse();
}
function convertRadix22(data, from, to, padding2) {
  aArr2(data);
  if (from <= 0 || from > 32)
    throw new RangeError(`convertRadix2: wrong from=${from}`);
  if (to <= 0 || to > 32)
    throw new RangeError(`convertRadix2: wrong to=${to}`);
  if (/* @__PURE__ */ radix2carry2(from, to) > 32) {
    throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${/* @__PURE__ */ radix2carry2(from, to)}`);
  }
  let carry = 0;
  let pos = 0;
  const max = powers2[from];
  const mask = powers2[to] - 1;
  const res = [];
  for (const n of data) {
    anumber3(n);
    if (n >= max)
      throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
    carry = carry << from | n;
    if (pos + from > 32)
      throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
    pos += from;
    for (; pos >= to; pos -= to)
      res.push((carry >> pos - to & mask) >>> 0);
    const pow = powers2[pos];
    if (pow === void 0)
      throw new Error("invalid carry");
    carry &= pow - 1;
  }
  carry = carry << to - pos & mask;
  if (!padding2 && pos >= from)
    throw new Error("Excess padding");
  if (!padding2 && carry > 0)
    throw new Error(`Non-zero padding: ${carry}`);
  if (padding2 && pos > 0)
    res.push(carry >>> 0);
  return res;
}
// @__NO_SIDE_EFFECTS__
function radix(num2) {
  anumber3(num2);
  const _256 = 2 ** 8;
  return {
    encode: (bytes2) => {
      if (!isBytes5(bytes2))
        throw new TypeError("radix.encode input should be Uint8Array");
      return convertRadix(Array.from(bytes2), _256, num2);
    },
    decode: (digits) => {
      anumArr2("radix.decode", digits);
      return Uint8Array.from(convertRadix(digits, num2, _256));
    }
  };
}
// @__NO_SIDE_EFFECTS__
function radix22(bits, revPadding = false) {
  anumber3(bits);
  if (bits <= 0 || bits > 32)
    throw new RangeError("radix2: bits should be in (0..32]");
  if (/* @__PURE__ */ radix2carry2(8, bits) > 32 || /* @__PURE__ */ radix2carry2(bits, 8) > 32)
    throw new RangeError("radix2: carry overflow");
  return {
    encode: (bytes2) => {
      if (!isBytes5(bytes2))
        throw new TypeError("radix2.encode input should be Uint8Array");
      return convertRadix22(Array.from(bytes2), 8, bits, !revPadding);
    },
    decode: (digits) => {
      anumArr2("radix2.decode", digits);
      return Uint8Array.from(convertRadix22(digits, bits, 8, revPadding));
    }
  };
}
function unsafeWrapper(fn) {
  afn2(fn);
  return function(...args) {
    try {
      return fn.apply(null, args);
    } catch (e) {
    }
  };
}
function checksum(len, fn) {
  anumber3(len);
  if (len <= 0)
    throw new RangeError(`checksum length must be positive: ${len}`);
  afn2(fn);
  const _fn = fn;
  return {
    encode(data) {
      if (!isBytes5(data))
        throw new TypeError("checksum.encode: input should be Uint8Array");
      const sum = _fn(data).slice(0, len);
      const res = new Uint8Array(data.length + len);
      res.set(data);
      res.set(sum, data.length);
      return res;
    },
    decode(data) {
      if (!isBytes5(data))
        throw new TypeError("checksum.decode: input should be Uint8Array");
      const payload = data.slice(0, -len);
      const oldChecksum = data.slice(-len);
      const newChecksum = _fn(payload).slice(0, len);
      for (let i = 0; i < len; i++)
        if (newChecksum[i] !== oldChecksum[i])
          throw new Error("Invalid checksum");
      return payload;
    }
  };
}
function bech32Polymod(pre) {
  const b = pre >> 25;
  let chk = (pre & 33554431) << 5;
  for (let i = 0; i < POLYMOD_GENERATORS.length; i++) {
    if ((b >> i & 1) === 1)
      chk ^= POLYMOD_GENERATORS[i];
  }
  return chk;
}
function bechChecksum(prefix2, words, encodingConst = 1) {
  const len = prefix2.length;
  let chk = 1;
  for (let i = 0; i < len; i++) {
    const c = prefix2.charCodeAt(i);
    if (c < 33 || c > 126)
      throw new Error(`Invalid prefix (${prefix2})`);
    chk = bech32Polymod(chk) ^ c >> 5;
  }
  chk = bech32Polymod(chk);
  for (let i = 0; i < len; i++)
    chk = bech32Polymod(chk) ^ prefix2.charCodeAt(i) & 31;
  for (let v of words)
    chk = bech32Polymod(chk) ^ v;
  for (let i = 0; i < 6; i++)
    chk = bech32Polymod(chk);
  chk ^= encodingConst;
  return BECH_ALPHABET.encode(convertRadix22([chk % powers2[30]], 30, 5, false));
}
// @__NO_SIDE_EFFECTS__
function genBech32(encoding) {
  const ENCODING_CONST = encoding === "bech32" ? 1 : 734539939;
  const _words = /* @__PURE__ */ radix22(5);
  const fromWords = _words.decode;
  const toWords = _words.encode;
  const fromWordsUnsafe = unsafeWrapper(fromWords);
  function encode(prefix2, words, limit = 90) {
    astr2("bech32.encode prefix", prefix2);
    if (isBytes5(words))
      words = Array.from(words);
    anumArr2("bech32.encode", words);
    const plen = prefix2.length;
    if (plen === 0)
      throw new TypeError(`Invalid prefix length ${plen}`);
    const actualLength = plen + 7 + words.length;
    if (limit !== false && actualLength > limit)
      throw new TypeError(`Length ${actualLength} exceeds limit ${limit}`);
    const lowered = prefix2.toLowerCase();
    const sum = bechChecksum(lowered, words, ENCODING_CONST);
    return `${lowered}1${BECH_ALPHABET.encode(words)}${sum}`;
  }
  function decode(str2, limit = 90) {
    astr2("bech32.decode input", str2);
    const slen = str2.length;
    if (slen < 8 || limit !== false && slen > limit)
      throw new TypeError(`invalid string length: ${slen} (${str2}). Expected (8..${limit})`);
    const lowered = str2.toLowerCase();
    if (str2 !== lowered && str2 !== str2.toUpperCase())
      throw new Error(`String must be lowercase or uppercase`);
    const sepIndex = lowered.lastIndexOf("1");
    if (sepIndex === 0 || sepIndex === -1)
      throw new Error(`Letter "1" must be present between prefix and data only`);
    const prefix2 = lowered.slice(0, sepIndex);
    const data = lowered.slice(sepIndex + 1);
    if (data.length < 6)
      throw new Error("Data must be at least 6 characters long");
    const words = BECH_ALPHABET.decode(data).slice(0, -6);
    const sum = bechChecksum(prefix2, words, ENCODING_CONST);
    if (!data.endsWith(sum))
      throw new Error(`Invalid checksum in ${str2}: expected "${sum}"`);
    return { prefix: prefix2, words };
  }
  const decodeUnsafe = unsafeWrapper(decode);
  function decodeToBytes(str2) {
    const { prefix: prefix2, words } = decode(str2, false);
    return {
      prefix: prefix2,
      words,
      bytes: fromWords(words)
    };
  }
  function encodeFromBytes(prefix2, bytes2) {
    return encode(prefix2, toWords(bytes2));
  }
  return {
    encode,
    decode,
    encodeFromBytes,
    decodeToBytes,
    decodeUnsafe,
    fromWords,
    fromWordsUnsafe,
    toWords
  };
}
var gcd2, radix2carry2, powers2, genBase58, base58, createBase58check, BECH_ALPHABET, POLYMOD_GENERATORS, bech32, bech32m, hasHexBuiltin2, hexBuiltin2, hex2;
var init_base2 = __esm({
  "node_modules/@scure/btc-signer/node_modules/@scure/base/index.js"() {
    gcd2 = (a, b) => b === 0 ? a : gcd2(b, a % b);
    radix2carry2 = /* @__NO_SIDE_EFFECTS__ */ (from, to) => from + (to - gcd2(from, to));
    powers2 = /* @__PURE__ */ (() => {
      let res = [];
      for (let i = 0; i < 40; i++)
        res.push(2 ** i);
      return res;
    })();
    genBase58 = /* @__NO_SIDE_EFFECTS__ */ (abc) => /* @__PURE__ */ chain2(/* @__PURE__ */ radix(58), /* @__PURE__ */ alphabet2(abc), /* @__PURE__ */ join2(""));
    base58 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ genBase58("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"));
    createBase58check = (sha2565) => {
      afn2(sha2565);
      const _sha256 = sha2565;
      return /* @__PURE__ */ chain2(checksum(4, (data) => _sha256(_sha256(data))), base58);
    };
    BECH_ALPHABET = /* @__PURE__ */ chain2(/* @__PURE__ */ alphabet2("qpzry9x8gf2tvdw0s3jn54khce6mua7l"), /* @__PURE__ */ join2(""));
    POLYMOD_GENERATORS = [996825010, 642813549, 513874426, 1027748829, 705979059];
    bech32 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ genBech32("bech32"));
    bech32m = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ genBech32("bech32m"));
    hasHexBuiltin2 = /* @__PURE__ */ (() => (
      // Require both directions before enabling the native hex path so encode/decode stay symmetric.
      typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
    ))();
    hexBuiltin2 = {
      // Keep local type guards so the native path preserves library-level input errors.
      // Native toHex emits lowercase hex, matching the fallback alphabet and Node's hex strings.
      encode(data) {
        abytes3(data);
        return data.toHex();
      },
      // Native fromHex accepts either hex case and rejects odd-length / non-hex syntax.
      decode(s) {
        astr2("hex", s);
        return Uint8Array.fromHex(s);
      }
    };
    hex2 = /* @__PURE__ */ Object.freeze(hasHexBuiltin2 ? hexBuiltin2 : /* @__PURE__ */ chain2(/* @__PURE__ */ radix22(4), /* @__PURE__ */ alphabet2("0123456789abcdef"), /* @__PURE__ */ join2(""), /* @__PURE__ */ normalize2((s) => {
      if (typeof s !== "string" || s.length % 2 !== 0)
        throw new TypeError(`hex.decode: expected string, got ${typeof s} with length ${s.length}`);
      return s.toLowerCase();
    })));
  }
});

// node_modules/@scure/btc-signer/script.js
function ScriptNum(bytesLimit = 6, forceMinimal = false) {
  return wrap({
    encodeStream: (w, value) => {
      if (value === 0n)
        return;
      const neg = value < 0;
      const val = BigInt(value);
      const nums = [];
      for (let abs = neg ? -val : val; abs; abs >>= 8n)
        nums.push(Number(abs & 0xffn));
      if (nums[nums.length - 1] >= 128)
        nums.push(neg ? 128 : 0);
      else if (neg)
        nums[nums.length - 1] |= 128;
      w.bytes(new Uint8Array(nums));
    },
    decodeStream: (r) => {
      const len = r.leftBytes;
      if (len > bytesLimit)
        throw new Error(`ScriptNum: number (${len}) bigger than limit=${bytesLimit}`);
      if (len === 0)
        return 0n;
      if (forceMinimal) {
        const data = r.bytes(len, true);
        if ((data[data.length - 1] & 127) === 0) {
          if (len <= 1 || (data[data.length - 2] & 128) === 0)
            throw new Error("Non-minimally encoded ScriptNum");
        }
      }
      let last = 0;
      let res = 0n;
      for (let i = 0; i < len; ++i) {
        last = r.byte();
        res |= BigInt(last) << 8n * BigInt(i);
      }
      if (last >= 128) {
        res &= 2n ** BigInt(len * 8) - 1n >> 1n;
        res = -res;
      }
      return res;
    }
  });
}
function OpToNum(op, bytesLimit = 4, forceMinimal = true) {
  if (typeof op === "number")
    return op;
  if (isBytes4(op)) {
    try {
      const val = ScriptNum(bytesLimit, forceMinimal).decode(op);
      if (val > Number.MAX_SAFE_INTEGER)
        return;
      return Number(val);
    } catch (e) {
      return;
    }
  }
  return;
}
function validateRawTx(tx) {
  if (tx.segwitFlag && tx.witnesses && tx.witnesses.every((w) => !w.length))
    throw new Error("Segwit flag with only empty witness fields");
  return tx;
}
var MAX_SCRIPT_BYTE_LENGTH, OP, OPNames, scriptPushLen, Script, CSLimits, CompactSize, CompactSizeLen, _VarBytes, VarBytes, _RawWitness, RawWitness, BTCArray, RawInput, RawOutput, _RawTx, RawTx, RawOldTx;
var init_script = __esm({
  "node_modules/@scure/btc-signer/script.js"() {
    init_micro_packed();
    init_utils2();
    MAX_SCRIPT_BYTE_LENGTH = 520;
    OP = /* @__PURE__ */ Object.freeze({
      OP_0: 0,
      PUSHDATA1: 76,
      PUSHDATA2: 77,
      PUSHDATA4: 78,
      "1NEGATE": 79,
      RESERVED: 80,
      OP_1: 81,
      OP_2: 82,
      OP_3: 83,
      OP_4: 84,
      OP_5: 85,
      OP_6: 86,
      OP_7: 87,
      OP_8: 88,
      OP_9: 89,
      OP_10: 90,
      OP_11: 91,
      OP_12: 92,
      OP_13: 93,
      OP_14: 94,
      OP_15: 95,
      OP_16: 96,
      // Control
      NOP: 97,
      VER: 98,
      IF: 99,
      NOTIF: 100,
      VERIF: 101,
      VERNOTIF: 102,
      ELSE: 103,
      ENDIF: 104,
      VERIFY: 105,
      RETURN: 106,
      // Stack
      TOALTSTACK: 107,
      FROMALTSTACK: 108,
      "2DROP": 109,
      "2DUP": 110,
      "3DUP": 111,
      "2OVER": 112,
      "2ROT": 113,
      "2SWAP": 114,
      IFDUP: 115,
      DEPTH: 116,
      DROP: 117,
      DUP: 118,
      NIP: 119,
      OVER: 120,
      PICK: 121,
      ROLL: 122,
      ROT: 123,
      SWAP: 124,
      TUCK: 125,
      // Splice
      CAT: 126,
      SUBSTR: 127,
      LEFT: 128,
      RIGHT: 129,
      SIZE: 130,
      // Boolean logic
      INVERT: 131,
      AND: 132,
      OR: 133,
      XOR: 134,
      EQUAL: 135,
      EQUALVERIFY: 136,
      RESERVED1: 137,
      RESERVED2: 138,
      // Numbers
      "1ADD": 139,
      "1SUB": 140,
      "2MUL": 141,
      "2DIV": 142,
      NEGATE: 143,
      ABS: 144,
      NOT: 145,
      "0NOTEQUAL": 146,
      ADD: 147,
      SUB: 148,
      MUL: 149,
      DIV: 150,
      MOD: 151,
      LSHIFT: 152,
      RSHIFT: 153,
      BOOLAND: 154,
      BOOLOR: 155,
      NUMEQUAL: 156,
      NUMEQUALVERIFY: 157,
      NUMNOTEQUAL: 158,
      LESSTHAN: 159,
      GREATERTHAN: 160,
      LESSTHANOREQUAL: 161,
      GREATERTHANOREQUAL: 162,
      MIN: 163,
      MAX: 164,
      WITHIN: 165,
      // Crypto
      RIPEMD160: 166,
      SHA1: 167,
      SHA256: 168,
      HASH160: 169,
      HASH256: 170,
      CODESEPARATOR: 171,
      CHECKSIG: 172,
      CHECKSIGVERIFY: 173,
      CHECKMULTISIG: 174,
      CHECKMULTISIGVERIFY: 175,
      // Expansion
      NOP1: 176,
      CHECKLOCKTIMEVERIFY: 177,
      CHECKSEQUENCEVERIFY: 178,
      NOP4: 179,
      NOP5: 180,
      NOP6: 181,
      NOP7: 182,
      NOP8: 183,
      NOP9: 184,
      NOP10: 185,
      // BIP 342
      CHECKSIGADD: 186,
      // Invalid
      INVALID: 255
    });
    OPNames = /* @__PURE__ */ (() => Object.freeze(reverseObject(OP)))();
    scriptPushLen = (op, read) => {
      if (!(OP.OP_0 < op && op <= OP.PUSHDATA4))
        return;
      if (op < OP.PUSHDATA1)
        return op;
      if (op === OP.PUSHDATA1)
        return read(1);
      if (op === OP.PUSHDATA2)
        return read(2);
      if (op === OP.PUSHDATA4)
        return read(4);
      throw new Error("Should be not possible");
    };
    Script = /* @__PURE__ */ (() => Object.freeze(wrap({
      encodeStream: (w, value) => {
        for (let o of value) {
          if (typeof o === "string") {
            if (OP[o] === void 0)
              throw new Error(`Unknown opcode=${o}`);
            w.byte(OP[o]);
            continue;
          } else if (typeof o === "number") {
            if (o === 0) {
              w.byte(0);
              continue;
            } else if (o === -1) {
              w.byte(OP["1NEGATE"]);
              continue;
            } else if (1 <= o && o <= 16) {
              w.byte(OP.OP_1 - 1 + o);
              continue;
            }
          }
          if (typeof o === "number")
            o = ScriptNum().encode(BigInt(o));
          if (!isBytes4(o))
            throw new Error(`Wrong Script OP=${o} (${typeof o})`);
          const len = o.length;
          if (len < OP.PUSHDATA1)
            w.byte(len);
          else if (len <= 255) {
            w.byte(OP.PUSHDATA1);
            w.byte(len);
          } else if (len <= 65535) {
            w.byte(OP.PUSHDATA2);
            w.bytes(U16LE.encode(len));
          } else {
            w.byte(OP.PUSHDATA4);
            w.bytes(U32LE.encode(len));
          }
          w.bytes(o);
        }
      },
      decodeStream: (r) => {
        const out = [];
        while (!r.isEnd()) {
          const cur = r.byte();
          const len = scriptPushLen(cur, (bytes2) => {
            if (bytes2 === 1)
              return U8.decodeStream(r);
            if (bytes2 === 2)
              return U16LE.decodeStream(r);
            return U32LE.decodeStream(r);
          });
          if (len !== void 0) {
            out.push(r.bytes(len));
          } else if (cur === 0) {
            out.push(0);
          } else if (OP.OP_1 <= cur && cur <= OP.OP_16) {
            out.push(cur - (OP.OP_1 - 1));
          } else {
            const op = OPNames[cur];
            if (op === void 0)
              throw new Error(`Unknown opcode=${cur.toString(16)}`);
            out.push(op);
          }
        }
        return out;
      }
    })))();
    CSLimits = {
      253: [253, 2, 253n, 65535n],
      254: [254, 4, 65536n, 4294967295n],
      255: [255, 8, 4294967296n, 18446744073709551615n]
    };
    CompactSize = /* @__PURE__ */ (() => Object.freeze(wrap({
      encodeStream: (w, value) => {
        if (typeof value === "number")
          value = BigInt(value);
        if (0n <= value && value <= 252n)
          return w.byte(Number(value));
        for (const [flag2, bytes2, start, stop] of Object.values(CSLimits)) {
          if (start > value || value > stop)
            continue;
          w.byte(flag2);
          for (let i = 0; i < bytes2; i++)
            w.byte(Number(value >> 8n * BigInt(i) & 0xffn));
          return;
        }
        throw w.err(`VarInt too big: ${value}`);
      },
      decodeStream: (r) => {
        const b0 = r.byte();
        if (b0 <= 252)
          return BigInt(b0);
        const [_, bytes2, start] = CSLimits[b0];
        let num2 = 0n;
        for (let i = 0; i < bytes2; i++)
          num2 |= BigInt(r.byte()) << 8n * BigInt(i);
        if (num2 < start)
          throw r.err(`Wrong CompactSize(${8 * bytes2})`);
        return num2;
      }
    })))();
    CompactSizeLen = /* @__PURE__ */ (() => Object.freeze(apply(CompactSize, coders.numberBigint)))();
    _VarBytes = /* @__PURE__ */ (() => Object.freeze(createBytes(CompactSize)))();
    VarBytes = _VarBytes;
    _RawWitness = /* @__PURE__ */ (() => Object.freeze(array(CompactSizeLen, _VarBytes)))();
    RawWitness = _RawWitness;
    BTCArray = (t) => array(CompactSize, t);
    RawInput = /* @__PURE__ */ (() => Object.freeze(struct({
      txid: createBytes(32, true),
      // hash(prev_tx),
      index: U32LE,
      // output number of previous tx
      finalScriptSig: _VarBytes,
      // btc merges input and output script, executes it. If ok = tx passes
      sequence: U32LE
      // ?
    })))();
    RawOutput = /* @__PURE__ */ (() => Object.freeze(struct({ amount: U64LE, script: _VarBytes })))();
    _RawTx = /* @__PURE__ */ (() => struct({
      version: I32LE,
      segwitFlag: flag(new Uint8Array([0, 1])),
      inputs: BTCArray(RawInput),
      outputs: BTCArray(RawOutput),
      // BIP144 does not encode a witness-count field; one RawWitness entry is
      // implied for each txin and follows the same order as inputs.
      witnesses: flagged("segwitFlag", array("inputs/length", _RawWitness)),
      // < 500000000	Block number at which this transaction is unlocked
      // >= 500000000	UNIX timestamp at which this transaction is unlocked
      // Handled as part of PSBTv2
      lockTime: U32LE
    }))();
    RawTx = /* @__PURE__ */ (() => Object.freeze(validate(_RawTx, validateRawTx)))();
    RawOldTx = /* @__PURE__ */ (() => Object.freeze(struct({
      version: I32LE,
      inputs: BTCArray(RawInput),
      outputs: BTCArray(RawOutput),
      lockTime: U32LE
    })))();
  }
});

// node_modules/@scure/btc-signer/psbt.js
function PSBTKeyInfo(info) {
  const [type, kc, vc, reqInc, allowInc, silentIgnore] = info;
  return { type, kc, vc, reqInc, allowInc, silentIgnore };
}
function PSBTKeyMap(psbtEnum) {
  const byType = {};
  for (const k in psbtEnum) {
    const [num2, kc, vc] = psbtEnum[k];
    byType[num2] = [k, kc, vc];
  }
  return wrap({
    encodeStream: (w, value) => {
      const _value = value;
      let out = [];
      const seen = {};
      const add = (key, value2) => {
        const _value2 = value2;
        const kStr = hex2.encode(PSBTUnknownKey.encode(key));
        if (seen[kStr])
          throw new Error(`PSBT: duplicate key=${kStr}`);
        seen[kStr] = true;
        out.push({ key, value: _value2 });
      };
      for (const name in psbtEnum) {
        const val = _value[name];
        if (val === void 0)
          continue;
        const [type, kc, vc] = psbtEnum[name];
        if (!kc) {
          add({ type, key: EMPTY }, vc.encode(val));
        } else {
          const kv = val.map(([k, v]) => [
            kc.encode(k),
            vc.encode(v)
          ]);
          kv.sort((a, b) => compareBytes(a[0], b[0]));
          for (const [key, value2] of kv)
            add({ key, type }, value2);
        }
      }
      if (_value.unknown) {
        _value.unknown.sort((a, b) => compareBytes(a[0].key, b[0].key));
        for (const [k, v] of _value.unknown)
          add(k, v);
      }
      PSBTKeyPair.encodeStream(w, out);
    },
    decodeStream: (r) => {
      const raw = PSBTKeyPair.decodeStream(r);
      const out = {};
      const noKey = {};
      const seen = {};
      for (const elm of raw) {
        const kStr = hex2.encode(PSBTUnknownKey.encode(elm.key));
        if (seen[kStr])
          throw new Error(`PSBT: duplicate key=${kStr}`);
        seen[kStr] = true;
        let name = "unknown";
        let key = elm.key.key;
        let value = elm.value;
        if (byType[elm.key.type]) {
          const [_name, kc, vc] = byType[elm.key.type];
          name = _name;
          if (!kc && key.length) {
            throw new Error(`PSBT: Non-empty key for ${name} (key=${hex2.encode(key)} value=${hex2.encode(value)}`);
          }
          key = kc ? kc.decode(key) : void 0;
          value = vc.decode(value);
          if (!kc) {
            if (out[name])
              throw new Error(`PSBT: Same keys: ${name} (key=${key} value=${value})`);
            out[name] = value;
            noKey[name] = true;
            continue;
          }
        } else {
          key = { type: elm.key.type, key: elm.key.key };
        }
        if (noKey[name])
          throw new Error(`PSBT: Key type with empty key and no key=${name} val=${value}`);
        if (!out[name])
          out[name] = [];
        out[name].push([key, value]);
      }
      return out;
    }
  });
}
function validatePSBTFields(version, info, lst) {
  const _lst = lst;
  for (const k in _lst) {
    if (k === "unknown")
      continue;
    if (!info[k])
      continue;
    const { allowInc } = PSBTKeyInfo(info[k]);
    if (!allowInc.includes(version))
      throw new Error(`PSBTv${version}: field ${k} is not allowed`);
  }
  for (const k in info) {
    const { reqInc } = PSBTKeyInfo(info[k]);
    if (reqInc.includes(version) && _lst[k] === void 0)
      throw new Error(`PSBTv${version}: missing required field ${k}`);
  }
}
function cleanPSBTFields(version, info, lst) {
  const _lst = lst;
  const out = {};
  for (const _k in _lst) {
    const k = _k;
    if (k !== "unknown") {
      if (!info[k])
        continue;
      const { allowInc, silentIgnore } = PSBTKeyInfo(info[k]);
      if (!allowInc.includes(version)) {
        if (silentIgnore)
          continue;
        throw new Error(`Failed to serialize in PSBTv${version}: ${k} but versions allows inclusion=${allowInc}`);
      }
    }
    out[k] = _lst[k];
  }
  return out;
}
function validatePSBT(tx) {
  const version = tx && tx.global && tx.global.version || 0;
  validatePSBTFields(version, PSBTGlobal, tx.global);
  for (const i of tx.inputs)
    validatePSBTFields(version, PSBTInput, i);
  for (const o of tx.outputs)
    validatePSBTFields(version, PSBTOutput, o);
  const inputCount = !version ? tx.global.unsignedTx.inputs.length : tx.global.inputCount;
  if (tx.inputs.length < inputCount)
    throw new Error("Not enough inputs");
  const inputsLeft = tx.inputs.slice(inputCount);
  if (inputsLeft.length > 1 || inputsLeft.length && Object.keys(inputsLeft[0]).length)
    throw new Error(`Unexpected inputs left in tx=${inputsLeft}`);
  const outputCount = !version ? tx.global.unsignedTx.outputs.length : tx.global.outputCount;
  if (tx.outputs.length < outputCount)
    throw new Error("Not outputs inputs");
  const outputsLeft = tx.outputs.slice(outputCount);
  if (outputsLeft.length > 1 || outputsLeft.length && Object.keys(outputsLeft[0]).length)
    throw new Error(`Unexpected outputs left in tx=${outputsLeft}`);
  return tx;
}
function mergeKeyMap(psbtEnum, val, cur, allowedFields, allowUnknown) {
  const _val = val;
  const _cur = cur;
  const _allowedFields = allowedFields;
  const res = { ..._cur, ..._val };
  for (const k in psbtEnum) {
    const key = k;
    const [_, kC, vC] = psbtEnum[key];
    const cannotChange = _allowedFields && !_allowedFields.includes(k);
    if (_val[k] === void 0 && k in _val) {
      if (cannotChange)
        throw new Error(`Cannot remove signed field=${k}`);
      delete res[k];
    } else if (kC) {
      const oldKV = _cur && _cur[k] ? _cur[k] : [];
      let newKV = _val[key];
      if (newKV) {
        if (!Array.isArray(newKV))
          throw new Error(`keyMap(${k}): KV pairs should be [k, v][]`);
        newKV = newKV.map((val2) => {
          if (val2.length !== 2)
            throw new Error(`keyMap(${k}): KV pairs should be [k, v][]`);
          return [
            typeof val2[0] === "string" ? kC.decode(hex2.decode(val2[0])) : val2[0],
            typeof val2[1] === "string" ? vC.decode(hex2.decode(val2[1])) : val2[1]
          ];
        });
        const map = {};
        const add = (kStr, k2, v) => {
          if (map[kStr] === void 0) {
            map[kStr] = [k2, v];
            return;
          }
          const oldVal = hex2.encode(vC.encode(map[kStr][1]));
          const newVal = hex2.encode(vC.encode(v));
          if (oldVal !== newVal)
            throw new Error(`keyMap(${key}): same key=${kStr} oldVal=${oldVal} newVal=${newVal}`);
        };
        for (const [k2, v] of oldKV) {
          const kStr = hex2.encode(kC.encode(k2));
          add(kStr, k2, v);
        }
        for (const [k2, v] of newKV) {
          const kStr = hex2.encode(kC.encode(k2));
          if (v === void 0) {
            if (cannotChange)
              throw new Error(`Cannot remove signed field=${key}/${k2}`);
            delete map[kStr];
          } else
            add(kStr, k2, v);
        }
        res[key] = Object.values(map);
      }
    } else if (typeof res[k] === "string") {
      res[k] = vC.decode(hex2.decode(res[k]));
    } else if (cannotChange && k in _val && _cur && _cur[k] !== void 0) {
      if (!equalBytes2(vC.encode(_val[k]), vC.encode(_cur[k])))
        throw new Error(`Cannot change signed field=${k}`);
    }
  }
  if (allowUnknown && _val.unknown) {
    const map = {};
    for (const [k, v] of _cur?.unknown || [])
      map[hex2.encode(PSBTUnknownKey.encode(k))] = [k, v];
    for (const [k, v] of _val.unknown) {
      const kStr = hex2.encode(PSBTUnknownKey.encode(k));
      if (map[kStr] === void 0) {
        map[kStr] = [k, v];
        continue;
      }
      const oldVal = hex2.encode(BytesInf.encode(map[kStr][1]));
      const newVal = hex2.encode(BytesInf.encode(v));
      if (oldVal !== newVal)
        throw new Error(`keyMap(unknown): same key=${kStr} oldVal=${oldVal} newVal=${newVal}`);
    }
    res.unknown = Object.values(map);
  }
  for (const k in res) {
    if (!psbtEnum[k]) {
      if (allowUnknown && k === "unknown")
        continue;
      delete res[k];
    }
  }
  return res;
}
var PubKeyECDSA, PubKeyECDSACompressed, PubKeySchnorr, SignatureSchnorr, RawWitnessWire, BIP32Der, TaprootBIP32Der, GlobalXPUB, tapScriptSigKey, _TaprootControlBlock, TaprootControlBlock, tapTree, BytesInf, Bytes20, Bytes32, PSBTInfo, PSBTGlobal, PSBTInput, PSBTInputFinalKeys, PSBTInputUnsignedKeys, PSBTOutput, PSBTOutputUnsignedKeys, PSBTKeyPair, PSBTUnknownKey, PSBTInputCoder, PSBTOutputCoder, PSBTGlobalCoder, _RawPSBTV0, _RawPSBTV2, _DebugPSBT, RawPSBTV0, RawPSBTV2;
var init_psbt = __esm({
  "node_modules/@scure/btc-signer/psbt.js"() {
    init_base2();
    init_micro_packed();
    init_script();
    init_utils2();
    PubKeyECDSA = /* @__PURE__ */ (() => validate(createBytes(null), (pub) => validatePubkey(pub, PubT.ecdsa)))();
    PubKeyECDSACompressed = /* @__PURE__ */ (() => validate(createBytes(33), (pub) => validatePubkey(pub, PubT.ecdsa)))();
    PubKeySchnorr = /* @__PURE__ */ (() => validate(createBytes(32), (pub) => validatePubkey(pub, PubT.schnorr)))();
    SignatureSchnorr = /* @__PURE__ */ (() => validate(createBytes(null), (sig) => {
      if (sig.length !== 64 && sig.length !== 65)
        throw new Error("Schnorr signature should be 64 or 65 bytes long");
      return sig;
    }))();
    RawWitnessWire = RawWitness;
    BIP32Der = /* @__PURE__ */ (() => struct({
      fingerprint: U32BE,
      path: array(null, U32LE)
    }))();
    TaprootBIP32Der = /* @__PURE__ */ (() => struct({
      hashes: array(CompactSizeLen, createBytes(32)),
      der: BIP32Der
    }))();
    GlobalXPUB = /* @__PURE__ */ (() => validate(struct({
      version: U32BE,
      depth: U8,
      parentFingerprint: U32BE,
      childNumber: U32BE,
      chainCode: createBytes(32),
      // BIP32 serialization stores the public key as the final 33-byte `ser_P(K)` field and says
      // importing an extended public key must verify that point data corresponds to the curve.
      publicKey: PubKeyECDSACompressed
    }), (xpub) => {
      if (xpub.depth === 0 && xpub.parentFingerprint !== 0)
        throw new Error("GlobalXPUB: depth=0 requires parentFingerprint=0");
      if (xpub.depth === 0 && xpub.childNumber !== 0)
        throw new Error("GlobalXPUB: depth=0 requires childNumber=0");
      return xpub;
    }))();
    tapScriptSigKey = /* @__PURE__ */ (() => struct({ pubKey: PubKeySchnorr, leafHash: createBytes(32) }))();
    _TaprootControlBlock = /* @__PURE__ */ (() => struct({
      version: U8,
      // With parity :(
      internalKey: createBytes(32),
      merklePath: array(null, createBytes(32))
    }))();
    TaprootControlBlock = /* @__PURE__ */ (() => Object.freeze(validate(_TaprootControlBlock, (cb) => {
      if (cb.merklePath.length > 128)
        throw new Error("TaprootControlBlock: merklePath should be of length 0..128 (inclusive)");
      return cb;
    })))();
    tapTree = /* @__PURE__ */ (() => validate(array(null, struct({
      depth: U8,
      version: U8,
      script: VarBytes
    })), (tree) => {
      if (tree.length < 1)
        throw new Error("tapTree: expected at least one tuple");
      let path2 = Array(tree[0].depth).fill(0);
      let maxDepth = tree[0].depth;
      for (let i = 1; i < tree.length; i++) {
        const { depth } = tree[i];
        if (depth > maxDepth)
          maxDepth = depth;
        let j = path2.length - 1;
        while (j >= 0 && path2[j] === 1)
          j--;
        if (j < 0)
          throw new Error("tapTree: tuples must be in DFS order");
        const next = path2.slice(0, j);
        next.push(1);
        if (depth < next.length)
          throw new Error("tapTree: tuples must be in DFS order");
        while (next.length < depth)
          next.push(0);
        path2 = next;
      }
      let leaves = 0n;
      for (let i = 0; i < tree.length; i++)
        leaves += 1n << BigInt(maxDepth - tree[i].depth);
      if (leaves !== 1n << BigInt(maxDepth))
        throw new Error("tapTree: tuples must describe a complete binary tree");
      return tree;
    }))();
    BytesInf = /* @__PURE__ */ createBytes(null);
    Bytes20 = /* @__PURE__ */ createBytes(20);
    Bytes32 = /* @__PURE__ */ createBytes(32);
    PSBTInfo = (type, kc, vc, reqInc, allowInc, silentIgnore) => /* @__PURE__ */ Object.freeze([
      type,
      kc && typeof kc === "object" ? Object.freeze(kc) : kc,
      vc && typeof vc === "object" ? Object.freeze(vc) : vc,
      Object.freeze([...reqInc]),
      Object.freeze([...allowInc]),
      silentIgnore
    ]);
    PSBTGlobal = /* @__PURE__ */ (() => Object.freeze({
      unsignedTx: PSBTInfo(0, false, RawOldTx, [0], [0], false),
      // BIP174 also requires the serialized xpub depth to match the number of path elements in the
      // paired derivation value, so callers still need that cross-field check above this raw table.
      xpub: PSBTInfo(1, GlobalXPUB, BIP32Der, [], [0, 2], false),
      txVersion: PSBTInfo(2, false, U32LE, [2], [2], false),
      fallbackLocktime: PSBTInfo(3, false, U32LE, [], [2], false),
      inputCount: PSBTInfo(4, false, CompactSizeLen, [2], [2], false),
      outputCount: PSBTInfo(5, false, CompactSizeLen, [2], [2], false),
      // TODO: bitfield
      txModifiable: PSBTInfo(6, false, U8, [], [2], false),
      version: PSBTInfo(251, false, U32LE, [], [0, 2], false),
      proprietary: PSBTInfo(252, BytesInf, BytesInf, [], [0, 2], false)
    }))();
    PSBTInput = /* @__PURE__ */ (() => Object.freeze({
      nonWitnessUtxo: PSBTInfo(0, false, RawTx, [], [0, 2], false),
      witnessUtxo: PSBTInfo(1, false, RawOutput, [], [0, 2], false),
      partialSig: PSBTInfo(2, PubKeyECDSA, BytesInf, [], [0, 2], false),
      sighashType: PSBTInfo(3, false, U32LE, [], [0, 2], false),
      redeemScript: PSBTInfo(4, false, BytesInf, [], [0, 2], false),
      witnessScript: PSBTInfo(5, false, BytesInf, [], [0, 2], false),
      bip32Derivation: PSBTInfo(6, PubKeyECDSA, BIP32Der, [], [0, 2], false),
      finalScriptSig: PSBTInfo(7, false, BytesInf, [], [0, 2], false),
      finalScriptWitness: PSBTInfo(8, false, RawWitnessWire, [], [0, 2], false),
      porCommitment: PSBTInfo(9, false, BytesInf, [], [0, 2], false),
      ripemd160: PSBTInfo(10, Bytes20, BytesInf, [], [0, 2], false),
      sha256: PSBTInfo(11, Bytes32, BytesInf, [], [0, 2], false),
      hash160: PSBTInfo(12, Bytes20, BytesInf, [], [0, 2], false),
      hash256: PSBTInfo(13, Bytes32, BytesInf, [], [0, 2], false),
      // BIP174/BIP370 serialize PREVIOUS_TXID in standard byte order, while the rest of this repo
      // historically keeps TransactionInput.txid in display-order bytes matching `Transaction.id`.
      // Reverse at this PSBTv2 boundary so internal txid semantics stay aligned with the raw-tx path.
      txid: PSBTInfo(14, false, createBytes(32, true), [2], [2], true),
      index: PSBTInfo(15, false, U32LE, [2], [2], true),
      sequence: PSBTInfo(16, false, U32LE, [], [2], true),
      requiredTimeLocktime: PSBTInfo(17, false, U32LE, [], [2], false),
      requiredHeightLocktime: PSBTInfo(18, false, U32LE, [], [2], false),
      tapKeySig: PSBTInfo(19, false, SignatureSchnorr, [], [0, 2], false),
      tapScriptSig: PSBTInfo(20, tapScriptSigKey, SignatureSchnorr, [], [0, 2], false),
      tapLeafScript: PSBTInfo(21, TaprootControlBlock, BytesInf, [], [0, 2], false),
      // BIP371 key data here is a 32-byte x-only pubkey, so reuse the shared Schnorr pubkey coder
      // instead of accepting arbitrary 32-byte blobs that only fail much later in taproot flows.
      tapBip32Derivation: PSBTInfo(22, PubKeySchnorr, TaprootBIP32Der, [], [0, 2], false),
      tapInternalKey: PSBTInfo(23, false, PubKeySchnorr, [], [0, 2], false),
      tapMerkleRoot: PSBTInfo(24, false, Bytes32, [], [0, 2], false),
      proprietary: PSBTInfo(252, BytesInf, BytesInf, [], [0, 2], false)
    }))();
    PSBTInputFinalKeys = /* @__PURE__ */ Object.freeze([
      // PSBTv2 extractors rebuild the final transaction from per-input fields, so
      // finalized inputs still need txid/index (and any non-default sequence)
      // even though BIP174's generic cleanup is stricter.
      "txid",
      "sequence",
      "index",
      "witnessUtxo",
      "nonWitnessUtxo",
      "finalScriptSig",
      "finalScriptWitness",
      "unknown"
    ]);
    PSBTInputUnsignedKeys = /* @__PURE__ */ Object.freeze([
      // This is the replace/remove allowlist for signed inputs; mergeKeyMap() can still append
      // previously absent metadata or new KV entries for other fields when they don't conflict.
      "partialSig",
      "finalScriptSig",
      "finalScriptWitness",
      "tapKeySig",
      "tapScriptSig"
    ]);
    PSBTOutput = /* @__PURE__ */ (() => Object.freeze({
      redeemScript: PSBTInfo(0, false, BytesInf, [], [0, 2], false),
      witnessScript: PSBTInfo(1, false, BytesInf, [], [0, 2], false),
      bip32Derivation: PSBTInfo(2, PubKeyECDSA, BIP32Der, [], [0, 2], false),
      // BIP174/BIP370 serialize PSBT_OUT_AMOUNT as a signed int64 on the wire; semantic output
      // validity still rejects negative transaction amounts in `PSBTOutputCoder` below.
      amount: PSBTInfo(3, false, I64LE, [2], [2], true),
      script: PSBTInfo(4, false, BytesInf, [2], [2], true),
      tapInternalKey: PSBTInfo(5, false, PubKeySchnorr, [], [0, 2], false),
      // BIP371 expects a non-empty DFS-ordered list of tapleaf tuples here so wallets can
      // reconstruct the same Taproot tree, not just an arbitrary list of serialized leaves.
      tapTree: PSBTInfo(6, false, tapTree, [], [0, 2], false),
      tapBip32Derivation: PSBTInfo(7, PubKeySchnorr, TaprootBIP32Der, [], [0, 2], false),
      proprietary: PSBTInfo(252, BytesInf, BytesInf, [], [0, 2], false)
    }))();
    PSBTOutputUnsignedKeys = /* @__PURE__ */ Object.freeze([]);
    PSBTKeyPair = /* @__PURE__ */ (() => array(NULL, struct({
      //  <key> := <keylen> <keytype> <keydata> WHERE keylen = len(keytype)+len(keydata)
      key: prefix(CompactSizeLen, struct({ type: CompactSizeLen, key: createBytes(null) })),
      //  <value> := <valuelen> <valuedata>
      value: createBytes(CompactSizeLen)
    })))();
    PSBTUnknownKey = /* @__PURE__ */ (() => (
      // Raw unknown/proprietary field key: compact-size keytype plus opaque keydata for pass-through.
      struct({ type: CompactSizeLen, key: createBytes(null) })
    ))();
    PSBTInputCoder = /* @__PURE__ */ (() => Object.freeze(validate(PSBTKeyMap(PSBTInput), (i) => {
      if (i.finalScriptWitness && !i.finalScriptWitness.length)
        throw new Error("validateInput: empty finalScriptWitness");
      if (i.partialSig && !i.partialSig.length)
        throw new Error("Empty partialSig");
      if (i.partialSig)
        for (const [k] of i.partialSig)
          validatePubkey(k, PubT.ecdsa);
      if (i.bip32Derivation)
        for (const [k] of i.bip32Derivation)
          validatePubkey(k, PubT.ecdsa);
      if (i.requiredTimeLocktime !== void 0 && i.requiredTimeLocktime < 5e8)
        throw new Error(`validateInput: wrong timeLocktime=${i.requiredTimeLocktime}`);
      if (i.requiredHeightLocktime !== void 0 && (i.requiredHeightLocktime <= 0 || i.requiredHeightLocktime >= 5e8))
        throw new Error(`validateInput: wrong heighLocktime=${i.requiredHeightLocktime}`);
      if (i.tapLeafScript) {
        for (const [k, v] of i.tapLeafScript) {
          if ((k.version & 254) !== v[v.length - 1])
            throw new Error("validateInput: tapLeafScript version mimatch");
          if (v[v.length - 1] & 1)
            throw new Error("validateInput: tapLeafScript version has parity bit!");
        }
      }
      return i;
    })))();
    PSBTOutputCoder = /* @__PURE__ */ (() => Object.freeze(validate(PSBTKeyMap(PSBTOutput), (o) => {
      if (o.amount !== void 0 && o.amount < 0n)
        throw new Error(`validateOutput: wrong amount=${o.amount}`);
      if (o.bip32Derivation)
        for (const [k] of o.bip32Derivation)
          validatePubkey(k, PubT.ecdsa);
      return o;
    })))();
    PSBTGlobalCoder = /* @__PURE__ */ (() => validate(PSBTKeyMap(PSBTGlobal), (g) => {
      const version = g.version || 0;
      if (version === 0) {
        if (!g.unsignedTx)
          throw new Error("PSBTv0: missing unsignedTx");
        for (const inp of g.unsignedTx.inputs)
          if (inp.finalScriptSig && inp.finalScriptSig.length)
            throw new Error("PSBTv0: input scriptSig found in unsignedTx");
      }
      for (const [xpub, der] of g.xpub || []) {
        if (xpub.depth !== der.path.length)
          throw new Error(`PSBT_GLOBAL_XPUB: xpub depth=${xpub.depth} must match derivation path length=${der.path.length}`);
      }
      return g;
    }))();
    _RawPSBTV0 = /* @__PURE__ */ (() => Object.freeze(struct({
      magic: magic(string(new Uint8Array([255])), "psbt"),
      global: PSBTGlobalCoder,
      // Raw v0 framing follows the unsigned transaction for input-map count; the stricter
      // one-map-per-input/output reconciliation happens in `RawPSBTV0` / `validatePSBT`.
      inputs: array("global/unsignedTx/inputs/length", PSBTInputCoder),
      outputs: array(null, PSBTOutputCoder)
    })))();
    _RawPSBTV2 = /* @__PURE__ */ (() => Object.freeze(struct({
      magic: magic(string(new Uint8Array([255])), "psbt"),
      global: PSBTGlobalCoder,
      // Raw v2 framing takes map counts from the global PSBTv2 count fields; deeper version
      // and per-field validation still happens in `RawPSBTV2` / `validatePSBT`.
      inputs: array("global/inputCount", PSBTInputCoder),
      outputs: array("global/outputCount", PSBTOutputCoder)
    })))();
    _DebugPSBT = /* @__PURE__ */ (() => Object.freeze(struct({
      magic: magic(string(new Uint8Array([255])), "psbt"),
      // Debug-only normalized view: maps become plain objects, so key order is intentionally ignored
      // and duplicate keys fail while decoding instead of being preserved for byte-level diagnostics.
      // Each `items[i]` is one raw PSBT map (`global`, then inputs, then outputs), keyed by the
      // full serialized PSBT key bytes as hex rather than decoded field names.
      items: array(null, apply(array(NULL, tuple([createHex(CompactSizeLen), createBytes(CompactSize)])), coders.dict()))
    })))();
    RawPSBTV0 = /* @__PURE__ */ (() => Object.freeze(validate(_RawPSBTV0, validatePSBT)))();
    RawPSBTV2 = /* @__PURE__ */ (() => Object.freeze(validate(_RawPSBTV2, validatePSBT)))();
  }
});

// node_modules/@scure/btc-signer/payment.js
function isValidPubkey(pub, type) {
  try {
    validatePubkey(pub, type);
    return true;
  } catch (e) {
    return false;
  }
}
function checkWSH(s, witnessScript) {
  if (!equalBytes2(s.hash, sha2563(witnessScript)))
    throw new Error("checkScript: wsh wrong witnessScript hash");
  const w = OutScript.decode(witnessScript);
  if (w.type === "tr" || w.type === "tr_ns" || w.type === "tr_ms")
    throw new Error(`checkScript: P2${w.type} cannot be wrapped in P2SH`);
  if (w.type === "wpkh" || w.type === "wsh" || w.type === "sh")
    throw new Error(`checkScript: P2${w.type} cannot be wrapped in P2WSH`);
}
function checkScript(script, redeemScript, witnessScript) {
  let hasWsh = false;
  let r = void 0;
  if (script) {
    const s = OutScript.decode(script);
    if (s.type === "tr_ns" || s.type === "tr_ms" || s.type === "ms" || s.type == "pk")
      throw new Error(`checkScript: non-wrapped ${s.type}`);
    if (redeemScript) {
      if (s.type !== "sh")
        throw new Error("checkScript: redeemScript without P2SH");
      if (!equalBytes2(s.hash, hash160(redeemScript)))
        throw new Error("checkScript: sh wrong redeemScript hash");
      r = OutScript.decode(redeemScript);
      if (r?.type === "tr" || r?.type === "tr_ns" || r?.type === "tr_ms")
        throw new Error(`checkScript: P2${r.type} cannot be wrapped in P2SH`);
      if (r?.type === "sh")
        throw new Error("checkScript: P2SH cannot be wrapped in P2SH");
    }
    if (s.type === "wsh") {
      hasWsh = true;
      if (witnessScript)
        checkWSH(s, witnessScript);
    }
  }
  if (redeemScript) {
    if (r === void 0)
      r = OutScript.decode(redeemScript);
    if (r?.type === "wsh") {
      hasWsh = true;
      if (witnessScript)
        checkWSH(r, witnessScript);
    }
  }
  if (witnessScript && !hasWsh)
    throw new Error("checkScript: witnessScript without P2WSH");
}
function uniqPubkey(pubkeys) {
  const map = {};
  for (const pub of pubkeys) {
    const key = hex2.encode(pub);
    if (map[key])
      throw new Error(`Multisig: non-uniq pubkey: ${pubkeys.map(hex2.encode)}`);
    map[key] = true;
  }
}
function checkTaprootScript(script, internalPubKey, allowUnknownOutputs = false, customScripts) {
  const out = OutScript.decode(script);
  if (out.type === "unknown") {
    if (customScripts) {
      const cs = apply(Script, coders.match(customScripts));
      const c = cs.decode(script);
      if (c !== void 0) {
        if (typeof c.type !== "string" || !c.type.startsWith("tr_"))
          throw new Error(`P2TR: invalid custom type=${c.type}`);
        return;
      }
    }
    if (allowUnknownOutputs)
      return;
  }
  if (!["tr_ns", "tr_ms"].includes(out.type))
    throw new Error(`P2TR: invalid leaf script=${out.type}`);
  const outms = out;
  if (!allowUnknownOutputs && outms.pubkeys) {
    for (const p of outms.pubkeys) {
      if (equalBytes2(p, TAPROOT_UNSPENDABLE_KEY))
        throw new Error("Unspendable taproot key in leaf script");
      if (equalBytes2(p, internalPubKey)) {
        throw new Error("Using P2TR with leaf script with same key as internal key is not supported");
      }
    }
  }
}
function taprootListToTree(taprootList) {
  if (!taprootList.length)
    throw new Error("taprootListToTree: empty tree");
  const lst = Array.from(taprootList);
  while (lst.length >= 2) {
    lst.sort((a2, b2) => (b2.weight || 1) - (a2.weight || 1));
    const b = lst.pop();
    const a = lst.pop();
    const weight = (a?.weight || 1) + (b?.weight || 1);
    lst.push({
      weight,
      // Unwrap children array
      // TODO: Very hard to remove any here
      childs: [a?.childs || a, b?.childs || b]
    });
  }
  const last = lst[0];
  return last?.childs || last;
}
function taprootAddPath(tree, path2 = []) {
  if (!tree)
    throw new Error(`taprootAddPath: empty tree`);
  if (tree.type === "leaf")
    return { ...tree, path: path2 };
  if (tree.type !== "branch")
    throw new Error(`taprootAddPath: wrong type=${tree}`);
  return {
    ...tree,
    path: path2,
    // BIP 341 control blocks serialize sibling hashes from leaf to root, so prepend the
    // current sibling before descending into the child subtree.
    left: taprootAddPath(tree.left, [tree.right.hash, ...path2]),
    right: taprootAddPath(tree.right, [tree.left.hash, ...path2])
  };
}
function taprootWalkTree(tree) {
  if (!tree)
    throw new Error(`taprootAddPath: empty tree`);
  if (tree.type === "leaf")
    return [tree];
  if (tree.type !== "branch")
    throw new Error(`taprootWalkTree: wrong type=${tree}`);
  return [...taprootWalkTree(tree.left), ...taprootWalkTree(tree.right)];
}
function taprootHashTree(tree, internalPubKey, allowUnknownOutputs = false, customScripts) {
  if (!tree)
    throw new Error("taprootHashTree: empty tree");
  if (Array.isArray(tree) && tree.length === 1)
    tree = tree[0];
  if (!Array.isArray(tree)) {
    const version = tree.leafVersion;
    const { script: leafScript } = tree;
    if (tree.tapLeafScript || tree.tapMerkleRoot && !equalBytes2(tree.tapMerkleRoot, EMPTY))
      throw new Error("P2TR: tapRoot leafScript cannot have tree");
    const script = typeof leafScript === "string" ? hex2.decode(leafScript) : leafScript;
    if (!isBytes4(script))
      throw new Error(`checkScript: wrong script type=${script}`);
    checkTaprootScript(script, internalPubKey, allowUnknownOutputs, customScripts);
    return {
      type: "leaf",
      version,
      script,
      hash: tapLeafHash(script, tapLeafVersion(version))
    };
  }
  if (tree.length !== 2)
    tree = taprootListToTree(tree);
  if (tree.length !== 2)
    throw new Error("hashTree: non binary tree!");
  const left = taprootHashTree(tree[0], internalPubKey, allowUnknownOutputs, customScripts);
  const right = taprootHashTree(tree[1], internalPubKey, allowUnknownOutputs, customScripts);
  let [lH, rH] = [left.hash, right.hash];
  if (compareBytes(rH, lH) === -1)
    [lH, rH] = [rH, lH];
  return {
    type: "branch",
    left,
    right,
    hash: tagSchnorr("TapBranch", lH, rH)
  };
}
function p2tr(internalPubKey, tree, network = NETWORK, allowUnknownOutputs = false, customScripts) {
  if (!internalPubKey && !tree)
    throw new Error("p2tr: should have pubKey or scriptTree (or both)");
  const pubKey = typeof internalPubKey === "string" ? hex2.decode(internalPubKey) : internalPubKey || TAPROOT_UNSPENDABLE_KEY;
  if (!isValidPubkey(pubKey, PubT.schnorr))
    throw new Error("p2tr: non-schnorr pubkey");
  if (tree) {
    let hashedTree = taprootAddPath(taprootHashTree(tree, pubKey, allowUnknownOutputs, customScripts));
    const tapMerkleRoot = hashedTree.hash;
    const [tweakedPubkey, parity] = taprootTweakPubkey(pubKey, tapMerkleRoot);
    const leaves = taprootWalkTree(hashedTree).map((l) => {
      const version = tapLeafVersion(l.version);
      return {
        ...l,
        // Leaf versions are stored as the base even byte; only the control block adds the
        // output-key parity bit required by BIP 341 script-path spending.
        controlBlock: TaprootControlBlock.encode({
          version: version + parity,
          internalKey: pubKey,
          merklePath: l.path
        })
      };
    });
    return {
      type: "tr",
      script: OutScript.encode({ type: "tr", pubkey: tweakedPubkey }),
      address: Address(network).encode({ type: "tr", pubkey: tweakedPubkey }),
      // For tests
      tweakedPubkey,
      // PSBT stuff
      tapInternalKey: pubKey,
      leaves,
      tapLeafScript: leaves.map((l) => [
        TaprootControlBlock.decode(l.controlBlock),
        concatBytes3(l.script, new Uint8Array([tapLeafVersion(l.version)]))
      ]),
      tapMerkleRoot
    };
  } else {
    const tweakedPubkey = taprootTweakPubkey(pubKey, EMPTY)[0];
    return {
      type: "tr",
      script: OutScript.encode({ type: "tr", pubkey: tweakedPubkey }),
      address: Address(network).encode({ type: "tr", pubkey: tweakedPubkey }),
      // For tests
      tweakedPubkey,
      // PSBT stuff
      tapInternalKey: pubKey
    };
  }
}
function combinations(m, list) {
  const res = [];
  if (!Array.isArray(list))
    throw new Error("combinations: lst arg should be array");
  const n = list.length;
  (0, import_utils13.anumber)(m, "m");
  if (m < 1 || m > n)
    throw new Error("combinations: m must satisfy 1 <= m <= lst.length");
  const idx = Array.from({ length: m }, (_, i) => i);
  const last = idx.length - 1;
  main: for (; ; ) {
    res.push(idx.map((i2) => list[i2]));
    idx[last] += 1;
    let i = last;
    for (; i >= 0 && idx[i] > n - m + i; i--) {
      idx[i] = 0;
      if (i === 0)
        break main;
      idx[i - 1] += 1;
    }
    for (i += 1; i < idx.length; i++)
      idx[i] = idx[i - 1] + 1;
  }
  return res;
}
function p2tr_ms(m, pubkeys, allowSamePubkeys = false) {
  if (!allowSamePubkeys)
    uniqPubkey(pubkeys);
  return {
    type: "tr_ms",
    script: OutScript.encode({ type: "tr_ms", pubkeys, m })
  };
}
function getAddress(type, privKey, network = NETWORK) {
  if (type === "tr") {
    return p2tr(pubSchnorr(privKey), void 0, network).address;
  }
  const pubKey = pubECDSA(privKey);
  if (type === "pkh")
    return p2pkh(pubKey, network).address;
  if (type === "wpkh")
    return p2wpkh(pubKey, network).address;
  throw new Error(`getAddress: unknown type=${type}`);
}
function multisig(m, pubkeys, sorted = false, witness = false, network = NETWORK) {
  const ms = p2ms(m, sorted ? _sortPubkeys(pubkeys) : pubkeys);
  return witness ? p2wsh(ms, network) : p2sh(ms, network);
}
function sortedMultisig(m, pubkeys, witness = false, network = NETWORK) {
  return multisig(m, pubkeys, true, witness, network);
}
function validateWitness(version, data) {
  if (data.length < 2 || data.length > 40)
    throw new Error("Witness: invalid length");
  if (version > 16)
    throw new Error("Witness: invalid version");
  if (version === 0 && !(data.length === 20 || data.length === 32))
    throw new Error("Witness: invalid length for version");
}
function programToWitness(version, data, network = NETWORK) {
  validateWitness(version, data);
  const coder = version === 0 ? bech32 : bech32m;
  return coder.encode(network.bech32, [version].concat(coder.toWords(data)));
}
function formatKey(hashed, prefix2) {
  return base58check.encode(concatBytes3(Uint8Array.from(prefix2), hashed));
}
function WIF(network = NETWORK) {
  return {
    encode(privKey) {
      abytes(privKey, 32, "privKey");
      const compressed = concatBytes3(privKey, new Uint8Array([1]));
      return formatKey(compressed.subarray(0, 33), [network.wif]);
    },
    decode(wif) {
      let parsed = base58check.decode(wif);
      if (parsed[0] !== network.wif)
        throw new Error("Wrong WIF prefix");
      parsed = parsed.subarray(1);
      if (parsed.length !== 33)
        throw new Error("Wrong WIF length");
      if (parsed[32] !== 1)
        throw new Error("Wrong WIF postfix");
      return parsed.subarray(0, -1);
    }
  };
}
function Address(network = NETWORK) {
  return {
    encode(from) {
      const { type } = from;
      if (type === "wpkh")
        return programToWitness(0, from.hash, network);
      else if (type === "wsh")
        return programToWitness(0, from.hash, network);
      else if (type === "tr")
        return programToWitness(1, from.pubkey, network);
      else if (type === "pkh")
        return formatKey(from.hash, [network.pubKeyHash]);
      else if (type === "sh")
        return formatKey(from.hash, [network.scriptHash]);
      throw new Error(`Unknown address type=${type}`);
    },
    decode(address) {
      if (address.length < 14 || address.length > 74)
        throw new Error("Invalid address length");
      if (network.bech32 && address.toLowerCase().startsWith(`${network.bech32}1`)) {
        let res;
        try {
          res = bech32.decode(address);
          if (res.words[0] !== 0)
            throw new Error(`bech32: wrong version=${res.words[0]}`);
        } catch (_) {
          res = bech32m.decode(address);
          if (res.words[0] === 0)
            throw new Error(`bech32m: wrong version=${res.words[0]}`);
        }
        if (res.prefix !== network.bech32)
          throw new Error(`wrong bech32 prefix=${res.prefix}`);
        const [version, ...program] = res.words;
        const data2 = bech32.fromWords(program);
        validateWitness(version, data2);
        if (version === 0 && data2.length === 32)
          return { type: "wsh", hash: data2 };
        else if (version === 0 && data2.length === 20)
          return { type: "wpkh", hash: data2 };
        else if (version === 1 && data2.length === 32)
          return { type: "tr", pubkey: data2 };
        else
          throw new Error("Unknown witness program");
      }
      const data = base58check.decode(address);
      if (data.length !== 21)
        throw new Error("Invalid base58 address");
      if (data[0] === network.pubKeyHash) {
        return { type: "pkh", hash: data.slice(1) };
      } else if (data[0] === network.scriptHash) {
        return {
          type: "sh",
          hash: data.slice(1)
        };
      }
      throw new Error(`Invalid address prefix=${data[0]}`);
    }
  };
}
var import_utils13, OutP2A, OutPK, OutPKH, OutSH, OutWSH, OutWPKH, OutMS, OutTR, OutTRNS, OutTRMS, OutUnknown, OutScripts, _OutScript, OutScript, p2pk, p2pkh, p2sh, p2wsh, p2wpkh, p2ms, TAP_LEAF_VERSION, tapLeafVersion, tapLeafHash, p2tr_ns, p2tr_pk, _sortPubkeys, base58check;
var init_payment = __esm({
  "node_modules/@scure/btc-signer/payment.js"() {
    init_base2();
    import_utils13 = require("@noble/hashes/utils.js");
    init_utils();
    init_micro_packed();
    init_psbt();
    init_script();
    init_utils2();
    init_utils2();
    OutP2A = {
      encode(from) {
        if (from.length !== 2 || from[0] !== 1 || !isBytes4(from[1]) || hex2.encode(from[1]) !== "4e73")
          return;
        return { type: "p2a", script: Script.encode(from) };
      },
      decode: (to) => {
        if (to.type !== "p2a")
          return;
        return [1, hex2.decode("4e73")];
      }
    };
    OutPK = {
      encode(from) {
        if (from.length !== 2 || !isBytes4(from[0]) || !isValidPubkey(from[0], PubT.ecdsa) || from[1] !== "CHECKSIG")
          return;
        return { type: "pk", pubkey: from[0] };
      },
      decode: (to) => {
        if (to.type !== "pk")
          return;
        return [to.pubkey, "CHECKSIG"];
      }
    };
    OutPKH = {
      encode(from) {
        if (from.length !== 5 || from[0] !== "DUP" || from[1] !== "HASH160" || !isBytes4(from[2]))
          return;
        if (from[3] !== "EQUALVERIFY" || from[4] !== "CHECKSIG")
          return;
        return { type: "pkh", hash: from[2] };
      },
      // OutScript validates `pkh.hash` before this branch emits the canonical
      // `DUP HASH160 <hash> EQUALVERIFY CHECKSIG` script.
      decode: (to) => to.type === "pkh" ? ["DUP", "HASH160", to.hash, "EQUALVERIFY", "CHECKSIG"] : void 0
    };
    OutSH = {
      encode(from) {
        if (from.length !== 3 || from[0] !== "HASH160" || !isBytes4(from[1]) || from[2] !== "EQUAL")
          return;
        return { type: "sh", hash: from[1] };
      },
      // OutScript validates `sh.hash` before this branch emits the canonical
      // `HASH160 <hash> EQUAL` script.
      decode: (to) => to.type === "sh" ? ["HASH160", to.hash, "EQUAL"] : void 0
    };
    OutWSH = {
      encode(from) {
        if (from.length !== 2 || from[0] !== 0 || !isBytes4(from[1]))
          return;
        if (from[1].length !== 32)
          return;
        return { type: "wsh", hash: from[1] };
      },
      // OutScript validates `wsh.hash` before this branch emits the canonical
      // version-0 32-byte witness program.
      decode: (to) => to.type === "wsh" ? [0, to.hash] : void 0
    };
    OutWPKH = {
      encode(from) {
        if (from.length !== 2 || from[0] !== 0 || !isBytes4(from[1]))
          return;
        if (from[1].length !== 20)
          return;
        return { type: "wpkh", hash: from[1] };
      },
      // OutScript validates `wpkh.hash` before this branch emits the canonical
      // version-0 20-byte witness program.
      decode: (to) => to.type === "wpkh" ? [0, to.hash] : void 0
    };
    OutMS = {
      encode(from) {
        const last = from.length - 1;
        if (from[last] !== "CHECKMULTISIG")
          return;
        const m = from[0];
        const n = from[last - 1];
        if (typeof m !== "number" || typeof n !== "number")
          return;
        const pubkeys = from.slice(1, -2);
        if (n !== pubkeys.length)
          return;
        for (const pub of pubkeys)
          if (!isBytes4(pub))
            return;
        return { type: "ms", m, pubkeys };
      },
      // checkmultisig(n, ..pubkeys, m)
      decode: (to) => (
        // OutScript validates multisig pubkeys and `0 < m <= n <= 16`.
        // This branch only emits the canonical `m <pubkeys...> n CHECKMULTISIG`
        // script.
        to.type === "ms" ? [to.m, ...to.pubkeys, to.pubkeys.length, "CHECKMULTISIG"] : void 0
      )
    };
    OutTR = {
      encode(from) {
        if (from.length !== 2 || from[0] !== 1 || !isBytes4(from[1]) || from[1].length !== 32)
          return;
        return { type: "tr", pubkey: from[1] };
      },
      // OutScript validates `tr.pubkey` before this branch emits the canonical
      // version-1 32-byte witness program.
      decode: (to) => to.type === "tr" ? [1, to.pubkey] : void 0
    };
    OutTRNS = {
      encode(from) {
        const last = from.length - 1;
        if (from[last] !== "CHECKSIG")
          return;
        const pubkeys = [];
        for (let i = 0; i < last; i++) {
          const elm = from[i];
          if (i & 1) {
            if (elm !== "CHECKSIGVERIFY" || i === last - 1)
              return;
            continue;
          }
          if (!isBytes4(elm) || !isValidPubkey(elm, PubT.schnorr))
            return;
          pubkeys.push(elm);
        }
        if (!pubkeys.length)
          return;
        return { type: "tr_ns", pubkeys };
      },
      decode: (to) => {
        if (to.type !== "tr_ns")
          return;
        const out = [];
        for (let i = 0; i < to.pubkeys.length - 1; i++)
          out.push(to.pubkeys[i], "CHECKSIGVERIFY");
        out.push(to.pubkeys[to.pubkeys.length - 1], "CHECKSIG");
        return out;
      }
    };
    OutTRMS = {
      encode(from) {
        const last = from.length - 1;
        if (from[last] !== "NUMEQUAL" || from[1] !== "CHECKSIG")
          return;
        const pubkeys = [];
        const m = OpToNum(from[last - 1]);
        if (typeof m !== "number")
          return;
        for (let i = 0; i < last - 1; i++) {
          const elm = from[i];
          if (i & 1) {
            if (elm !== (i === 1 ? "CHECKSIG" : "CHECKSIGADD"))
              return;
            continue;
          }
          if (!isBytes4(elm))
            return;
          pubkeys.push(elm);
        }
        return { type: "tr_ms", pubkeys, m };
      },
      decode: (to) => {
        if (to.type !== "tr_ms")
          return;
        const out = [to.pubkeys[0], "CHECKSIG"];
        for (let i = 1; i < to.pubkeys.length; i++)
          out.push(to.pubkeys[i], "CHECKSIGADD");
        out.push(to.m, "NUMEQUAL");
        return out;
      }
    };
    OutUnknown = {
      encode(from) {
        return { type: "unknown", script: Script.encode(from) };
      },
      decode: (to) => (
        // This reparses `unknown.script` through the semantic Script codec, so raw
        // bytes must still be syntactically parseable and may canonicalize on re-encode.
        to.type === "unknown" ? Script.decode(to.script) : void 0
      )
    };
    OutScripts = /* @__PURE__ */ (() => [
      // Order is semantic: specific structured coders run first and the catch-all
      // unknown fallback must stay last.
      OutP2A,
      OutPK,
      OutPKH,
      OutSH,
      OutWSH,
      OutWPKH,
      OutMS,
      OutTR,
      OutTRNS,
      OutTRMS,
      OutUnknown
    ])();
    _OutScript = /* @__PURE__ */ (() => apply(Script, coders.match(OutScripts)))();
    OutScript = /* @__PURE__ */ (() => Object.freeze(validate(_OutScript, (i) => {
      if (i.type === "pk" && !isValidPubkey(i.pubkey, PubT.ecdsa))
        throw new Error("OutScript/pk: wrong key");
      if ((i.type === "pkh" || i.type === "sh" || i.type === "wpkh") && (!isBytes4(i.hash) || i.hash.length !== 20))
        throw new Error(`OutScript/${i.type}: wrong hash`);
      if (i.type === "wsh" && (!isBytes4(i.hash) || i.hash.length !== 32))
        throw new Error(`OutScript/wsh: wrong hash`);
      if (i.type === "tr" && (!isBytes4(i.pubkey) || !isValidPubkey(i.pubkey, PubT.schnorr)))
        throw new Error("OutScript/tr: wrong taproot public key");
      if (i.type === "ms" || i.type === "tr_ns" || i.type === "tr_ms") {
        if (!Array.isArray(i.pubkeys))
          throw new Error("OutScript/multisig: wrong pubkeys array");
      }
      if (i.type === "ms") {
        const n = i.pubkeys.length;
        for (const p of i.pubkeys)
          if (!isValidPubkey(p, PubT.ecdsa))
            throw new Error("OutScript/multisig: wrong pubkey");
        (0, import_utils13.anumber)(i.m, "m");
        if (i.m <= 0 || n > 16 || i.m > n)
          throw new Error("OutScript/multisig: invalid params");
      }
      if (i.type === "tr_ns" || i.type === "tr_ms") {
        for (const p of i.pubkeys)
          if (!isValidPubkey(p, PubT.schnorr))
            throw new Error(`OutScript/${i.type}: wrong pubkey`);
      }
      if (i.type === "tr_ms") {
        const n = i.pubkeys.length;
        (0, import_utils13.anumber)(i.m, "m");
        if (i.m <= 0 || n > 999 || i.m > n)
          throw new Error("OutScript/tr_ms: invalid params");
      }
      return i;
    })))();
    p2pk = (pubkey, _network = NETWORK) => {
      if (!isValidPubkey(pubkey, PubT.ecdsa))
        throw new Error("P2PK: invalid publicKey");
      return {
        type: "pk",
        script: OutScript.encode({ type: "pk", pubkey })
      };
    };
    p2pkh = (publicKey, network = NETWORK) => {
      if (!isValidPubkey(publicKey, PubT.ecdsa))
        throw new Error("P2PKH: invalid publicKey");
      const hash = hash160(publicKey);
      return {
        type: "pkh",
        script: OutScript.encode({ type: "pkh", hash }),
        address: Address(network).encode({ type: "pkh", hash }),
        hash
      };
    };
    p2sh = (child, network = NETWORK) => {
      const c = child;
      const cs = c.script;
      if (!isBytes4(cs))
        throw new Error(`Wrong script: ${typeof c.script}, expected Uint8Array`);
      if (cs.length > MAX_SCRIPT_BYTE_LENGTH)
        throw new Error(`P2SH: redeemScript exceeds ${MAX_SCRIPT_BYTE_LENGTH}-byte push limit: len=${cs.length}`);
      const hash = hash160(cs);
      const out = { type: "sh", hash };
      const script = OutScript.encode(out);
      const address = Address(network).encode(out);
      checkScript(script, cs, c.witnessScript);
      if (c.witnessScript) {
        return {
          type: "sh",
          redeemScript: cs,
          script,
          address,
          hash,
          witnessScript: c.witnessScript
        };
      } else {
        return {
          type: "sh",
          redeemScript: cs,
          script,
          address,
          hash
        };
      }
    };
    p2wsh = (child, network = NETWORK) => {
      const cs = child.script;
      if (!isBytes4(cs))
        throw new Error(`Wrong script: ${typeof cs}, expected Uint8Array`);
      if (cs.length > 1e4)
        throw new Error("P2WSH: witnessScript exceeds 10,000 bytes");
      const hash = sha2563(cs);
      const script = OutScript.encode({ type: "wsh", hash });
      checkScript(script, void 0, cs);
      return {
        type: "wsh",
        witnessScript: cs,
        script,
        address: Address(network).encode({ type: "wsh", hash }),
        hash
      };
    };
    p2wpkh = (publicKey, network = NETWORK) => {
      if (!isValidPubkey(publicKey, PubT.ecdsa))
        throw new Error("P2WPKH: invalid publicKey");
      if (publicKey.length === 65)
        throw new Error("P2WPKH: uncompressed public key");
      const hash = hash160(publicKey);
      return {
        type: "wpkh",
        script: OutScript.encode({ type: "wpkh", hash }),
        address: Address(network).encode({ type: "wpkh", hash }),
        hash
      };
    };
    p2ms = (m, pubkeys, allowSamePubkeys = false) => {
      if (!allowSamePubkeys)
        uniqPubkey(pubkeys);
      return {
        type: "ms",
        script: OutScript.encode({ type: "ms", pubkeys, m })
      };
    };
    TAP_LEAF_VERSION = 192;
    tapLeafVersion = (version) => {
      if (version === void 0)
        return TAP_LEAF_VERSION;
      (0, import_utils13.anumber)(version, "leafVersion");
      if (version > 254 || version === 80 || !!(version & 1))
        throw new Error(`P2TR: invalid leafVersion=${version}`);
      return version;
    };
    tapLeafHash = (script, version = TAP_LEAF_VERSION) => tagSchnorr("TapLeaf", new Uint8Array([tapLeafVersion(version)]), VarBytes.encode(script));
    p2tr_ns = (m, pubkeys, allowSamePubkeys = false) => {
      if (!allowSamePubkeys)
        uniqPubkey(pubkeys);
      return combinations(m, pubkeys).map((i) => ({
        type: "tr_ns",
        script: OutScript.encode({ type: "tr_ns", pubkeys: i })
      }));
    };
    p2tr_pk = (pubkey) => p2tr_ns(1, [pubkey], void 0)[0];
    _sortPubkeys = (pubkeys) => Array.from(pubkeys).sort(compareBytes);
    base58check = /* @__PURE__ */ createBase58check(sha2563);
  }
});

// node_modules/@scure/btc-signer/transaction.js
function cloneDeep(obj) {
  if (Array.isArray(obj))
    return obj.map((i) => cloneDeep(i));
  else if (isBytes4(obj))
    return Uint8Array.from(obj);
  else if (["number", "bigint", "boolean", "string", "undefined"].includes(typeof obj))
    return obj;
  else if (obj === null)
    return obj;
  else if (typeof obj === "object") {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, cloneDeep(v)]));
  }
  throw new Error(`cloneDeep: unknown type=${typeof obj}`);
}
function getTaprootKeys(privKey, pubKey, internalKey, merkleRoot = EMPTY) {
  if (equalBytes2(internalKey, pubKey)) {
    privKey = taprootTweakPrivKey(privKey, merkleRoot);
    pubKey = pubSchnorr(privKey);
  }
  return { privKey, pubKey };
}
function outputBeforeSign(i) {
  if (i.script === void 0 || i.amount === void 0)
    throw new Error("Transaction/output: script and amount required");
  return { script: i.script, amount: i.amount };
}
function inputBeforeSign(i) {
  if (i.txid === void 0 || i.index === void 0)
    throw new Error("Transaction/input: txid and index required");
  const res = {
    txid: i.txid,
    index: i.index,
    sequence: def(i.sequence, DEFAULT_SEQUENCE),
    finalScriptSig: def(i.finalScriptSig, EMPTY)
  };
  RawInput.encode(res);
  return res;
}
function cleanFinalInput(i) {
  const _i = i;
  for (const _k in _i) {
    const k = _k;
    if (!PSBTInputFinalKeys.includes(k))
      delete _i[k];
  }
}
function validateSigHash(s) {
  if (typeof s !== "number" || typeof SigHashNames[s] !== "string")
    throw new Error(`Invalid SigHash=${s}`);
  return s;
}
function unpackSighash(hashType) {
  const masked = hashType & 31;
  return {
    isAny: !!(hashType & SignatureHash.ANYONECANPAY),
    isNone: masked === SignatureHash.NONE,
    isSingle: masked === SignatureHash.SINGLE
  };
}
function validateOpts(opts) {
  if (opts !== void 0 && {}.toString.call(opts) !== "[object Object]")
    throw new Error(`Wrong object type for transaction options: ${opts}`);
  const _opts = {
    ...opts,
    // Defaults
    version: def(opts.version, DEFAULT_VERSION),
    lockTime: def(opts.lockTime, 0),
    PSBTVersion: def(opts.PSBTVersion, 0)
  };
  if (typeof _opts.allowUnknowInput !== "undefined")
    _opts.allowUnknownInputs = _opts.allowUnknowInput;
  if (typeof _opts.allowUnknowOutput !== "undefined")
    _opts.allowUnknownOutputs = _opts.allowUnknowOutput;
  if (typeof _opts.lockTime !== "number")
    throw new Error("Transaction lock time should be number");
  U32LE.encode(_opts.lockTime);
  if (_opts.PSBTVersion !== 0 && _opts.PSBTVersion !== 2)
    throw new Error(`Unknown PSBT version ${_opts.PSBTVersion}`);
  for (const k of [
    "allowUnknownVersion",
    "allowUnknownOutputs",
    "allowUnknownInputs",
    "disableScriptCheck",
    "bip174jsCompat",
    "allowLegacyWitnessUtxo",
    "lowR"
  ]) {
    const v = _opts[k];
    if (v === void 0)
      continue;
    if (typeof v !== "boolean")
      throw new Error(`Transation options wrong type: ${k}=${v} (${typeof v})`);
  }
  if (_opts.allowUnknownVersion ? typeof _opts.version === "number" : ![-1, 0, 1, 2, 3].includes(_opts.version))
    throw new Error(`Unknown version: ${_opts.version}`);
  if (_opts.customScripts !== void 0) {
    const cs = _opts.customScripts;
    if (!Array.isArray(cs)) {
      throw new Error(`wrong custom scripts type (expected array): customScripts=${cs} (${typeof cs})`);
    }
    for (const s of cs) {
      if (typeof s.encode !== "function" || typeof s.decode !== "function")
        throw new Error(`wrong script=${s} (${typeof s})`);
      if (s.finalizeTaproot !== void 0 && typeof s.finalizeTaproot !== "function")
        throw new Error(`wrong script=${s} (${typeof s})`);
    }
  }
  return Object.freeze(_opts);
}
function validateInput(i) {
  const _i = i;
  if (_i.nonWitnessUtxo && _i.index !== void 0) {
    const last = _i.nonWitnessUtxo.outputs.length - 1;
    if (_i.index > last)
      throw new Error(`validateInput: index(${_i.index}) not in nonWitnessUtxo`);
    const prevOut = _i.nonWitnessUtxo.outputs[_i.index];
    if (_i.witnessUtxo && (!equalBytes2(_i.witnessUtxo.script, prevOut.script) || _i.witnessUtxo.amount !== prevOut.amount))
      throw new Error("validateInput: witnessUtxo different from nonWitnessUtxo");
    if (_i.txid) {
      const outputs = _i.nonWitnessUtxo.outputs;
      if (outputs.length - 1 < _i.index)
        throw new Error("nonWitnessUtxo: incorect output index");
      const tx = Transaction2.fromRaw(RawTx.encode(_i.nonWitnessUtxo), {
        allowUnknownOutputs: true,
        disableScriptCheck: true,
        allowUnknownInputs: true
      });
      const txid = hex2.encode(_i.txid);
      if (tx.id !== txid)
        throw new Error(`nonWitnessUtxo: wrong txid, exp=${txid} got=${tx.id}`);
    }
  }
  return _i;
}
function getPrevOut(input) {
  const _input = input;
  if (_input.nonWitnessUtxo) {
    if (_input.index === void 0)
      throw new Error("Unknown input index");
    if (!Number.isSafeInteger(_input.index) || _input.index < 0 || _input.index >= _input.nonWitnessUtxo.outputs.length)
      throw new Error(`Wrong input index=${_input.index}`);
    return _input.nonWitnessUtxo.outputs[_input.index];
  } else if (_input.witnessUtxo)
    return _input.witnessUtxo;
  else
    throw new Error("Cannot find previous output info");
}
function normalizeInput(i, cur, allowedFields, disableScriptCheck = false, allowUnknown = false) {
  const _i = i;
  const _cur = cur;
  const _allowedFields = allowedFields;
  let { nonWitnessUtxo, txid } = _i;
  if (typeof nonWitnessUtxo === "string")
    nonWitnessUtxo = hex2.decode(nonWitnessUtxo);
  if (isBytes4(nonWitnessUtxo))
    nonWitnessUtxo = RawTx.decode(nonWitnessUtxo);
  if (!("nonWitnessUtxo" in _i) && nonWitnessUtxo === void 0)
    nonWitnessUtxo = _cur?.nonWitnessUtxo;
  if (typeof txid === "string")
    txid = hex2.decode(txid);
  if (txid === void 0)
    txid = _cur?.txid;
  let res = { ..._cur, ..._i, nonWitnessUtxo, txid };
  if (!("nonWitnessUtxo" in _i) && res.nonWitnessUtxo === void 0)
    delete res.nonWitnessUtxo;
  if (res.sequence === void 0)
    res.sequence = DEFAULT_SEQUENCE;
  if (res.tapMerkleRoot === null)
    delete res.tapMerkleRoot;
  res = mergeKeyMap(PSBTInput, res, _cur, _allowedFields, allowUnknown);
  PSBTInputCoder.encode(res);
  let prevOut;
  if (res.nonWitnessUtxo && res.index !== void 0)
    prevOut = res.nonWitnessUtxo.outputs[res.index];
  else if (res.witnessUtxo)
    prevOut = res.witnessUtxo;
  if (prevOut && !disableScriptCheck)
    checkScript(prevOut && prevOut.script, res.redeemScript, res.witnessScript);
  return res;
}
function getInputType(input, allowLegacyWitnessUtxo = false) {
  const _input = input;
  let txType = "legacy";
  let defaultSighash = SignatureHash.ALL;
  const prevOut = getPrevOut(_input);
  const first = OutScript.decode(prevOut.script);
  let type = first.type;
  let cur = first;
  const stack = [first];
  if (first.type === "tr") {
    defaultSighash = SignatureHash.DEFAULT;
    return {
      txType: "taproot",
      type: "tr",
      last: first,
      lastScript: prevOut.script,
      defaultSighash,
      sighash: _input.sighashType || defaultSighash
    };
  } else {
    if (first.type === "wpkh" || first.type === "wsh")
      txType = "segwit";
    if (first.type === "sh") {
      if (!_input.redeemScript)
        throw new Error("inputType: sh without redeemScript");
      let child = OutScript.decode(_input.redeemScript);
      if (child.type === "wpkh" || child.type === "wsh")
        txType = "segwit";
      stack.push(child);
      cur = child;
      type += `-${child.type}`;
    }
    if (cur.type === "wsh") {
      if (!_input.witnessScript)
        throw new Error("inputType: wsh without witnessScript");
      let child = OutScript.decode(_input.witnessScript);
      if (child.type === "wsh")
        txType = "segwit";
      stack.push(child);
      cur = child;
      type += `-${child.type}`;
    }
    const last = stack[stack.length - 1];
    if (last.type === "sh" || last.type === "wsh")
      throw new Error("inputType: sh/wsh cannot be terminal type");
    const lastScript = OutScript.encode(last);
    const res = {
      type,
      txType,
      last,
      lastScript,
      defaultSighash,
      sighash: _input.sighashType || defaultSighash
    };
    if (txType === "legacy" && !allowLegacyWitnessUtxo && !_input.nonWitnessUtxo) {
      throw new Error(`Transaction/sign: legacy input without nonWitnessUtxo, can result in attack that forces paying higher fees. Pass allowLegacyWitnessUtxo=true, if you sure`);
    }
    return res;
  }
}
function PSBTCombine(psbts) {
  if (!psbts || !Array.isArray(psbts) || !psbts.length)
    throw new Error("PSBTCombine: wrong PSBT list");
  const tx = Transaction2.fromPSBT(psbts[0]);
  for (let i = 1; i < psbts.length; i++)
    tx.combine(Transaction2.fromPSBT(psbts[i]));
  return tx.toPSBT();
}
function bip32Path(path2) {
  const out = [];
  if (!/^[mM]'?/.test(path2))
    throw new Error('Path must start with "m" or "M"');
  if (/^[mM]'?$/.test(path2))
    return out;
  const parts = path2.replace(/^[mM]'?\//, "").split("/");
  if (parts.length > 255)
    throw new Error("Path depth exceeds 255");
  for (const c of parts) {
    const m = /^(\d+)('?)$/.exec(c);
    if (!m || m.length !== 3)
      throw new Error(`Invalid child index: ${c}`);
    let idx = +m[1];
    if (!Number.isSafeInteger(idx) || idx >= HARDENED_OFFSET)
      throw new Error("Invalid index");
    if (m[2] === "'")
      idx += HARDENED_OFFSET;
    out.push(idx);
  }
  return out;
}
var EMPTY32, EMPTY_OUTPUT, toVsize, stripCodeSeparator, PRECISION, DEFAULT_VERSION, DEFAULT_LOCKTIME, DEFAULT_SEQUENCE, Decimal, def, SignatureHash, SigHash, SigHashNames, TxHashIdx, Transaction2, HARDENED_OFFSET;
var init_transaction = __esm({
  "node_modules/@scure/btc-signer/transaction.js"() {
    init_base2();
    init_micro_packed();
    init_payment();
    init_psbt();
    init_script();
    init_utils2();
    init_utils2();
    EMPTY32 = /* @__PURE__ */ new Uint8Array(32);
    EMPTY_OUTPUT = {
      amount: 0xffffffffffffffffn,
      script: EMPTY
    };
    toVsize = (weight) => Math.ceil(weight / 4);
    stripCodeSeparator = (script) => {
      let start = 0;
      const out = [];
      for (let i = 0; i < script.length; ) {
        const pos = i;
        const op = script[i++];
        if (op === OP.CODESEPARATOR) {
          if (start < pos)
            out.push(script.subarray(start, pos));
          start = i;
          continue;
        }
        const len = scriptPushLen(op, (bytes2) => {
          if (i + bytes2 > script.length)
            throw new Error("Unexpected end of script");
          let len2 = 0;
          for (let j = 0; j < bytes2; j++)
            len2 |= script[i + j] << 8 * j;
          i += bytes2;
          return len2;
        });
        if (len === void 0)
          continue;
        i += len;
        if (i > script.length)
          throw new Error("Unexpected end of script");
      }
      if (start === 0)
        return script;
      if (start < script.length)
        out.push(script.subarray(start));
      return out.length ? concatBytes3(...out) : EMPTY;
    };
    PRECISION = 8;
    DEFAULT_VERSION = 2;
    DEFAULT_LOCKTIME = 0;
    DEFAULT_SEQUENCE = 4294967295;
    Decimal = /* @__PURE__ */ (() => Object.freeze(coders.decimal(PRECISION)))();
    def = (value, def2) => value === void 0 ? def2 : value;
    SignatureHash = /* @__PURE__ */ (() => Object.freeze({
      DEFAULT: 0,
      ALL: 1,
      NONE: 2,
      SINGLE: 3,
      ANYONECANPAY: 128
    }))();
    SigHash = /* @__PURE__ */ (() => Object.freeze({
      DEFAULT: SignatureHash.DEFAULT,
      ALL: SignatureHash.ALL,
      NONE: SignatureHash.NONE,
      SINGLE: SignatureHash.SINGLE,
      // BIP341 only permits 0x00, 0x01, 0x02, 0x03, 0x81, 0x82, and 0x83 for taproot, so
      // the mechanical `DEFAULT | ANYONECANPAY` combination (0x80) is invalid and not exported.
      // DEFAULT_ANYONECANPAY: SignatureHash.DEFAULT | SignatureHash.ANYONECANPAY,
      ALL_ANYONECANPAY: SignatureHash.ALL | SignatureHash.ANYONECANPAY,
      NONE_ANYONECANPAY: SignatureHash.NONE | SignatureHash.ANYONECANPAY,
      SINGLE_ANYONECANPAY: SignatureHash.SINGLE | SignatureHash.ANYONECANPAY
    }))();
    SigHashNames = /* @__PURE__ */ (() => Object.freeze(reverseObject(SigHash)))();
    TxHashIdx = /* @__PURE__ */ (() => struct({ txid: createBytes(32, true), index: U32LE }))();
    Transaction2 = class _Transaction {
      global = {};
      inputs = [];
      // use getInput()
      outputs = [];
      // use getOutput()
      opts;
      constructor(opts = {}) {
        const _opts = this.opts = validateOpts(opts);
        if (_opts.lockTime !== DEFAULT_LOCKTIME)
          this.global.fallbackLocktime = _opts.lockTime;
        this.global.txVersion = _opts.version;
      }
      // Import
      static fromRaw(raw, opts = {}) {
        const parsed = RawTx.decode(raw);
        const tx = new _Transaction({ ...opts, version: parsed.version, lockTime: parsed.lockTime });
        for (const o of parsed.outputs)
          tx.addOutput(o);
        tx.outputs = parsed.outputs;
        tx.inputs = parsed.inputs;
        if (parsed.witnesses) {
          for (let i = 0; i < parsed.witnesses.length; i++)
            tx.inputs[i].finalScriptWitness = parsed.witnesses[i];
        }
        return tx;
      }
      // PSBT
      static fromPSBT(psbt_, opts = {}) {
        let parsed;
        try {
          parsed = RawPSBTV0.decode(psbt_);
        } catch (e0) {
          try {
            parsed = RawPSBTV2.decode(psbt_);
          } catch (e2) {
            throw e0;
          }
        }
        const PSBTVersion = parsed.global.version || 0;
        if (PSBTVersion !== 0 && PSBTVersion !== 2)
          throw new Error(`Wrong PSBT version=${PSBTVersion}`);
        const unsigned = parsed.global.unsignedTx;
        const version = PSBTVersion === 0 ? unsigned?.version : parsed.global.txVersion;
        const lockTime = PSBTVersion === 0 ? unsigned?.lockTime : parsed.global.fallbackLocktime;
        const tx = new _Transaction({ ...opts, version, lockTime, PSBTVersion });
        const inputCount = PSBTVersion === 0 ? unsigned?.inputs.length : parsed.global.inputCount;
        tx.inputs = parsed.inputs.slice(0, inputCount).map((i, j) => validateInput({
          finalScriptSig: EMPTY,
          ...parsed.global.unsignedTx?.inputs[j],
          ...i
        }));
        const outputCount = PSBTVersion === 0 ? unsigned?.outputs.length : parsed.global.outputCount;
        tx.outputs = parsed.outputs.slice(0, outputCount).map((i, j) => ({
          ...i,
          ...parsed.global.unsignedTx?.outputs[j]
        }));
        tx.global = { ...parsed.global, txVersion: version };
        if (lockTime !== DEFAULT_LOCKTIME)
          tx.global.fallbackLocktime = lockTime;
        return tx;
      }
      // Prefer `global.version` when present so cross-version combiners can serialize at the highest
      // required PSBT version without mutating the frozen transaction options object.
      toPSBT(PSBTVersion = this.global.version || this.opts.PSBTVersion) {
        if (PSBTVersion !== 0 && PSBTVersion !== 2)
          throw new Error(`Wrong PSBT version=${PSBTVersion}`);
        const inputs = this.inputs.map((i) => (
          // For PSBTv0 the prevout txid/index live in global.unsignedTx rather than the input map, so
          // validate the full transaction input before version filtering drops those fields.
          cleanPSBTFields(PSBTVersion, PSBTInput, validateInput(i))
        ));
        for (const inp of inputs) {
          if (inp.partialSig && !inp.partialSig.length)
            delete inp.partialSig;
          if (inp.finalScriptSig && !inp.finalScriptSig.length)
            delete inp.finalScriptSig;
          if (inp.finalScriptWitness && !inp.finalScriptWitness.length)
            delete inp.finalScriptWitness;
        }
        const outputs = this.outputs.map((i) => cleanPSBTFields(PSBTVersion, PSBTOutput, i));
        const global2 = { ...this.global };
        if (PSBTVersion === 0) {
          global2.unsignedTx = RawOldTx.decode(RawOldTx.encode({
            version: this.version,
            lockTime: this.lockTime,
            inputs: this.inputs.map((i) => inputBeforeSign(i)).map((i) => ({
              ...i,
              finalScriptSig: EMPTY
            })),
            outputs: this.outputs.map((o) => outputBeforeSign(o))
          }));
          delete global2.fallbackLocktime;
          delete global2.txVersion;
          delete global2.inputCount;
          delete global2.outputCount;
          delete global2.version;
        } else {
          delete global2.unsignedTx;
          global2.version = PSBTVersion;
          global2.txVersion = this.version;
          global2.inputCount = this.inputs.length;
          global2.outputCount = this.outputs.length;
          if (global2.fallbackLocktime && global2.fallbackLocktime === DEFAULT_LOCKTIME)
            delete global2.fallbackLocktime;
        }
        if (this.opts.bip174jsCompat) {
          if (!inputs.length)
            inputs.push({});
          if (!outputs.length)
            outputs.push({});
        }
        const raw = { global: global2, inputs, outputs };
        return PSBTVersion === 0 ? RawPSBTV0.encode(raw) : RawPSBTV2.encode(raw);
      }
      // BIP370 lockTime (https://github.com/bitcoin/bips/blob/master/bip-0370.mediawiki#determining-lock-time)
      get lockTime() {
        let height = DEFAULT_LOCKTIME;
        let heightCnt = 0;
        let time = DEFAULT_LOCKTIME;
        let timeCnt = 0;
        for (const i of this.inputs) {
          if (i.requiredHeightLocktime) {
            height = Math.max(height, i.requiredHeightLocktime);
            heightCnt++;
          }
          if (i.requiredTimeLocktime) {
            time = Math.max(time, i.requiredTimeLocktime);
            timeCnt++;
          }
        }
        if (heightCnt && heightCnt >= timeCnt)
          return height;
        if (time !== DEFAULT_LOCKTIME)
          return time;
        return this.global.fallbackLocktime || DEFAULT_LOCKTIME;
      }
      get version() {
        if (this.global.txVersion === void 0)
          throw new Error("No global.txVersion");
        return this.global.txVersion;
      }
      inputStatus(idx) {
        this.checkInputIdx(idx);
        const input = this.inputs[idx];
        if (input.finalScriptSig && input.finalScriptSig.length)
          return "finalized";
        if (input.finalScriptWitness && input.finalScriptWitness.length)
          return "finalized";
        if (input.tapKeySig)
          return "signed";
        if (input.tapScriptSig && input.tapScriptSig.length)
          return "signed";
        if (input.partialSig && input.partialSig.length)
          return "signed";
        return "unsigned";
      }
      // Cannot replace unpackSighash, tests rely on very generic implemenetation with signing inputs outside of range
      // We will lose some vectors -> smaller test coverage of preimages (very important!)
      inputSighash(idx) {
        this.checkInputIdx(idx);
        const inputSighash = this.inputs[idx].sighashType;
        const sighash = inputSighash === void 0 ? SignatureHash.DEFAULT : inputSighash;
        const sigOutputs = sighash === SignatureHash.DEFAULT ? SignatureHash.ALL : sighash & 3;
        const sigInputs = sighash & SignatureHash.ANYONECANPAY;
        return { sigInputs, sigOutputs };
      }
      // Very nice for debug purposes, but slow. If there is too much inputs/outputs to add, will be quadratic.
      // Some cache will be nice, but there chance to have bugs with cache invalidation
      signStatus() {
        let addInput = true, addOutput = true;
        let inputs = [], outputs = [];
        for (let idx = 0; idx < this.inputs.length; idx++) {
          const status = this.inputStatus(idx);
          if (status === "unsigned")
            continue;
          const { sigInputs, sigOutputs } = this.inputSighash(idx);
          if (sigInputs === SignatureHash.ANYONECANPAY)
            inputs.push(idx);
          else
            addInput = false;
          if (sigOutputs === SignatureHash.ALL)
            addOutput = false;
          else if (sigOutputs === SignatureHash.SINGLE)
            outputs.push(idx);
          else if (sigOutputs === SignatureHash.NONE) {
          } else
            throw new Error(`Wrong signature hash output type: ${sigOutputs}`);
        }
        return { addInput, addOutput, inputs, outputs };
      }
      get isFinal() {
        for (let idx = 0; idx < this.inputs.length; idx++)
          if (this.inputStatus(idx) !== "finalized")
            return false;
        return true;
      }
      // Info utils
      get hasWitnesses() {
        let out = false;
        for (const i of this.inputs)
          if (i.finalScriptWitness && i.finalScriptWitness.length)
            out = true;
        return out;
      }
      // https://en.bitcoin.it/wiki/Weight_units
      get weight() {
        if (!this.isFinal)
          throw new Error("Transaction is not finalized");
        let out = 32;
        const outputs = this.outputs.map(outputBeforeSign);
        out += 4 * CompactSizeLen.encode(this.outputs.length).length;
        for (const o of outputs)
          out += 32 + 4 * VarBytes.encode(o.script).length;
        if (this.hasWitnesses)
          out += 2;
        out += 4 * CompactSizeLen.encode(this.inputs.length).length;
        for (const i of this.inputs) {
          out += 160 + 4 * VarBytes.encode(i.finalScriptSig || EMPTY).length;
          if (this.hasWitnesses)
            out += RawWitness.encode(i.finalScriptWitness || []).length;
        }
        return out;
      }
      get vsize() {
        return toVsize(this.weight);
      }
      toBytes(withScriptSig = false, withWitness = false) {
        return RawTx.encode({
          version: this.version,
          lockTime: this.lockTime,
          inputs: this.inputs.map(inputBeforeSign).map((i) => ({
            ...i,
            finalScriptSig: withScriptSig && i.finalScriptSig || EMPTY
          })),
          outputs: this.outputs.map(outputBeforeSign),
          witnesses: this.inputs.map((i) => i.finalScriptWitness || []),
          segwitFlag: withWitness && this.hasWitnesses
        });
      }
      get unsignedTx() {
        return this.toBytes(false, false);
      }
      get hex() {
        return hex2.encode(this.toBytes(true, this.hasWitnesses));
      }
      get hash() {
        return hex2.encode(sha256x2(this.toBytes(true)));
      }
      get id() {
        return hex2.encode(sha256x2(this.toBytes(true)).reverse());
      }
      // Input stuff
      checkInputIdx(idx) {
        if (!Number.isSafeInteger(idx) || 0 > idx || idx >= this.inputs.length)
          throw new Error(`Wrong input index=${idx}`);
      }
      getInput(idx) {
        this.checkInputIdx(idx);
        return cloneDeep(this.inputs[idx]);
      }
      get inputsLength() {
        return this.inputs.length;
      }
      // Modification
      addInput(input, _ignoreSignStatus = false) {
        if (!_ignoreSignStatus && !this.signStatus().addInput)
          throw new Error("Tx has signed inputs, cannot add new one");
        this.inputs.push(cloneDeep(normalizeInput(input, void 0, void 0, this.opts.disableScriptCheck)));
        return this.inputs.length - 1;
      }
      updateInput(idx, input, _ignoreSignStatus = false) {
        this.checkInputIdx(idx);
        let allowedFields = void 0;
        if (!_ignoreSignStatus) {
          const status = this.signStatus();
          if (!status.addInput || status.inputs.includes(idx))
            allowedFields = PSBTInputUnsignedKeys;
        }
        this.inputs[idx] = cloneDeep(normalizeInput(input, this.inputs[idx], allowedFields, this.opts.disableScriptCheck, this.opts.allowUnknown));
      }
      // Output stuff
      checkOutputIdx(idx) {
        if (!Number.isSafeInteger(idx) || 0 > idx || idx >= this.outputs.length)
          throw new Error(`Wrong output index=${idx}`);
      }
      getOutput(idx) {
        this.checkOutputIdx(idx);
        return cloneDeep(this.outputs[idx]);
      }
      getOutputAddress(idx, network = NETWORK) {
        const out = this.getOutput(idx);
        if (!out.script)
          return;
        return Address(network).encode(OutScript.decode(out.script));
      }
      get outputsLength() {
        return this.outputs.length;
      }
      normalizeOutput(o, cur, allowedFields) {
        let { amount, script } = o;
        if (amount === void 0)
          amount = cur?.amount;
        if (typeof amount !== "bigint")
          throw new Error(`Wrong amount type, should be of type bigint in sats, but got ${amount} of type ${typeof amount}`);
        if (typeof script === "string")
          script = hex2.decode(script);
        if (script === void 0)
          script = cur?.script;
        let res = { ...cur, ...o, amount, script };
        if (res.amount === void 0)
          delete res.amount;
        res = mergeKeyMap(PSBTOutput, res, cur, allowedFields, this.opts.allowUnknown);
        PSBTOutputCoder.encode(res);
        if (res.script && !this.opts.allowUnknownOutputs && OutScript.decode(res.script).type === "unknown") {
          throw new Error("Transaction/output: unknown output script type, there is a chance that input is unspendable. Pass allowUnknownOutputs=true, if you sure");
        }
        if (!this.opts.disableScriptCheck)
          checkScript(res.script, res.redeemScript, res.witnessScript);
        return res;
      }
      addOutput(o, _ignoreSignStatus = false) {
        if (!_ignoreSignStatus && !this.signStatus().addOutput)
          throw new Error("Tx has signed outputs, cannot add new one");
        this.outputs.push(cloneDeep(this.normalizeOutput(o)));
        return this.outputs.length - 1;
      }
      updateOutput(idx, output, _ignoreSignStatus = false) {
        this.checkOutputIdx(idx);
        let allowedFields = void 0;
        if (!_ignoreSignStatus) {
          const status = this.signStatus();
          if (!status.addOutput || status.outputs.includes(idx))
            allowedFields = PSBTOutputUnsignedKeys;
        }
        this.outputs[idx] = cloneDeep(this.normalizeOutput(output, this.outputs[idx], allowedFields));
      }
      addOutputAddress(address, amount, network = NETWORK) {
        return this.addOutput({
          // Address.decode() only returns recognized descriptors here, but its wrapped output type
          // still carries `undefined` for coder parity, so narrow before feeding OutScript.encode().
          script: OutScript.encode(Address(network).decode(address)),
          amount
        });
      }
      // Utils
      get fee() {
        let res = 0n;
        for (const i of this.inputs) {
          const prevOut = getPrevOut(i);
          if (!prevOut)
            throw new Error("Empty input amount");
          res += prevOut.amount;
        }
        const outputs = this.outputs.map(outputBeforeSign);
        for (const o of outputs)
          res -= o.amount;
        return res;
      }
      // Signing
      // Based on https://github.com/bitcoin/bitcoin/blob/5871b5b5ab57a0caf9b7514eb162c491c83281d5/test/functional/test_framework/script.py#L624
      // There is optimization opportunity to re-use hashes for multiple inputs for witness v0/v1,
      // but we are trying to be less complicated for audit purpose for now.
      preimageLegacy(idx, prevOutScript, hashType) {
        const { isAny, isNone, isSingle } = unpackSighash(hashType);
        if (idx < 0 || !Number.isSafeInteger(idx))
          throw new Error(`Invalid input idx=${idx}`);
        if (isSingle && idx >= this.outputs.length || idx >= this.inputs.length)
          return U256BE.encode(1n);
        prevOutScript = stripCodeSeparator(prevOutScript);
        let inputs = this.inputs.map(inputBeforeSign).map((input, inputIdx) => ({
          ...input,
          finalScriptSig: inputIdx === idx ? prevOutScript : EMPTY
        }));
        if (isAny)
          inputs = [inputs[idx]];
        else if (isNone || isSingle) {
          inputs = inputs.map((input, inputIdx) => ({
            ...input,
            sequence: inputIdx === idx ? input.sequence : 0
          }));
        }
        let outputs = this.outputs.map(outputBeforeSign);
        if (isNone)
          outputs = [];
        else if (isSingle) {
          outputs = outputs.slice(0, idx).fill(EMPTY_OUTPUT).concat([outputs[idx]]);
        }
        const tmpTx = RawTx.encode({
          lockTime: this.lockTime,
          version: this.version,
          segwitFlag: false,
          inputs,
          outputs
        });
        return sha256x2(tmpTx, I32LE.encode(hashType));
      }
      preimageWitnessV0(idx, prevOutScript, hashType, amount) {
        if (idx < 0 || !Number.isSafeInteger(idx) || idx >= this.inputs.length)
          throw new Error(`Invalid input idx=${idx}`);
        const { isAny, isNone, isSingle } = unpackSighash(hashType);
        let inputHash = EMPTY32;
        let sequenceHash = EMPTY32;
        let outputHash = EMPTY32;
        const inputs = this.inputs.map(inputBeforeSign);
        const outputs = this.outputs.map(outputBeforeSign);
        if (!isAny)
          inputHash = sha256x2(...inputs.map(TxHashIdx.encode));
        if (!isAny && !isSingle && !isNone)
          sequenceHash = sha256x2(...inputs.map((i) => U32LE.encode(i.sequence)));
        if (!isSingle && !isNone) {
          outputHash = sha256x2(...outputs.map(RawOutput.encode));
        } else if (isSingle && idx < outputs.length)
          outputHash = sha256x2(RawOutput.encode(outputs[idx]));
        const input = inputs[idx];
        return sha256x2(I32LE.encode(this.version), inputHash, sequenceHash, createBytes(32, true).encode(input.txid), U32LE.encode(input.index), VarBytes.encode(prevOutScript), U64LE.encode(amount), U32LE.encode(input.sequence), outputHash, U32LE.encode(this.lockTime), U32LE.encode(hashType));
      }
      preimageWitnessV1(idx, prevOutScript, hashType, amount, codeSeparator = -1, leafScript, leafVer = 192, annex) {
        if (!Array.isArray(amount) || this.inputs.length !== amount.length)
          throw new Error(`Invalid amounts array=${amount}`);
        if (!Array.isArray(prevOutScript) || this.inputs.length !== prevOutScript.length)
          throw new Error(`Invalid prevOutScript array=${prevOutScript}`);
        if (idx < 0 || !Number.isSafeInteger(idx) || idx >= this.inputs.length)
          throw new Error(`Invalid input idx=${idx}`);
        const out = [
          U8.encode(0),
          U8.encode(hashType),
          // U8 sigHash
          I32LE.encode(this.version),
          U32LE.encode(this.lockTime)
        ];
        const outType = hashType === SignatureHash.DEFAULT ? SignatureHash.ALL : hashType & 3;
        const inType = hashType & SignatureHash.ANYONECANPAY;
        const inputs = this.inputs.map(inputBeforeSign);
        const outputs = this.outputs.map(outputBeforeSign);
        if (inType !== SignatureHash.ANYONECANPAY) {
          out.push(...[
            inputs.map(TxHashIdx.encode),
            amount.map(U64LE.encode),
            prevOutScript.map(VarBytes.encode),
            inputs.map((i) => U32LE.encode(i.sequence))
          ].map((i) => sha2563(concatBytes3(...i))));
        }
        if (outType === SignatureHash.ALL) {
          out.push(sha2563(concatBytes3(...outputs.map(RawOutput.encode))));
        }
        const spendType = (annex ? 1 : 0) | (leafScript ? 2 : 0);
        out.push(new Uint8Array([spendType]));
        if (inType === SignatureHash.ANYONECANPAY) {
          const inp = inputs[idx];
          out.push(TxHashIdx.encode(inp), U64LE.encode(amount[idx]), VarBytes.encode(prevOutScript[idx]), U32LE.encode(inp.sequence));
        } else
          out.push(U32LE.encode(idx));
        if (spendType & 1)
          out.push(sha2563(VarBytes.encode(annex || EMPTY)));
        if (outType === SignatureHash.SINGLE)
          out.push(idx < outputs.length ? sha2563(RawOutput.encode(outputs[idx])) : EMPTY32);
        if (leafScript)
          out.push(tapLeafHash(leafScript, leafVer), U8.encode(0), I32LE.encode(codeSeparator));
        return tagSchnorr("TapSighash", ...out);
      }
      // Signer can be privateKey OR instance of bip32 HD stuff
      signIdx(privateKey, idx, allowedSighash, _auxRand) {
        this.checkInputIdx(idx);
        const input = this.inputs[idx];
        const inputType = getInputType(input, this.opts.allowLegacyWitnessUtxo);
        const canSign = (privateKey2) => {
          if (inputType.txType === "taproot") {
            const pubKey2 = pubSchnorr(privateKey2);
            if (input.tapInternalKey && equalBytes2(pubKey2, input.tapInternalKey))
              return true;
            if (!input.tapLeafScript)
              return false;
            for (const [_, leaf] of input.tapLeafScript) {
              for (const op of Script.decode(leaf.subarray(0, -1))) {
                if (isBytes4(op) && equalBytes2(op, pubKey2))
                  return true;
              }
            }
            return false;
          }
          const pubKey = pubECDSA(privateKey2);
          const pubKeyHash = hash160(pubKey);
          for (const op of Script.decode(inputType.lastScript)) {
            if (isBytes4(op) && (equalBytes2(op, pubKey) || equalBytes2(op, pubKeyHash)))
              return true;
          }
          return false;
        };
        if (!isBytes4(privateKey)) {
          const root = privateKey;
          const deriveSigners = (label, rows, pubKey) => {
            if (!rows || !rows.length)
              throw new Error(`${label}: empty`);
            const signers2 = rows.filter((row) => row.fingerprint == root.fingerprint).map((row) => {
              let s = root;
              for (const i of row.path)
                s = s.deriveChild(i);
              if (!equalBytes2(pubKey(s), row.pubKey))
                throw new Error(`${label}: wrong pubKey`);
              if (!s.privateKey)
                throw new Error(`${label}: no privateKey`);
              return s;
            });
            if (!signers2.length)
              throw new Error(`${label}: no items with fingerprint=${root.fingerprint}`);
            return signers2;
          };
          const signers = inputType.txType === "taproot" ? (
            // BIP371 PSBT_IN_TAP_BIP32_DERIVATION stores x-only pubkeys plus `der`, so taproot HD
            // signing must derive against that map instead of legacy bip32Derivation.
            deriveSigners("tapBip32Derivation", input.tapBip32Derivation?.map(([pubKey, { der }]) => ({
              pubKey,
              fingerprint: der.fingerprint,
              path: der.path
            })), (s) => s.publicKey.slice(1))
          ) : deriveSigners("bip32Derivation", input.bip32Derivation?.map(([pubKey, der]) => ({
            pubKey,
            fingerprint: der.fingerprint,
            path: der.path
          })), (s) => s.publicKey);
          let signed = false;
          for (const s of signers) {
            if (!canSign(s.privateKey))
              continue;
            if (this.signIdx(s.privateKey, idx, allowedSighash, _auxRand))
              signed = true;
          }
          if (signed)
            return true;
          if (inputType.txType === "taproot")
            throw new Error("No taproot scripts signed");
          throw new Error(`Input script doesn't have pubKey: ${inputType.lastScript}`);
        }
        if (!allowedSighash)
          allowedSighash = [inputType.defaultSighash];
        else
          allowedSighash.forEach(validateSigHash);
        const sighash = inputType.sighash;
        if (!allowedSighash.includes(sighash)) {
          throw new Error(`Input with not allowed sigHash=${sighash}. Allowed: ${allowedSighash.join(", ")}`);
        }
        const { sigOutputs } = this.inputSighash(idx);
        if (sigOutputs === SignatureHash.SINGLE && idx >= this.outputs.length) {
          throw new Error(`Input with sighash SINGLE, but there is no output with corresponding index=${idx}`);
        }
        const prevOut = getPrevOut(input);
        if (inputType.txType === "taproot") {
          const prevOuts = this.inputs.map(getPrevOut);
          const prevOutScript = prevOuts.map((i) => i.script);
          const amount = prevOuts.map((i) => i.amount);
          let signed = false;
          let schnorrPub = pubSchnorr(privateKey);
          let merkleRoot = input.tapMerkleRoot || EMPTY;
          if (input.tapInternalKey) {
            const { pubKey, privKey } = getTaprootKeys(privateKey, schnorrPub, input.tapInternalKey, merkleRoot);
            const [taprootPubKey, _] = taprootTweakPubkey(input.tapInternalKey, merkleRoot);
            if (equalBytes2(taprootPubKey, pubKey)) {
              const hash = this.preimageWitnessV1(idx, prevOutScript, sighash, amount);
              const sig = concatBytes3(signSchnorr(hash, privKey, _auxRand), sighash !== SignatureHash.DEFAULT ? new Uint8Array([sighash]) : EMPTY);
              this.updateInput(idx, { tapKeySig: sig }, true);
              signed = true;
            }
          }
          if (input.tapLeafScript) {
            input.tapScriptSig = input.tapScriptSig || [];
            for (const [_, _script] of input.tapLeafScript) {
              const script = _script.subarray(0, -1);
              const scriptDecoded = Script.decode(script);
              const ver = _script[_script.length - 1];
              const hash = tapLeafHash(script, ver);
              const pos = scriptDecoded.findIndex((i) => isBytes4(i) && equalBytes2(i, schnorrPub));
              if (pos === -1)
                continue;
              const msg = this.preimageWitnessV1(idx, prevOutScript, sighash, amount, void 0, script, ver);
              const sig = concatBytes3(signSchnorr(msg, privateKey, _auxRand), sighash !== SignatureHash.DEFAULT ? new Uint8Array([sighash]) : EMPTY);
              this.updateInput(idx, { tapScriptSig: [[{ pubKey: schnorrPub, leafHash: hash }, sig]] }, true);
              signed = true;
            }
          }
          if (!signed)
            throw new Error("No taproot scripts signed");
          return true;
        } else {
          const pubKey = pubECDSA(privateKey);
          let hasPubkey = false;
          const pubKeyHash = hash160(pubKey);
          for (const i of Script.decode(inputType.lastScript)) {
            if (isBytes4(i) && (equalBytes2(i, pubKey) || equalBytes2(i, pubKeyHash)))
              hasPubkey = true;
          }
          if (!hasPubkey)
            throw new Error(`Input script doesn't have pubKey: ${inputType.lastScript}`);
          let hash;
          if (inputType.txType === "legacy") {
            hash = this.preimageLegacy(idx, inputType.lastScript, sighash);
          } else if (inputType.txType === "segwit") {
            let script = inputType.lastScript;
            if (inputType.last.type === "wpkh")
              script = OutScript.encode({ type: "pkh", hash: inputType.last.hash });
            hash = this.preimageWitnessV0(idx, script, sighash, prevOut.amount);
          } else
            throw new Error(`Transaction/sign: unknown tx type: ${inputType.txType}`);
          const sig = signECDSA(hash, privateKey, this.opts.lowR);
          this.updateInput(idx, {
            partialSig: [[pubKey, concatBytes3(sig, new Uint8Array([sighash]))]]
          }, true);
        }
        return true;
      }
      // This is bad API. Will work if user creates and signs tx, but if
      // there is some complex workflow with exchanging PSBT and signing them,
      // then it is better to validate which output user signs. How could a better API look like?
      // Example: user adds input, sends to another party, then signs received input (mixer etc),
      // another user can add different input for same key and user will sign it.
      // Even worse: another user can add bip32 derivation, and spend money from different address.
      // Better api: signIdx
      sign(privateKey, allowedSighash, _auxRand) {
        let num2 = 0;
        for (let i = 0; i < this.inputs.length; i++) {
          try {
            if (this.signIdx(privateKey, i, allowedSighash, _auxRand))
              num2++;
          } catch (e) {
          }
        }
        if (!num2)
          throw new Error("No inputs signed");
        return num2;
      }
      finalizeIdx(idx) {
        this.checkInputIdx(idx);
        if (this.fee < 0n)
          throw new Error("Outputs spends more than inputs amount");
        const input = this.inputs[idx];
        const inputType = getInputType(input, this.opts.allowLegacyWitnessUtxo);
        if (inputType.txType === "taproot") {
          if (input.tapKeySig)
            input.finalScriptWitness = [input.tapKeySig];
          else if (input.tapLeafScript && input.tapScriptSig) {
            const leafs = input.tapLeafScript.sort((a, b) => TaprootControlBlock.encode(a[0]).length - TaprootControlBlock.encode(b[0]).length);
            for (const [cb, _script] of leafs) {
              const script = _script.slice(0, -1);
              const ver = _script[_script.length - 1];
              const outScript = OutScript.decode(script);
              const hash = tapLeafHash(script, ver);
              const scriptSig = input.tapScriptSig.filter((i) => equalBytes2(i[0].leafHash, hash));
              let signatures = [];
              if (outScript.type === "tr_ms") {
                const m = outScript.m;
                const pubkeys = outScript.pubkeys;
                let added = 0;
                for (const pub of pubkeys) {
                  const sigIdx = scriptSig.findIndex((i) => equalBytes2(i[0].pubKey, pub));
                  if (added === m || sigIdx === -1) {
                    signatures.push(EMPTY);
                    continue;
                  }
                  signatures.push(scriptSig[sigIdx][1]);
                  added++;
                }
                if (added !== m)
                  continue;
              } else if (outScript.type === "tr_ns") {
                for (const pub of outScript.pubkeys) {
                  const sigIdx = scriptSig.findIndex((i) => equalBytes2(i[0].pubKey, pub));
                  if (sigIdx === -1)
                    continue;
                  signatures.push(scriptSig[sigIdx][1]);
                }
                if (signatures.length !== outScript.pubkeys.length)
                  continue;
              } else if (outScript.type === "unknown" && this.opts.allowUnknownInputs) {
                const scriptDecoded = Script.decode(script);
                signatures = scriptSig.map(([{ pubKey }, signature]) => {
                  const pos = scriptDecoded.findIndex((i) => isBytes4(i) && equalBytes2(i, pubKey));
                  if (pos === -1)
                    throw new Error("finalize/taproot: cannot find position of pubkey in script");
                  return { signature, pos };
                }).sort((a, b) => a.pos - b.pos).map((i) => i.signature);
                if (!signatures.length)
                  continue;
              } else {
                const custom = this.opts.customScripts;
                if (custom) {
                  for (const c of custom) {
                    if (!c.finalizeTaproot)
                      continue;
                    const scriptDecoded = Script.decode(script);
                    const csEncoded = c.encode(scriptDecoded);
                    if (csEncoded === void 0)
                      continue;
                    const finalized = c.finalizeTaproot(script, csEncoded, scriptSig);
                    if (!finalized)
                      continue;
                    input.finalScriptWitness = finalized.concat(TaprootControlBlock.encode(cb));
                    delete input.finalScriptSig;
                    cleanFinalInput(input);
                    return;
                  }
                }
                throw new Error("Finalize: Unknown tapLeafScript");
              }
              input.finalScriptWitness = signatures.reverse().concat([script, TaprootControlBlock.encode(cb)]);
              break;
            }
            if (!input.finalScriptWitness)
              throw new Error("finalize/taproot: empty witness");
          } else
            throw new Error("finalize/taproot: unknown input");
          delete input.finalScriptSig;
          cleanFinalInput(input);
          return;
        }
        if (!input.partialSig || !input.partialSig.length)
          throw new Error("Not enough partial sign");
        let inputScript = EMPTY;
        let witness = [];
        if (inputType.last.type === "ms") {
          const m = inputType.last.m;
          const pubkeys = inputType.last.pubkeys;
          let signatures = [];
          for (const pub of pubkeys) {
            const sign = input.partialSig.find((s) => equalBytes2(pub, s[0]));
            if (!sign)
              continue;
            signatures.push(sign[1]);
          }
          signatures = signatures.slice(0, m);
          if (signatures.length !== m) {
            throw new Error(`Multisig: wrong signatures count, m=${m} n=${pubkeys.length} signatures=${signatures.length}`);
          }
          inputScript = Script.encode([0, ...signatures]);
        } else if (inputType.last.type === "pk") {
          inputScript = Script.encode([input.partialSig[0][1]]);
        } else if (inputType.last.type === "pkh") {
          inputScript = Script.encode([input.partialSig[0][1], input.partialSig[0][0]]);
        } else if (inputType.last.type === "wpkh") {
          inputScript = EMPTY;
          witness = [input.partialSig[0][1], input.partialSig[0][0]];
        } else if (inputType.last.type === "unknown" && !this.opts.allowUnknownInputs)
          throw new Error("Unknown inputs not allowed");
        let finalScriptSig, finalScriptWitness;
        if (inputType.type.includes("wsh-")) {
          if (inputScript.length && inputType.lastScript.length) {
            witness = Script.decode(inputScript).map((i) => {
              if (i === 0)
                return EMPTY;
              if (isBytes4(i))
                return i;
              throw new Error(`Wrong witness op=${i}`);
            });
          }
          witness = witness.concat(inputType.lastScript);
        }
        if (inputType.txType === "segwit")
          finalScriptWitness = witness;
        if (inputType.type.startsWith("sh-wsh-")) {
          finalScriptSig = Script.encode([Script.encode([0, sha2563(inputType.lastScript)])]);
        } else if (inputType.type.startsWith("sh-")) {
          finalScriptSig = Script.encode([...Script.decode(inputScript), inputType.lastScript]);
        } else if (inputType.type.startsWith("wsh-")) {
        } else if (inputType.txType !== "segwit")
          finalScriptSig = inputScript;
        if (!finalScriptSig && !finalScriptWitness)
          throw new Error("Unknown error finalizing input");
        if (finalScriptSig)
          input.finalScriptSig = finalScriptSig;
        if (finalScriptWitness)
          input.finalScriptWitness = finalScriptWitness;
        cleanFinalInput(input);
      }
      finalize() {
        for (let i = 0; i < this.inputs.length; i++)
          this.finalizeIdx(i);
      }
      extract() {
        if (!this.isFinal)
          throw new Error("Transaction has unfinalized inputs");
        if (!this.outputs.length)
          throw new Error("Transaction has no outputs");
        if (this.fee < 0n)
          throw new Error("Outputs spends more than inputs amount");
        return this.toBytes(true, true);
      }
      combine(other) {
        const PSBTVersion = Math.max(this.opts.PSBTVersion || 0, other.opts.PSBTVersion || 0);
        for (const k of ["version", "lockTime"]) {
          if (this.opts[k] !== other.opts[k]) {
            throw new Error(`Transaction/combine: different ${k} this=${this.opts[k]} other=${other.opts[k]}`);
          }
        }
        for (const k of ["inputs", "outputs"]) {
          if (this[k].length !== other[k].length) {
            throw new Error(`Transaction/combine: different ${k} length this=${this[k].length} other=${other[k].length}`);
          }
        }
        if (!equalBytes2(this.unsignedTx, other.unsignedTx))
          throw new Error(`Transaction/combine: different unsigned tx`);
        this.global = mergeKeyMap(PSBTGlobal, this.global, other.global, void 0, this.opts.allowUnknown);
        if (PSBTVersion)
          this.global.version = PSBTVersion;
        for (let i = 0; i < this.inputs.length; i++)
          this.updateInput(i, other.inputs[i], true);
        for (let i = 0; i < this.outputs.length; i++)
          this.updateOutput(i, other.outputs[i], true);
        return this;
      }
      clone() {
        return _Transaction.fromPSBT(this.toPSBT(), this.opts);
      }
    };
    HARDENED_OFFSET = 2147483648;
  }
});

// node_modules/@scure/btc-signer/utxo.js
function iterLeafs(tapLeafScript, sigSize, customScripts) {
  const _tapLeafScript = tapLeafScript;
  const _customScripts = customScripts;
  if (!_tapLeafScript || !_tapLeafScript.length)
    throw new Error("no leafs");
  const empty = () => new Uint8Array(sigSize);
  const leafs = _tapLeafScript.sort((a, b) => encodeTapBlock(a[0]).length - encodeTapBlock(b[0]).length);
  for (const [cb, _script] of leafs) {
    const script = _script.slice(0, -1);
    const ver = _script[_script.length - 1];
    const outs = OutScript.decode(script);
    let signatures = [];
    if (outs.type === "tr_ms") {
      const m = outs.m;
      const n = outs.pubkeys.length - m;
      for (let i = 0; i < m; i++)
        signatures.push(empty());
      for (let i = 0; i < n; i++)
        signatures.push(EMPTY);
    } else if (outs.type === "tr_ns") {
      for (const _pub of outs.pubkeys)
        signatures.push(empty());
    } else {
      if (!_customScripts)
        throw new Error("Finalize: Unknown tapLeafScript");
      const leafHash = tapLeafHash(script, ver);
      for (const c of _customScripts) {
        if (!c.finalizeTaproot)
          continue;
        const scriptDecoded = Script.decode(script);
        const csEncoded = c.encode(scriptDecoded);
        if (csEncoded === void 0)
          continue;
        const pubKeys = scriptDecoded.filter((i) => {
          if (!isBytes4(i))
            return false;
          try {
            validatePubkey(i, PubT.schnorr);
            return true;
          } catch (e) {
            return false;
          }
        });
        const finalized = c.finalizeTaproot(script, csEncoded, pubKeys.map((pubKey) => [{ pubKey, leafHash }, empty()]));
        if (!finalized)
          continue;
        return finalized.concat(encodeTapBlock(cb));
      }
    }
    return signatures.reverse().concat([script, encodeTapBlock(cb)]);
  }
  throw new Error("there was no witness");
}
function estimateInput(inputType, input, opts) {
  const _input = input;
  const _opts = opts;
  let script = EMPTY;
  let witness;
  if (inputType.txType === "taproot") {
    const SCHNORR_SIG_SIZE = inputType.sighash !== SignatureHash.DEFAULT ? 65 : 64;
    if (_input.tapInternalKey && !equalBytes2(_input.tapInternalKey, TAPROOT_UNSPENDABLE_KEY)) {
      witness = [new Uint8Array(SCHNORR_SIG_SIZE)];
    } else if (_input.tapLeafScript) {
      witness = iterLeafs(_input.tapLeafScript, SCHNORR_SIG_SIZE, _opts.customScripts);
    } else
      throw new Error("estimateInput/taproot: unknown input");
  } else {
    const empty = () => new Uint8Array(72);
    const emptyPub = () => new Uint8Array(33);
    let inputScript = EMPTY;
    let inputWitness = [];
    const ltype = inputType.last.type;
    if (ltype === "ms") {
      const m = inputType.last.m;
      const sig = [0];
      for (let i = 0; i < m; i++)
        sig.push(empty());
      inputScript = Script.encode(sig);
    } else if (ltype === "pk") {
      inputScript = Script.encode([empty()]);
    } else if (ltype === "pkh") {
      inputScript = Script.encode([empty(), emptyPub()]);
    } else if (ltype === "wpkh") {
      inputScript = EMPTY;
      inputWitness = [empty(), emptyPub()];
    } else if (ltype === "unknown" && !_opts.allowUnknownInputs)
      throw new Error("Unknown inputs are not allowed");
    if (inputType.type.includes("wsh-")) {
      if (inputScript.length && inputType.lastScript.length) {
        inputWitness = Script.decode(inputScript).map((i) => {
          if (i === 0)
            return EMPTY;
          if (isBytes4(i))
            return i;
          throw new Error(`Wrong witness op=${i}`);
        });
      }
      inputWitness = inputWitness.concat(inputType.lastScript);
    }
    if (inputType.txType === "segwit")
      witness = inputWitness;
    if (inputType.type.startsWith("sh-wsh-")) {
      script = Script.encode([Script.encode([0, new Uint8Array(sha2563.outputLen)])]);
    } else if (inputType.type.startsWith("sh-")) {
      script = Script.encode([...Script.decode(inputScript), inputType.lastScript]);
    } else if (inputType.type.startsWith("wsh-")) {
    } else if (inputType.txType !== "segwit")
      script = inputScript;
  }
  let weight = 160 + 4 * VarBytes.encode(script).length;
  let hasWitnesses = false;
  if (witness) {
    weight += RawWitness.encode(witness).length;
    hasWitnesses = true;
  }
  return { weight, hasWitnesses };
}
function getScript(o, opts = {}, network = NETWORK) {
  const _o = o;
  const _opts = opts;
  let script;
  if ("script" in _o && isBytes4(_o.script)) {
    script = _o.script;
  }
  if ("address" in _o) {
    if (typeof _o.address !== "string")
      throw new Error(`Estimator: wrong output address=${_o.address}`);
    script = OutScript.encode(Address(network).decode(_o.address));
  }
  if (!script)
    throw new Error("Estimator: wrong output script");
  if (typeof _o.amount !== "bigint")
    throw new Error(`Estimator: wrong output amount=${_o.amount}, should be of type bigint but got ${typeof _o.amount}.`);
  if (_o.amount < 0n)
    throw new Error(`Estimator: wrong output amount=${_o.amount}`);
  if (script && !_opts.allowUnknownOutputs && OutScript.decode(script).type === "unknown") {
    throw new Error("Estimator: unknown output script type, there is a chance that input is unspendable. Pass allowUnknownOutputs=true, if you sure");
  }
  if (!_opts.disableScriptCheck)
    checkScript(script);
  return script;
}
function selectUTXO(inputs, outputs, strategy, opts) {
  const _opts = { createTx: true, bip69: true, ...opts };
  const est = new _Estimator(inputs, outputs, _opts);
  return est.result(strategy);
}
var encodeTapBlock, _cmpBig, _Estimator;
var init_utxo = __esm({
  "node_modules/@scure/btc-signer/utxo.js"() {
    init_base2();
    init_micro_packed();
    init_payment();
    init_psbt();
    init_script();
    init_transaction();
    init_utils2();
    encodeTapBlock = (item) => TaprootControlBlock.encode(item);
    _cmpBig = (a, b) => {
      const n = a - b;
      if (n < 0n)
        return -1;
      else if (n > 0n)
        return 1;
      return 0;
    };
    _Estimator = class {
      baseWeight;
      changeWeight;
      amount;
      requiredIndices = [];
      normalizedInputs;
      // Dust used in accumExact + change address algo
      // - change address: can be smaller for segwit
      // - accumExact: ???
      dust;
      // total dust limit (3||opts.dustRelayFeeRate * 182||opts.dust). Default: 546
      outputs;
      opts;
      constructor(inputs, outputs, opts) {
        this.outputs = outputs;
        this.opts = opts;
        if (typeof opts.feePerByte !== "bigint")
          throw new Error(`Estimator: wrong feePerByte=${opts.feePerByte}, should be of type bigint but got ${typeof opts.feePerByte}.`);
        if (opts.feePerByte < 0n)
          throw new Error(`Estimator: feePerByte must be >= 0 satoshi per vbyte`);
        const inputsDust = 32 + 4 + 1 + 107 + 4;
        const outputDust = 34;
        const dustBytes = opts.dust === void 0 ? BigInt(inputsDust + outputDust) : opts.dust;
        if (typeof dustBytes !== "bigint") {
          throw new Error(`Estimator: wrong dust=${opts.dust}, should be of type bigint but got ${typeof opts.dust}.`);
        }
        const dustFee = opts.dustRelayFeeRate === void 0 ? 3n : opts.dustRelayFeeRate;
        if (typeof dustFee !== "bigint") {
          throw new Error(`Estimator: wrong dustRelayFeeRate=${opts.dustRelayFeeRate}, should be of type bigint but got ${typeof opts.dustRelayFeeRate}.`);
        }
        this.dust = dustBytes * dustFee;
        if (opts.requiredInputs !== void 0 && !Array.isArray(opts.requiredInputs))
          throw new Error(`Estimator: wrong required inputs=${opts.requiredInputs}`);
        const network = opts.network || NETWORK;
        let amount = 0n;
        let baseWeight = 32;
        for (const o of outputs) {
          const script = getScript(o, opts, opts.network);
          baseWeight += 32 + 4 * VarBytes.encode(script).length;
          amount += o.amount;
        }
        if (typeof opts.changeAddress !== "string")
          throw new Error(`Estimator: wrong change address=${opts.changeAddress}`);
        let changeWeight = baseWeight + 32 + // Same Address.decode() narrowing as above: the estimator only reaches this path for a
        // concrete change output address, not an unknown descriptor.
        4 * VarBytes.encode(OutScript.encode(Address(network).decode(opts.changeAddress))).length;
        baseWeight += 4 * CompactSizeLen.encode(outputs.length).length;
        changeWeight += 4 * CompactSizeLen.encode(outputs.length + 1).length;
        this.baseWeight = baseWeight;
        this.changeWeight = changeWeight;
        this.amount = amount;
        const allInputs = Array.from(inputs);
        if (opts.requiredInputs) {
          for (let i = 0; i < opts.requiredInputs.length; i++)
            this.requiredIndices.push(allInputs.push(opts.requiredInputs[i]) - 1);
        }
        const inputKeys = /* @__PURE__ */ new Set();
        this.normalizedInputs = allInputs.map((i) => {
          const normalized = normalizeInput(i, void 0, void 0, opts.disableScriptCheck, opts.allowUnknown);
          inputBeforeSign(normalized);
          const key = `${hex2.encode(normalized.txid)}:${normalized.index}`;
          if (!opts.allowSameUtxo && inputKeys.has(key))
            throw new Error(`Estimator: same input passed multiple times: ${key}`);
          inputKeys.add(key);
          const inputType = getInputType(normalized, opts.allowLegacyWitnessUtxo);
          const prev = getPrevOut(normalized);
          const estimate = estimateInput(inputType, normalized, this.opts);
          const value = prev.amount - opts.feePerByte * BigInt(toVsize(estimate.weight));
          return { inputType, normalized, amount: prev.amount, value, estimate };
        });
      }
      checkInputIdx(idx) {
        if (!Number.isSafeInteger(idx) || 0 > idx || idx >= this.normalizedInputs.length)
          throw new Error(`Wrong input index=${idx}`);
        return idx;
      }
      sortIndices(indices) {
        return indices.slice().sort((a, b) => {
          const ai = this.normalizedInputs[this.checkInputIdx(a)];
          const bi = this.normalizedInputs[this.checkInputIdx(b)];
          const out = compareBytes(ai.normalized.txid, bi.normalized.txid);
          if (out !== 0)
            return out;
          return ai.normalized.index - bi.normalized.index;
        });
      }
      sortOutputs(outputs) {
        const scripts = outputs.map((o) => getScript(o, this.opts, this.opts.network));
        const indices = outputs.map((_, j) => j);
        return indices.sort((a, b) => {
          const aa = outputs[a].amount;
          const ba = outputs[b].amount;
          const out = _cmpBig(aa, ba);
          if (out !== 0)
            return out;
          return compareBytes(scripts[a], scripts[b]);
        });
      }
      getSatoshi(weight) {
        return this.opts.feePerByte * BigInt(toVsize(weight));
      }
      // Sort by value instead of amount
      get biggest() {
        return this.normalizedInputs.map((_i, j) => j).sort((a, b) => _cmpBig(this.normalizedInputs[b].value, this.normalizedInputs[a].value));
      }
      get smallest() {
        return this.biggest.reverse();
      }
      // These assume that UTXO array has historical order.
      // Otherwise, we have no way to know which tx is oldest
      // Explorers usually give UTXO in this order.
      get oldest() {
        return this.normalizedInputs.map((_i, j) => j);
      }
      get newest() {
        return this.oldest.reverse();
      }
      // exact - like blackjack from coinselect.
      // exact(biggest) will select one big utxo which is closer to targetValue+dust, if possible.
      // If not, it will accumulate largest utxo until value is close to targetValue+dust.
      accumulate(indices, exact = false, skipNegative = true, all = false) {
        let weight = this.opts.alwaysChange ? this.changeWeight : this.baseWeight;
        let hasWitnesses = false;
        let num2 = 0;
        let inputsAmount = 0n;
        const targetAmount = this.amount;
        const res = /* @__PURE__ */ new Set();
        let fee;
        const getTotal = (newWeight, newNum) => {
          const totalWeight = newWeight + 4 * CompactSizeLen.encode(newNum).length;
          return { totalWeight, fee: this.getSatoshi(totalWeight) };
        };
        for (const idx of this.requiredIndices) {
          this.checkInputIdx(idx);
          if (res.has(idx))
            throw new Error("required input encountered multiple times");
          const { estimate, amount } = this.normalizedInputs[idx];
          let newWeight = weight + estimate.weight;
          if (!hasWitnesses && estimate.hasWitnesses)
            newWeight += 2;
          const newNum = num2 + 1;
          const total = getTotal(newWeight, newNum);
          fee = total.fee;
          weight = newWeight;
          if (estimate.hasWitnesses)
            hasWitnesses = true;
          num2 = newNum;
          inputsAmount += amount;
          res.add(idx);
          if (!all && targetAmount + fee <= inputsAmount && num2 >= this.requiredIndices.length)
            return { indices: Array.from(res), fee, weight: total.totalWeight, total: inputsAmount };
        }
        for (const idx of indices) {
          this.checkInputIdx(idx);
          if (res.has(idx))
            continue;
          const { estimate, amount, value } = this.normalizedInputs[idx];
          let newWeight = weight + estimate.weight;
          if (!hasWitnesses && estimate.hasWitnesses)
            newWeight += 2;
          const newNum = num2 + 1;
          const total = getTotal(newWeight, newNum);
          fee = total.fee;
          if (exact && amount + inputsAmount > targetAmount + fee + this.dust)
            continue;
          if (skipNegative && value <= 0n)
            continue;
          weight = newWeight;
          if (estimate.hasWitnesses)
            hasWitnesses = true;
          num2 = newNum;
          inputsAmount += amount;
          res.add(idx);
          if (!all && targetAmount + fee <= inputsAmount)
            return { indices: Array.from(res), fee, weight: total.totalWeight, total: inputsAmount };
        }
        if (all) {
          const total = getTotal(weight, num2);
          return {
            indices: Array.from(res),
            fee: total.fee,
            weight: total.totalWeight,
            total: inputsAmount
          };
        }
        return void 0;
      }
      // Works like coinselect default method
      default() {
        const { biggest } = this;
        const exact = this.accumulate(biggest, true, false);
        if (exact)
          return exact;
        return this.accumulate(biggest);
      }
      select(strategy) {
        if (strategy === "all") {
          return this.accumulate(this.normalizedInputs.map((_, j) => j), false, true, true);
        }
        if (strategy === "default")
          return this.default();
        const data = {
          Oldest: () => this.oldest,
          Newest: () => this.newest,
          Smallest: () => this.smallest,
          Biggest: () => this.biggest
        };
        if (strategy.startsWith("exact")) {
          const parts = strategy.split("/");
          if (parts.length !== 2)
            throw new Error(`Estimator.select: wrong strategy=${strategy}`);
          const [exactStrategy, left] = parts;
          const exactData = exactStrategy.slice(5);
          if (!data[exactData])
            throw new Error(`Estimator.select: wrong strategy=${strategy}`);
          if (!left.startsWith("accum"))
            throw new Error(`Estimator.select: wrong strategy=${strategy}`);
          strategy = left;
          const exact = this.accumulate(data[exactData](), true, true);
          if (exact)
            return exact;
        }
        if (strategy.startsWith("accum")) {
          const accumData = strategy.slice(5);
          if (!data[accumData])
            throw new Error(`Estimator.select: wrong strategy=${strategy}`);
          return this.accumulate(data[accumData]());
        }
        throw new Error(`Estimator.select: wrong strategy=${strategy}`);
      }
      result(strategy) {
        const s = this.select(strategy);
        if (!s)
          return;
        const { indices, weight, total } = s;
        let needChange = this.opts.alwaysChange;
        const changeWeight = this.opts.alwaysChange ? weight : weight + (this.changeWeight - this.baseWeight);
        const changeFee = this.getSatoshi(changeWeight);
        let fee = s.fee;
        const change = total - this.amount - changeFee;
        if (change > this.dust)
          needChange = true;
        else if (!needChange)
          fee = total - this.amount;
        let inputs = indices;
        let outputs = Array.from(this.outputs);
        if (needChange) {
          fee = changeFee;
          if (change < 0n)
            throw new Error(`Estimator.result: negative change=${change}`);
          outputs.push({ address: this.opts.changeAddress, amount: change });
        }
        if (this.opts.bip69) {
          inputs = this.sortIndices(inputs);
          outputs = this.sortOutputs(outputs).map((i) => outputs[i]);
        }
        const res = {
          inputs: inputs.map((i) => this.normalizedInputs[i].normalized),
          outputs,
          fee,
          weight: needChange ? changeWeight : s.weight,
          change: !!needChange
        };
        let tx;
        if (this.opts.createTx) {
          const { inputs: inputs2, outputs: outputs2 } = res;
          tx = new Transaction2(this.opts);
          for (const i of inputs2)
            tx.addInput(i);
          for (const o of outputs2)
            tx.addOutput({ ...o, script: getScript(o, this.opts, this.opts.network) });
        }
        return Object.assign(res, { tx });
      }
    };
  }
});

// node_modules/@scure/btc-signer/index.js
var btc_signer_exports = {};
__export(btc_signer_exports, {
  Address: () => Address,
  CompactSize: () => CompactSize,
  DEFAULT_SEQUENCE: () => DEFAULT_SEQUENCE,
  Decimal: () => Decimal,
  MAX_SCRIPT_BYTE_LENGTH: () => MAX_SCRIPT_BYTE_LENGTH,
  NETWORK: () => NETWORK,
  OP: () => OP,
  OutScript: () => OutScript,
  PSBTCombine: () => PSBTCombine,
  RawTx: () => RawTx,
  RawWitness: () => RawWitness,
  Script: () => Script,
  ScriptNum: () => ScriptNum,
  SigHash: () => SigHash,
  TAPROOT_UNSPENDABLE_KEY: () => TAPROOT_UNSPENDABLE_KEY,
  TEST_NETWORK: () => TEST_NETWORK,
  TaprootControlBlock: () => TaprootControlBlock,
  Transaction: () => Transaction2,
  WIF: () => WIF,
  _DebugPSBT: () => _DebugPSBT,
  _Estimator: () => _Estimator,
  _cmpBig: () => _cmpBig,
  _sortPubkeys: () => _sortPubkeys,
  bip32Path: () => bip32Path,
  combinations: () => combinations,
  getAddress: () => getAddress,
  getInputType: () => getInputType,
  multisig: () => multisig,
  p2ms: () => p2ms,
  p2pk: () => p2pk,
  p2pkh: () => p2pkh,
  p2sh: () => p2sh,
  p2tr: () => p2tr,
  p2tr_ms: () => p2tr_ms,
  p2tr_ns: () => p2tr_ns,
  p2tr_pk: () => p2tr_pk,
  p2wpkh: () => p2wpkh,
  p2wsh: () => p2wsh,
  selectUTXO: () => selectUTXO,
  sortedMultisig: () => sortedMultisig,
  taprootListToTree: () => taprootListToTree,
  utils: () => utils2
});
var utils2;
var init_btc_signer = __esm({
  "node_modules/@scure/btc-signer/index.js"() {
    init_utils2();
    init_payment();
    init_script();
    init_transaction();
    init_utils2();
    init_utxo();
    init_payment();
    init_psbt();
    init_transaction();
    init_utxo();
    utils2 = /* @__PURE__ */ (() => Object.freeze({
      isBytes: isBytes4,
      concatBytes: concatBytes3,
      compareBytes,
      pubSchnorr,
      randomPrivateKeyBytes,
      taprootTweakPubkey
    }))();
  }
});

// node_modules/@stacks/bitcoin-staking/node_modules/@stacks/common/dist/config.js
var require_config2 = __commonJS({
  "node_modules/@stacks/bitcoin-staking/node_modules/@stacks/common/dist/config.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.config = void 0;
    var config2 = {
      network: {
        layer1: "placeholder"
      },
      logLevel: "debug"
    };
    exports2.config = config2;
  }
});

// node_modules/@stacks/bitcoin-staking/node_modules/@stacks/common/dist/errors.js
var require_errors2 = __commonJS({
  "node_modules/@stacks/bitcoin-staking/node_modules/@stacks/common/dist/errors.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.PreconditionFailedError = exports2.PayloadTooLargeError = exports2.ValidationError = exports2.BadPathError = exports2.NotEnoughProofError = exports2.ConflictError = exports2.DoesNotExist = exports2.GaiaHubError = exports2.NoSessionDataError = exports2.InvalidStateError = exports2.FailedDecryptionError = exports2.SignatureVerificationError = exports2.LoginFailedError = exports2.InvalidAmountError = exports2.NotEnoughFundsError = exports2.InvalidDIDError = exports2.RemoteServiceError = exports2.MissingParameterError = exports2.InvalidParameterError = exports2.BlockstackError = exports2.ERROR_CODES = void 0;
    exports2.ERROR_CODES = {
      MISSING_PARAMETER: "missing_parameter",
      REMOTE_SERVICE_ERROR: "remote_service_error",
      INVALID_STATE: "invalid_state",
      NO_SESSION_DATA: "no_session_data",
      DOES_NOT_EXIST: "does_not_exist",
      FAILED_DECRYPTION_ERROR: "failed_decryption_error",
      INVALID_DID_ERROR: "invalid_did_error",
      NOT_ENOUGH_FUNDS_ERROR: "not_enough_error",
      INVALID_AMOUNT_ERROR: "invalid_amount_error",
      LOGIN_FAILED_ERROR: "login_failed",
      SIGNATURE_VERIFICATION_ERROR: "signature_verification_failure",
      CONFLICT_ERROR: "conflict_error",
      NOT_ENOUGH_PROOF_ERROR: "not_enough_proof_error",
      BAD_PATH_ERROR: "bad_path_error",
      VALIDATION_ERROR: "validation_error",
      PAYLOAD_TOO_LARGE_ERROR: "payload_too_large_error",
      PRECONDITION_FAILED_ERROR: "precondition_failed_error",
      UNKNOWN: "unknown"
    };
    Object.freeze(exports2.ERROR_CODES);
    var BlockstackError = class extends Error {
      constructor(error) {
        super();
        let message = error.message;
        let bugDetails = `Error Code: ${error.code}`;
        let stack = this.stack;
        if (!stack) {
          try {
            throw new Error();
          } catch (e) {
            stack = e.stack;
          }
        } else {
          bugDetails += `Stack Trace:
${stack}`;
        }
        message += `
If you believe this exception is caused by a bug in stacks.js,
      please file a bug report: https://github.com/blockstack/stacks.js/issues

${bugDetails}`;
        this.message = message;
        this.code = error.code;
        this.parameter = error.parameter ? error.parameter : void 0;
      }
      toString() {
        return `${super.toString()}
    code: ${this.code} param: ${this.parameter ? this.parameter : "n/a"}`;
      }
    };
    exports2.BlockstackError = BlockstackError;
    var InvalidParameterError = class extends BlockstackError {
      constructor(parameter, message = "") {
        super({ code: exports2.ERROR_CODES.MISSING_PARAMETER, message, parameter });
        this.name = "MissingParametersError";
      }
    };
    exports2.InvalidParameterError = InvalidParameterError;
    var MissingParameterError = class extends BlockstackError {
      constructor(parameter, message = "") {
        super({ code: exports2.ERROR_CODES.MISSING_PARAMETER, message, parameter });
        this.name = "MissingParametersError";
      }
    };
    exports2.MissingParameterError = MissingParameterError;
    var RemoteServiceError = class extends BlockstackError {
      constructor(response, message = "") {
        super({ code: exports2.ERROR_CODES.REMOTE_SERVICE_ERROR, message });
        this.response = response;
      }
    };
    exports2.RemoteServiceError = RemoteServiceError;
    var InvalidDIDError = class extends BlockstackError {
      constructor(message = "") {
        super({ code: exports2.ERROR_CODES.INVALID_DID_ERROR, message });
        this.name = "InvalidDIDError";
      }
    };
    exports2.InvalidDIDError = InvalidDIDError;
    var NotEnoughFundsError = class extends BlockstackError {
      constructor(leftToFund) {
        const message = `Not enough UTXOs to fund. Left to fund: ${leftToFund}`;
        super({ code: exports2.ERROR_CODES.NOT_ENOUGH_FUNDS_ERROR, message });
        this.leftToFund = leftToFund;
        this.name = "NotEnoughFundsError";
        this.message = message;
      }
    };
    exports2.NotEnoughFundsError = NotEnoughFundsError;
    var InvalidAmountError = class extends BlockstackError {
      constructor(fees, specifiedAmount) {
        const message = `Not enough coin to fund fees transaction fees. Fees would be ${fees}, specified spend is  ${specifiedAmount}`;
        super({ code: exports2.ERROR_CODES.INVALID_AMOUNT_ERROR, message });
        this.specifiedAmount = specifiedAmount;
        this.fees = fees;
        this.name = "InvalidAmountError";
        this.message = message;
      }
    };
    exports2.InvalidAmountError = InvalidAmountError;
    var LoginFailedError = class extends BlockstackError {
      constructor(reason) {
        const message = `Failed to login: ${reason}`;
        super({ code: exports2.ERROR_CODES.LOGIN_FAILED_ERROR, message });
        this.message = message;
        this.name = "LoginFailedError";
      }
    };
    exports2.LoginFailedError = LoginFailedError;
    var SignatureVerificationError = class extends BlockstackError {
      constructor(reason) {
        const message = `Failed to verify signature: ${reason}`;
        super({ code: exports2.ERROR_CODES.SIGNATURE_VERIFICATION_ERROR, message });
        this.message = message;
        this.name = "SignatureVerificationError";
      }
    };
    exports2.SignatureVerificationError = SignatureVerificationError;
    var FailedDecryptionError = class extends BlockstackError {
      constructor(message = "Unable to decrypt cipher object.") {
        super({ code: exports2.ERROR_CODES.FAILED_DECRYPTION_ERROR, message });
        this.message = message;
        this.name = "FailedDecryptionError";
      }
    };
    exports2.FailedDecryptionError = FailedDecryptionError;
    var InvalidStateError = class extends BlockstackError {
      constructor(message) {
        super({ code: exports2.ERROR_CODES.INVALID_STATE, message });
        this.message = message;
        this.name = "InvalidStateError";
      }
    };
    exports2.InvalidStateError = InvalidStateError;
    var NoSessionDataError = class extends BlockstackError {
      constructor(message) {
        super({ code: exports2.ERROR_CODES.INVALID_STATE, message });
        this.message = message;
        this.name = "NoSessionDataError";
      }
    };
    exports2.NoSessionDataError = NoSessionDataError;
    var GaiaHubError = class extends BlockstackError {
      constructor(error, response) {
        super(error);
        if (response) {
          this.hubError = {
            statusCode: response.status,
            statusText: response.statusText
          };
          if (typeof response.body === "string") {
            this.hubError.message = response.body;
          } else if (typeof response.body === "object") {
            Object.assign(this.hubError, response.body);
          }
        }
      }
    };
    exports2.GaiaHubError = GaiaHubError;
    var DoesNotExist = class extends GaiaHubError {
      constructor(message, response) {
        super({ message, code: exports2.ERROR_CODES.DOES_NOT_EXIST }, response);
        this.name = "DoesNotExist";
      }
    };
    exports2.DoesNotExist = DoesNotExist;
    var ConflictError = class extends GaiaHubError {
      constructor(message, response) {
        super({ message, code: exports2.ERROR_CODES.CONFLICT_ERROR }, response);
        this.name = "ConflictError";
      }
    };
    exports2.ConflictError = ConflictError;
    var NotEnoughProofError = class extends GaiaHubError {
      constructor(message, response) {
        super({ message, code: exports2.ERROR_CODES.NOT_ENOUGH_PROOF_ERROR }, response);
        this.name = "NotEnoughProofError";
      }
    };
    exports2.NotEnoughProofError = NotEnoughProofError;
    var BadPathError = class extends GaiaHubError {
      constructor(message, response) {
        super({ message, code: exports2.ERROR_CODES.BAD_PATH_ERROR }, response);
        this.name = "BadPathError";
      }
    };
    exports2.BadPathError = BadPathError;
    var ValidationError2 = class extends GaiaHubError {
      constructor(message, response) {
        super({ message, code: exports2.ERROR_CODES.VALIDATION_ERROR }, response);
        this.name = "ValidationError";
      }
    };
    exports2.ValidationError = ValidationError2;
    var PayloadTooLargeError = class extends GaiaHubError {
      constructor(message, response, maxUploadByteSize) {
        super({ message, code: exports2.ERROR_CODES.PAYLOAD_TOO_LARGE_ERROR }, response);
        this.name = "PayloadTooLargeError";
        this.maxUploadByteSize = maxUploadByteSize;
      }
    };
    exports2.PayloadTooLargeError = PayloadTooLargeError;
    var PreconditionFailedError = class extends GaiaHubError {
      constructor(message, response) {
        super({ message, code: exports2.ERROR_CODES.PRECONDITION_FAILED_ERROR }, response);
        this.name = "PreconditionFailedError";
      }
    };
    exports2.PreconditionFailedError = PreconditionFailedError;
  }
});

// node_modules/@stacks/bitcoin-staking/node_modules/@stacks/common/dist/logger.js
var require_logger2 = __commonJS({
  "node_modules/@stacks/bitcoin-staking/node_modules/@stacks/common/dist/logger.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Logger = void 0;
    var config_1 = require_config2();
    var levels = ["debug", "info", "warn", "error", "none"];
    var levelToInt = {};
    var intToLevel = {};
    for (let index = 0; index < levels.length; index++) {
      const level = levels[index];
      levelToInt[level] = index;
      intToLevel[index] = level;
    }
    var Logger = class {
      static error(message) {
        if (!this.shouldLog("error"))
          return;
        console.error(this.logMessage("error", message));
      }
      static warn(message) {
        if (!this.shouldLog("warn"))
          return;
        console.warn(this.logMessage("warn", message));
      }
      static info(message) {
        if (!this.shouldLog("info"))
          return;
        console.log(this.logMessage("info", message));
      }
      static debug(message) {
        if (!this.shouldLog("debug"))
          return;
        console.log(this.logMessage("debug", message));
      }
      static logMessage(level, message) {
        return `[${level.toUpperCase()}] ${message}`;
      }
      static shouldLog(level) {
        const currentLevel = levelToInt[config_1.config.logLevel];
        return currentLevel <= levelToInt[level];
      }
    };
    exports2.Logger = Logger;
  }
});

// node_modules/@stacks/bitcoin-staking/node_modules/@stacks/common/dist/utils.js
var require_utils2 = __commonJS({
  "node_modules/@stacks/bitcoin-staking/node_modules/@stacks/common/dist/utils.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.BLOCKSTACK_HANDLER = void 0;
    exports2.nextYear = nextYear;
    exports2.nextMonth = nextMonth;
    exports2.nextHour = nextHour;
    exports2.megabytesToBytes = megabytesToBytes;
    exports2.getAesCbcOutputLength = getAesCbcOutputLength;
    exports2.getBase64OutputLength = getBase64OutputLength;
    exports2.updateQueryStringParameter = updateQueryStringParameter;
    exports2.isLaterVersion = isLaterVersion;
    exports2.makeUUID4 = makeUUID4;
    exports2.isSameOriginAbsoluteUrl = isSameOriginAbsoluteUrl;
    exports2.getGlobalScope = getGlobalScope;
    exports2.getGlobalObject = getGlobalObject;
    exports2.getGlobalObjects = getGlobalObjects;
    exports2.intToBytes = intToBytes;
    exports2.intToBigInt = intToBigInt;
    exports2.with0x = with0x;
    exports2.without0x = without0x;
    exports2.hexToBigInt = hexToBigInt;
    exports2.intToHex = intToHex;
    exports2.hexToInt = hexToInt;
    exports2.bigIntToBytes = bigIntToBytes;
    exports2.toTwos = toTwos;
    exports2.bytesToTwosBigInt = bytesToTwosBigInt;
    exports2.fromTwos = fromTwos;
    exports2.bytesToHex = bytesToHex4;
    exports2.hexToBytes = hexToBytes4;
    exports2.utf8ToBytes = utf8ToBytes;
    exports2.bytesToUtf8 = bytesToUtf8;
    exports2.asciiToBytes = asciiToBytes2;
    exports2.bytesToAscii = bytesToAscii;
    exports2.octetsToBytes = octetsToBytes;
    exports2.concatBytes = concatBytes4;
    exports2.concatArray = concatArray;
    exports2.isInstance = isInstance;
    exports2.validateHash256 = validateHash256;
    var logger_1 = require_logger2();
    exports2.BLOCKSTACK_HANDLER = "blockstack";
    function nextYear() {
      return new Date((/* @__PURE__ */ new Date()).setFullYear((/* @__PURE__ */ new Date()).getFullYear() + 1));
    }
    function nextMonth() {
      return new Date((/* @__PURE__ */ new Date()).setMonth((/* @__PURE__ */ new Date()).getMonth() + 1));
    }
    function nextHour() {
      return new Date((/* @__PURE__ */ new Date()).setHours((/* @__PURE__ */ new Date()).getHours() + 1));
    }
    function megabytesToBytes(megabytes) {
      if (!Number.isFinite(megabytes)) {
        return 0;
      }
      return Math.floor(megabytes * 1024 * 1024);
    }
    function getAesCbcOutputLength(inputByteLength) {
      const cipherTextLength = (Math.floor(inputByteLength / 16) + 1) * 16;
      return cipherTextLength;
    }
    function getBase64OutputLength(inputByteLength) {
      const encodedLength = Math.ceil(inputByteLength / 3) * 4;
      return encodedLength;
    }
    function updateQueryStringParameter(uri, key, value) {
      const re = new RegExp(`([?&])${key}=.*?(&|$)`, "i");
      const separator = uri.indexOf("?") !== -1 ? "&" : "?";
      if (uri.match(re)) {
        return uri.replace(re, `$1${key}=${value}$2`);
      } else {
        return `${uri}${separator}${key}=${value}`;
      }
    }
    function isLaterVersion(v1, v2) {
      if (v1 === void 0 || v1 === "") {
        v1 = "0.0.0";
      }
      if (v2 === void 0 || v1 === "") {
        v2 = "0.0.0";
      }
      const v1tuple = v1.split(".").map((x) => parseInt(x, 10));
      const v2tuple = v2.split(".").map((x) => parseInt(x, 10));
      for (let index = 0; index < v2.length; index++) {
        if (index >= v1.length) {
          v2tuple.push(0);
        }
        if (v1tuple[index] < v2tuple[index]) {
          return false;
        }
      }
      return true;
    }
    function makeUUID4() {
      let d = (/* @__PURE__ */ new Date()).getTime();
      if (typeof performance !== "undefined" && typeof performance.now === "function") {
        d += performance.now();
      }
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === "x" ? r : r & 3 | 8).toString(16);
      });
    }
    function isSameOriginAbsoluteUrl(uri1, uri2) {
      try {
        const parsedUri1 = new URL(uri1);
        const parsedUri2 = new URL(uri2);
        const port1 = parseInt(parsedUri1.port || "0", 10) | 0 || (parsedUri1.protocol === "https:" ? 443 : 80);
        const port2 = parseInt(parsedUri2.port || "0", 10) | 0 || (parsedUri2.protocol === "https:" ? 443 : 80);
        const match2 = {
          scheme: parsedUri1.protocol === parsedUri2.protocol,
          hostname: parsedUri1.hostname === parsedUri2.hostname,
          port: port1 === port2,
          absolute: (uri1.includes("http://") || uri1.includes("https://")) && (uri2.includes("http://") || uri2.includes("https://"))
        };
        return match2.scheme && match2.hostname && match2.port && match2.absolute;
      } catch (error) {
        console.log(error);
        console.log("Parsing error in same URL origin check");
        return false;
      }
    }
    function getGlobalScope() {
      if (typeof self !== "undefined") {
        return self;
      }
      if (typeof window !== "undefined") {
        return window;
      }
      if (typeof global !== "undefined") {
        return global;
      }
      throw new Error("Unexpected runtime environment - no supported global scope (`window`, `self`, `global`) available");
    }
    function getAPIUsageErrorMessage(scopeObject, apiName, usageDesc) {
      if (usageDesc) {
        return `Use of '${usageDesc}' requires \`${apiName}\` which is unavailable on the '${scopeObject}' object within the currently executing environment.`;
      } else {
        return `\`${apiName}\` is unavailable on the '${scopeObject}' object within the currently executing environment.`;
      }
    }
    function getGlobalObject(name, { throwIfUnavailable, usageDesc, returnEmptyObject } = {}) {
      let globalScope = void 0;
      try {
        globalScope = getGlobalScope();
        if (globalScope) {
          const obj = globalScope[name];
          if (obj) {
            return obj;
          }
        }
      } catch (error) {
        logger_1.Logger.error(`Error getting object '${name}' from global scope '${globalScope}': ${error}`);
      }
      if (throwIfUnavailable) {
        const errMsg = getAPIUsageErrorMessage(globalScope, name.toString(), usageDesc);
        logger_1.Logger.error(errMsg);
        throw new Error(errMsg);
      }
      if (returnEmptyObject) {
        return {};
      }
      return void 0;
    }
    function getGlobalObjects(names, { throwIfUnavailable, usageDesc, returnEmptyObject } = {}) {
      let globalScope;
      try {
        globalScope = getGlobalScope();
      } catch (error) {
        logger_1.Logger.error(`Error getting global scope: ${error}`);
        if (throwIfUnavailable) {
          const errMsg = getAPIUsageErrorMessage(globalScope, names[0].toString(), usageDesc);
          logger_1.Logger.error(errMsg);
          throw errMsg;
        } else if (returnEmptyObject) {
          globalScope = {};
        }
      }
      const result = {};
      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        try {
          if (globalScope) {
            const obj = globalScope[name];
            if (obj) {
              result[name] = obj;
            } else if (throwIfUnavailable) {
              const errMsg = getAPIUsageErrorMessage(globalScope, name.toString(), usageDesc);
              logger_1.Logger.error(errMsg);
              throw new Error(errMsg);
            } else if (returnEmptyObject) {
              result[name] = {};
            }
          }
        } catch (error) {
          if (throwIfUnavailable) {
            const errMsg = getAPIUsageErrorMessage(globalScope, name.toString(), usageDesc);
            logger_1.Logger.error(errMsg);
            throw new Error(errMsg);
          }
        }
      }
      return result;
    }
    function intToBytes(value, byteLength) {
      return bigIntToBytes(intToBigInt(value), byteLength);
    }
    function intToBigInt(value) {
      if (typeof value === "bigint")
        return value;
      if (typeof value === "string")
        return BigInt(value);
      if (typeof value === "number") {
        if (!Number.isInteger(value)) {
          throw new RangeError(`Invalid value. Values of type 'number' must be an integer.`);
        }
        if (value > Number.MAX_SAFE_INTEGER) {
          throw new RangeError(`Invalid value. Values of type 'number' must be less than or equal to ${Number.MAX_SAFE_INTEGER}. For larger values, try using a BigInt instead.`);
        }
        return BigInt(value);
      }
      if (isInstance(value, Uint8Array))
        return BigInt(`0x${bytesToHex4(value)}`);
      throw new TypeError(`intToBigInt: Invalid value type. Must be a number, bigint, BigInt-compatible string, or Uint8Array.`);
    }
    function with0x(value) {
      return /^0x/i.test(value) ? value : `0x${value}`;
    }
    function without0x(value) {
      return /^0x/i.test(value) ? value.slice(2) : value;
    }
    function hexToBigInt(hex4) {
      if (typeof hex4 !== "string")
        throw new TypeError(`hexToBigInt: expected string, got ${typeof hex4}`);
      return BigInt(with0x(hex4));
    }
    function intToHex(integer, byteLength = 8) {
      const value = typeof integer === "bigint" ? integer : intToBigInt(integer);
      return value.toString(16).padStart(byteLength * 2, "0");
    }
    function hexToInt(hex4) {
      return parseInt(hex4, 16);
    }
    function bigIntToBytes(value, length = 16) {
      const hex4 = intToHex(value, length);
      return hexToBytes4(hex4);
    }
    function toTwos(value, width) {
      if (value < -(BigInt(1) << width - BigInt(1)) || (BigInt(1) << width - BigInt(1)) - BigInt(1) < value) {
        throw `Unable to represent integer in width: ${width}`;
      }
      if (value >= BigInt(0)) {
        return BigInt(value);
      }
      return value + (BigInt(1) << width);
    }
    function nthBit(value, n) {
      return value & BigInt(1) << n;
    }
    function bytesToTwosBigInt(bytes2) {
      return fromTwos(BigInt(`0x${bytesToHex4(bytes2)}`), BigInt(bytes2.byteLength * 8));
    }
    function fromTwos(value, width) {
      if (nthBit(value, width - BigInt(1))) {
        return value - (BigInt(1) << width);
      }
      return value;
    }
    var hexes = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
    function bytesToHex4(uint8a) {
      if (!(uint8a instanceof Uint8Array))
        throw new Error("Uint8Array expected");
      let hex4 = "";
      for (const u of uint8a) {
        hex4 += hexes[u];
      }
      return hex4;
    }
    function hexToBytes4(hex4) {
      if (typeof hex4 !== "string") {
        throw new TypeError(`hexToBytes: expected string, got ${typeof hex4}`);
      }
      hex4 = without0x(hex4);
      hex4 = hex4.length % 2 ? `0${hex4}` : hex4;
      const array2 = new Uint8Array(hex4.length / 2);
      for (let i = 0; i < array2.length; i++) {
        const j = i * 2;
        const hexByte = hex4.slice(j, j + 2);
        const byte = Number.parseInt(hexByte, 16);
        if (Number.isNaN(byte) || byte < 0)
          throw new Error("Invalid byte sequence");
        array2[i] = byte;
      }
      return array2;
    }
    function utf8ToBytes(str2) {
      return new TextEncoder().encode(str2);
    }
    function bytesToUtf8(arr) {
      return new TextDecoder().decode(arr);
    }
    function asciiToBytes2(str2) {
      const byteArray = [];
      for (let i = 0; i < str2.length; i++) {
        byteArray.push(str2.charCodeAt(i) & 255);
      }
      return new Uint8Array(byteArray);
    }
    function bytesToAscii(arr) {
      return String.fromCharCode.apply(null, arr);
    }
    function isNotOctet(octet) {
      return !Number.isInteger(octet) || octet < 0 || octet > 255;
    }
    function octetsToBytes(numbers) {
      if (numbers.some(isNotOctet))
        throw new Error("Some values are invalid bytes.");
      return new Uint8Array(numbers);
    }
    function concatBytes4(...arrays) {
      if (!arrays.every((a) => a instanceof Uint8Array))
        throw new Error("Uint8Array list expected");
      if (arrays.length === 1)
        return arrays[0];
      const length = arrays.reduce((a, arr) => a + arr.length, 0);
      const result = new Uint8Array(length);
      for (let i = 0, pad = 0; i < arrays.length; i++) {
        const arr = arrays[i];
        result.set(arr, pad);
        pad += arr.length;
      }
      return result;
    }
    function concatArray(elements) {
      return concatBytes4(...elements.map((e) => {
        if (typeof e === "number")
          return octetsToBytes([e]);
        if (e instanceof Array)
          return octetsToBytes(e);
        return e;
      }));
    }
    function isInstance(object, clazz) {
      return object instanceof clazz || object?.constructor?.name?.toLowerCase() === clazz.name;
    }
    function validateHash256(hex4) {
      hex4 = without0x(hex4);
      if (hex4.length !== 64)
        return false;
      return /^[0-9a-fA-F]+$/.test(hex4);
    }
  }
});

// node_modules/@stacks/bitcoin-staking/node_modules/@stacks/common/dist/constants.js
var require_constants3 = __commonJS({
  "node_modules/@stacks/bitcoin-staking/node_modules/@stacks/common/dist/constants.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.PRIVATE_KEY_BYTES_UNCOMPRESSED = exports2.PRIVATE_KEY_BYTES_COMPRESSED = exports2.GAIA_URL = exports2.DEVNET_URL = exports2.HIRO_TESTNET_URL = exports2.HIRO_MAINNET_URL = void 0;
    exports2.HIRO_MAINNET_URL = "https://api.mainnet.hiro.so";
    exports2.HIRO_TESTNET_URL = "https://api.testnet.hiro.so";
    exports2.DEVNET_URL = "http://localhost:3999";
    exports2.GAIA_URL = "https://hub.blockstack.org";
    exports2.PRIVATE_KEY_BYTES_COMPRESSED = 33;
    exports2.PRIVATE_KEY_BYTES_UNCOMPRESSED = 32;
  }
});

// node_modules/@stacks/bitcoin-staking/node_modules/@stacks/common/dist/signatures.js
var require_signatures2 = __commonJS({
  "node_modules/@stacks/bitcoin-staking/node_modules/@stacks/common/dist/signatures.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.parseRecoverableSignatureVrs = parseRecoverableSignatureVrs;
    exports2.signatureVrsToRsv = signatureVrsToRsv2;
    exports2.signatureRsvToVrs = signatureRsvToVrs;
    var utils_1 = require_utils2();
    var COORDINATE_BYTES = 32;
    function parseRecoverableSignatureVrs(signature) {
      if (signature.length < COORDINATE_BYTES * 2 * 2 + 1) {
        throw new Error("Invalid signature");
      }
      const recoveryIdHex = signature.slice(0, 2);
      const r = signature.slice(2, 2 + COORDINATE_BYTES * 2);
      const s = signature.slice(2 + COORDINATE_BYTES * 2);
      return {
        recoveryId: (0, utils_1.hexToInt)(recoveryIdHex),
        r,
        s
      };
    }
    function signatureVrsToRsv2(signature) {
      return signature.slice(2) + signature.slice(0, 2);
    }
    function signatureRsvToVrs(signature) {
      return signature.slice(-2) + signature.slice(0, -2);
    }
  }
});

// node_modules/@stacks/bitcoin-staking/node_modules/@stacks/common/dist/keys.js
var require_keys2 = __commonJS({
  "node_modules/@stacks/bitcoin-staking/node_modules/@stacks/common/dist/keys.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.privateKeyToBytes = privateKeyToBytes;
    var utils_1 = require_utils2();
    function privateKeyToBytes(privateKey) {
      const privateKeyBuffer = typeof privateKey === "string" ? (0, utils_1.hexToBytes)(privateKey) : privateKey;
      if (privateKeyBuffer.length != 32 && privateKeyBuffer.length != 33) {
        throw new Error(`Improperly formatted private-key. Private-key byte length should be 32 or 33. Length provided: ${privateKeyBuffer.length}`);
      }
      if (privateKeyBuffer.length == 33 && privateKeyBuffer[32] !== 1) {
        throw new Error("Improperly formatted private-key. 33 bytes indicate compressed key, but the last byte must be == 01");
      }
      return privateKeyBuffer;
    }
  }
});

// node_modules/@stacks/bitcoin-staking/node_modules/@stacks/common/dist/buffer.js
var require_buffer2 = __commonJS({
  "node_modules/@stacks/bitcoin-staking/node_modules/@stacks/common/dist/buffer.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.equals = equals;
    exports2.alloc = alloc;
    exports2.readUInt16BE = readUInt16BE;
    exports2.writeUInt16BE = writeUInt16BE;
    exports2.readUInt8 = readUInt8;
    exports2.writeUInt8 = writeUInt8;
    exports2.readUInt16LE = readUInt16LE;
    exports2.writeUInt16LE = writeUInt16LE;
    exports2.readUInt32BE = readUInt32BE;
    exports2.writeUInt32BE = writeUInt32BE;
    exports2.readUInt32LE = readUInt32LE;
    exports2.writeUInt32LE = writeUInt32LE;
    function equals(a, b) {
      if (a.byteLength !== b.byteLength)
        return false;
      for (let i = 0; i < a.byteLength; i++) {
        if (a[i] !== b[i])
          return false;
      }
      return true;
    }
    function alloc(length, value) {
      const a = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        a[i] = value;
      }
      return a;
    }
    function readUInt16BE(source, offset) {
      return (source[offset + 0] << 8 | source[offset + 1]) >>> 0;
    }
    function writeUInt16BE(destination, value, offset = 0) {
      destination[offset + 0] = value >>> 8;
      destination[offset + 1] = value >>> 0;
      return destination;
    }
    function readUInt8(source, offset) {
      return source[offset];
    }
    function writeUInt8(destination, value, offset = 0) {
      destination[offset] = value;
      return destination;
    }
    function readUInt16LE(source, offset) {
      return source[offset + 0] << 0 >>> 0 | source[offset + 1] << 8 >>> 0;
    }
    function writeUInt16LE(destination, value, offset = 0) {
      destination[offset + 0] = value & 255;
      value >>>= 8;
      destination[offset + 1] = value & 255;
      return destination;
    }
    function readUInt32BE(source, offset) {
      return source[offset] * 2 ** 24 + source[offset + 1] * 2 ** 16 + source[offset + 2] * 2 ** 8 + source[offset + 3];
    }
    function writeUInt32BE(destination, value, offset = 0) {
      destination[offset + 3] = value;
      value >>>= 8;
      destination[offset + 2] = value;
      value >>>= 8;
      destination[offset + 1] = value;
      value >>>= 8;
      destination[offset] = value;
      return destination;
    }
    function readUInt32LE(source, offset) {
      return source[offset + 0] << 0 >>> 0 | source[offset + 1] << 8 >>> 0 | source[offset + 2] << 16 >>> 0 | source[offset + 3] << 24 >>> 0;
    }
    function writeUInt32LE(destination, value, offset = 0) {
      destination[offset + 0] = value & 255;
      value >>>= 8;
      destination[offset + 1] = value & 255;
      value >>>= 8;
      destination[offset + 2] = value & 255;
      value >>>= 8;
      destination[offset + 3] = value & 255;
      return destination;
    }
  }
});

// node_modules/@stacks/bitcoin-staking/node_modules/@stacks/common/dist/types.js
var require_types3 = __commonJS({
  "node_modules/@stacks/bitcoin-staking/node_modules/@stacks/common/dist/types.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@stacks/bitcoin-staking/node_modules/@stacks/common/dist/fetch.js
var require_fetch2 = __commonJS({
  "node_modules/@stacks/bitcoin-staking/node_modules/@stacks/common/dist/fetch.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.setFetchOptions = exports2.getFetchOptions = void 0;
    exports2.fetchWrapper = fetchWrapper;
    exports2.hostMatches = hostMatches;
    exports2.createApiKeyMiddleware = createApiKeyMiddleware;
    exports2.createFetchFn = createFetchFn;
    var defaultFetchOpts = {
      referrerPolicy: "origin",
      headers: {
        "x-hiro-product": "stacksjs"
      }
    };
    var getFetchOptions = () => {
      return defaultFetchOpts;
    };
    exports2.getFetchOptions = getFetchOptions;
    var setFetchOptions = (ops) => {
      return Object.assign(defaultFetchOpts, ops);
    };
    exports2.setFetchOptions = setFetchOptions;
    async function fetchWrapper(input, init) {
      const fetchOpts = {};
      Object.assign(fetchOpts, defaultFetchOpts, init);
      const fetchResult = await fetch(input, fetchOpts);
      return fetchResult;
    }
    function hostMatches(host, pattern) {
      if (typeof pattern === "string")
        return pattern === host;
      return pattern.exec(host);
    }
    function createApiKeyMiddleware({ apiKey, host = /(.*)api(.*)(\.stacks\.co|\.hiro\.so)$/i, httpHeader = "x-api-key" }) {
      return {
        pre: (context) => {
          const reqUrl = new URL(context.url);
          if (!hostMatches(reqUrl.host, host))
            return;
          const headers = context.init.headers instanceof Headers ? context.init.headers : context.init.headers = new Headers(context.init.headers);
          headers.set(httpHeader, apiKey);
        }
      };
    }
    function argsForCreateFetchFn(args) {
      let fetchLib = fetchWrapper;
      let middlewares = [];
      if (args.length > 0 && typeof args[0] === "function") {
        fetchLib = args.shift();
      }
      if (args.length > 0) {
        middlewares = args;
      }
      return { fetchLib, middlewares };
    }
    function createFetchFn(...args) {
      const { fetchLib, middlewares } = argsForCreateFetchFn(args);
      const fetchFn = async (url, init) => {
        let fetchParams = { url, init: init ?? {} };
        for (const middleware of middlewares) {
          if (typeof middleware.pre === "function") {
            const result = await Promise.resolve(middleware.pre({
              fetch: fetchLib,
              ...fetchParams
            }));
            fetchParams = result ?? fetchParams;
          }
        }
        let response = await fetchLib(fetchParams.url, fetchParams.init);
        for (const middleware of middlewares) {
          if (typeof middleware.post === "function") {
            const result = await Promise.resolve(middleware.post({
              fetch: fetchLib,
              url: fetchParams.url,
              init: fetchParams.init,
              response: response?.clone() ?? response
            }));
            response = result ?? response;
          }
        }
        return response;
      };
      return fetchFn;
    }
  }
});

// node_modules/@stacks/bitcoin-staking/node_modules/@stacks/common/dist/index.js
var require_dist2 = __commonJS({
  "node_modules/@stacks/bitcoin-staking/node_modules/@stacks/common/dist/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_config2(), exports2);
    __exportStar(require_errors2(), exports2);
    __exportStar(require_logger2(), exports2);
    __exportStar(require_utils2(), exports2);
    __exportStar(require_constants3(), exports2);
    __exportStar(require_signatures2(), exports2);
    __exportStar(require_keys2(), exports2);
    __exportStar(require_buffer2(), exports2);
    __exportStar(require_types3(), exports2);
    __exportStar(require_fetch2(), exports2);
  }
});

// node_modules/@stacks/bitcoin-staking/dist/cycles.js
var require_cycles = __commonJS({
  "node_modules/@stacks/bitcoin-staking/dist/cycles.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.BOND_END_OFFSET_PERIODS = void 0;
    exports2.firstPox5RewardCycle = firstPox5RewardCycle2;
    exports2.bondPeriodToRewardCycle = bondPeriodToRewardCycle2;
    exports2.bondPeriodToBurnHeight = bondPeriodToBurnHeight;
    exports2.burnHeightToRewardCycle = burnHeightToRewardCycle2;
    exports2.rewardCycleToBurnHeight = rewardCycleToBurnHeight;
    exports2.burnHeightToDistributionIndex = burnHeightToDistributionIndex;
    exports2.currentDistributionCycle = currentDistributionCycle2;
    exports2.distributionCycleToBurnHeight = distributionCycleToBurnHeight2;
    exports2.isInPreparePhase = isInPreparePhase2;
    exports2.minUstxForSatsAmount = minUstxForSatsAmount2;
    exports2.isBondActiveAtHeight = isBondActiveAtHeight2;
    exports2.bondPhaseRanges = bondPhaseRanges2;
    exports2.bondStatus = bondStatus;
    var constants_1 = require_constants2();
    function firstPox5RewardCycle2(poxInfo2) {
      const entry = poxInfo2.contractVersions.find((v) => v.contractId.endsWith(`.${constants_1.POX5_CONTRACT_NAME}`));
      return entry?.firstRewardCycleId;
    }
    exports2.BOND_END_OFFSET_PERIODS = constants_1.BOND_LENGTH_CYCLES / constants_1.BOND_GAP_CYCLES;
    function requireFirstBondPeriodCycle(poxInfo2) {
      const cycle = firstPox5RewardCycle2(poxInfo2);
      if (cycle === void 0) {
        throw new Error("pox-5 not activated yet \u2014 no firstBondPeriodCycle available in poxInfo.contractVersions[]");
      }
      return cycle;
    }
    function bondPeriodToRewardCycle2(opts) {
      return requireFirstBondPeriodCycle(opts.poxInfo) + opts.bondIndex * constants_1.BOND_GAP_CYCLES;
    }
    function bondPeriodToBurnHeight(opts) {
      return rewardCycleToBurnHeight({
        cycle: bondPeriodToRewardCycle2(opts),
        poxInfo: opts.poxInfo
      });
    }
    function burnHeightToRewardCycle2(opts) {
      if (opts.burnHeight < opts.poxInfo.firstBurnchainBlockHeight) {
        throw new Error("burnHeight is before first-burnchain-block-height");
      }
      return Math.floor((opts.burnHeight - opts.poxInfo.firstBurnchainBlockHeight) / opts.poxInfo.rewardCycleLength);
    }
    function rewardCycleToBurnHeight(opts) {
      return opts.poxInfo.firstBurnchainBlockHeight + opts.cycle * opts.poxInfo.rewardCycleLength;
    }
    function burnHeightToDistributionIndex(opts) {
      const distCycleLength = Math.floor(opts.poxInfo.rewardCycleLength / 2);
      return Math.floor((opts.burnHeight - opts.poxInfo.firstBurnchainBlockHeight) / distCycleLength);
    }
    function currentDistributionCycle2(poxInfo2) {
      return burnHeightToDistributionIndex({
        burnHeight: poxInfo2.currentBurnchainBlockHeight,
        poxInfo: poxInfo2
      });
    }
    function distributionCycleToBurnHeight2(opts) {
      const distCycleLength = Math.floor(opts.poxInfo.rewardCycleLength / 2);
      return opts.poxInfo.firstBurnchainBlockHeight + opts.distributionCycle * distCycleLength;
    }
    function isInPreparePhase2(opts) {
      if (opts.burnHeight < opts.poxInfo.firstBurnchainBlockHeight)
        return false;
      const cycle = burnHeightToRewardCycle2(opts);
      const nextCycleBurnHeight = rewardCycleToBurnHeight({
        cycle: cycle + 1,
        poxInfo: opts.poxInfo
      });
      return opts.burnHeight >= nextCycleBurnHeight - opts.poxInfo.prepareCycleLength;
    }
    function minUstxForSatsAmount2(opts) {
      const ratio = BigInt(opts.minUstxRatioBps);
      return opts.stxValueRatio * opts.sats / 100n * ratio / 10000n;
    }
    function isBondActiveAtHeight2(opts) {
      const bondStart = bondPeriodToBurnHeight(opts);
      const bondEnd = bondPeriodToBurnHeight({
        bondIndex: opts.bondIndex + exports2.BOND_END_OFFSET_PERIODS,
        poxInfo: opts.poxInfo
      });
      return opts.burnHeight > bondStart && opts.burnHeight <= bondEnd;
    }
    function bondPhaseRanges2(opts) {
      const { rewardCycleLength } = opts.poxInfo;
      const openBurnHeight = bondPeriodToBurnHeight(opts);
      const closeBurnHeight = openBurnHeight + constants_1.BOND_LENGTH_CYCLES * rewardCycleLength;
      const unlockedBlocks = Math.floor(rewardCycleLength / 2);
      const unlockedStart = closeBurnHeight - unlockedBlocks;
      const openStart = openBurnHeight - constants_1.BOND_GAP_CYCLES * rewardCycleLength;
      const closedEnd = closeBurnHeight + constants_1.BOND_LENGTH_CYCLES * rewardCycleLength;
      const range = (name, start, end) => ({
        name,
        startBurnHeight: start,
        length: end - start,
        endBurnHeight: end
      });
      return [
        range("open", openStart, openBurnHeight),
        range("locked", openBurnHeight, unlockedStart),
        range("unlocked", unlockedStart, closeBurnHeight),
        range("closed", closeBurnHeight, closedEnd)
      ];
    }
    function bondStatus(opts) {
      const { currentBurnchainBlockHeight: burnHeight, rewardCycleLength } = opts.poxInfo;
      const startBurnHeight = bondPeriodToBurnHeight(opts);
      const closeBurnHeight = startBurnHeight + constants_1.BOND_LENGTH_CYCLES * rewardCycleLength;
      const unlockedStart = closeBurnHeight - Math.floor(rewardCycleLength / 2);
      const setupStart = startBurnHeight - constants_1.BOND_GAP_CYCLES * rewardCycleLength;
      if (!opts.isBondSetup) {
        if (burnHeight < setupStart)
          return "too-early";
        if (burnHeight < startBurnHeight)
          return "eligible";
        return "missing";
      }
      if (burnHeight < startBurnHeight)
        return "open";
      if (burnHeight < unlockedStart)
        return "locked";
      if (burnHeight < closeBurnHeight)
        return "unlocked";
      return "closed";
    }
  }
});

// node_modules/@stacks/bitcoin-staking/dist/script.js
var require_script = __commonJS({
  "node_modules/@stacks/bitcoin-staking/dist/script.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod2) {
        if (mod2 && mod2.__esModule) return mod2;
        var result = {};
        if (mod2 != null) {
          for (var k = ownKeys(mod2), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod2, k[i]);
        }
        __setModuleDefault(result, mod2);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.buildUnlockScript = buildUnlockScript2;
    exports2.parseUnlockScript = parseUnlockScript;
    exports2.pushScriptBytes = pushScriptBytes;
    exports2.serializeCScriptNum = serializeCScriptNum;
    exports2.pushCScriptNum = pushCScriptNum;
    exports2.toConsensusBuffStandardPrincipal = toConsensusBuffStandardPrincipal;
    exports2.computeRegisterPreimage = computeRegisterPreimage2;
    exports2.buildLockScript = buildLockScript2;
    exports2.computeP2wshOutputScript = computeP2wshOutputScript;
    exports2.buildLockOutputScript = buildLockOutputScript;
    exports2.buildLockAddress = buildLockAddress2;
    exports2.lockScriptToAddress = lockScriptToAddress;
    exports2.computeUnlockHeight = computeUnlockHeight;
    exports2.computeBondUnlockHeight = computeBondUnlockHeight3;
    exports2.buildRegisterMetadata = buildRegisterMetadata2;
    var btc = __importStar((init_btc_signer(), __toCommonJS(btc_signer_exports)));
    var sha2_js_1 = require("@noble/hashes/sha2.js");
    var common_1 = require_dist2();
    var transactions_1 = require("@stacks/transactions");
    var cycles_1 = require_cycles();
    var network_1 = require_network();
    var REGTEST_NETWORK = { ...btc.TEST_NETWORK, bech32: "bcrt" };
    var BTC_NETWORKS = {
      mainnet: btc.NETWORK,
      testnet: btc.TEST_NETWORK,
      devnet: REGTEST_NETWORK,
      mocknet: REGTEST_NETWORK
    };
    function buildUnlockScript2(publicKey) {
      const pubBytes = typeof publicKey === "string" ? (0, common_1.hexToBytes)(publicKey) : publicKey;
      if (pubBytes.length !== 33) {
        throw new Error("Expected a 33-byte compressed public key");
      }
      return btc.Script.encode([pubBytes, "CHECKSIG"]);
    }
    function parseUnlockScript(unlockBytes) {
      const bytes2 = typeof unlockBytes === "string" ? (0, common_1.hexToBytes)(unlockBytes) : unlockBytes;
      try {
        const decoded = btc.Script.decode(bytes2);
        if (decoded.length === 2 && decoded[0] instanceof Uint8Array && decoded[0].length === 33 && decoded[1] === "CHECKSIG") {
          return decoded[0];
        }
      } catch {
      }
      return void 0;
    }
    var { OP: OP2 } = btc;
    var STAKER_COMMITMENT_PREFIX = (0, common_1.hexToBytes)("82012088a820");
    function pushScriptBytes(bytes2) {
      const len = bytes2.length;
      if (len === 0)
        return new Uint8Array([OP2.OP_0]);
      if (len <= 75) {
        const out = new Uint8Array(1 + len);
        out[0] = len;
        out.set(bytes2, 1);
        return out;
      }
      if (len <= 255) {
        const out = new Uint8Array(2 + len);
        out[0] = OP2.PUSHDATA1;
        out[1] = len;
        out.set(bytes2, 2);
        return out;
      }
      if (len <= 65535) {
        const out = new Uint8Array(3 + len);
        out[0] = OP2.PUSHDATA2;
        out[1] = len & 255;
        out[2] = len >> 8 & 255;
        out.set(bytes2, 3);
        return out;
      }
      throw new Error(`pushScriptBytes: payload too large (${len} bytes; max 65535)`);
    }
    function serializeCScriptNum(n) {
      const big = typeof n === "bigint" ? n : BigInt(n);
      if (big < 0n)
        throw new Error("serializeCScriptNum: negative values not supported");
      if (big === 0n)
        return new Uint8Array(0);
      const bytes2 = [];
      let v = big;
      while (v > 0n) {
        bytes2.push(Number(v & 0xffn));
        v >>= 8n;
      }
      if ((bytes2[bytes2.length - 1] & 128) !== 0)
        bytes2.push(0);
      if (bytes2.length > 5) {
        throw new Error(`serializeCScriptNum: encoding exceeds 5-byte ScriptNum cap (got ${bytes2.length})`);
      }
      return Uint8Array.from(bytes2);
    }
    function pushCScriptNum(n) {
      const big = typeof n === "bigint" ? n : BigInt(n);
      if (big === 0n)
        return new Uint8Array([OP2.OP_0]);
      if (big <= 16n)
        return new Uint8Array([80 + Number(big)]);
      return pushScriptBytes(serializeCScriptNum(big));
    }
    function toConsensusBuffStandardPrincipal(addr) {
      const parsed = transactions_1.Address.parse(addr);
      if (parsed.contractName) {
        throw new Error(`toConsensusBuffStandardPrincipal: expected a standard principal, got contract principal "${addr}"`);
      }
      const out = new Uint8Array(22);
      out[0] = 5;
      out[1] = parsed.version;
      out.set((0, common_1.hexToBytes)(parsed.hash160), 2);
      return out;
    }
    function computeRegisterPreimage2(stxAddress) {
      return (0, sha2_js_1.sha256)(toConsensusBuffStandardPrincipal(stxAddress));
    }
    function buildLockScript2(opts) {
      const unlockBytes = typeof opts.unlockBytes === "string" ? (0, common_1.hexToBytes)(opts.unlockBytes) : opts.unlockBytes;
      const earlyUnlockBytes = typeof opts.earlyUnlockBytes === "string" ? (0, common_1.hexToBytes)(opts.earlyUnlockBytes) : opts.earlyUnlockBytes;
      const heightPush = pushCScriptNum(opts.unlockHeight);
      const stakerHash = (0, sha2_js_1.sha256)(computeRegisterPreimage2(opts.stxAddress));
      return (0, common_1.concatBytes)(Uint8Array.of(OP2.IF), heightPush, Uint8Array.of(OP2.CHECKLOCKTIMEVERIFY, OP2.ELSE), STAKER_COMMITMENT_PREFIX, stakerHash, Uint8Array.of(OP2.EQUALVERIFY), earlyUnlockBytes, Uint8Array.of(OP2.ENDIF, OP2.VERIFY), unlockBytes);
    }
    function computeP2wshOutputScript(script) {
      const hash = (0, sha2_js_1.sha256)(script);
      const out = new Uint8Array(34);
      out[0] = 0;
      out[1] = 32;
      out.set(hash, 2);
      return out;
    }
    function buildLockOutputScript(opts) {
      return computeP2wshOutputScript(buildLockScript2(opts));
    }
    function buildLockAddress2(opts) {
      const unlockBytes = opts.unlockBytes ?? (opts.publicKey ? buildUnlockScript2(opts.publicKey) : void 0);
      if (!unlockBytes) {
        throw new Error("buildLockAddress: provide either `unlockBytes` or `publicKey`");
      }
      const script = buildLockScript2({
        stxAddress: opts.stxAddress,
        unlockHeight: opts.unlockHeight,
        unlockBytes,
        earlyUnlockBytes: opts.earlyUnlockBytes
      });
      return lockScriptToAddress(script, (0, network_1.networkNameFrom)(opts.network));
    }
    function lockScriptToAddress(script, network) {
      const btcNetwork = BTC_NETWORKS[(0, network_1.networkNameFrom)(network)];
      const result = btc.p2wsh({ type: "wsh", script }, btcNetwork);
      if (!result.address)
        throw new Error("Failed to derive P2WSH address");
      return result.address;
    }
    function computeUnlockHeight(opts) {
      return (0, cycles_1.rewardCycleToBurnHeight)({
        cycle: opts.firstRewardCycle + opts.numCycles - 1,
        poxInfo: opts.poxInfo
      });
    }
    function computeBondUnlockHeight3(opts) {
      const endCycle = (0, cycles_1.bondPeriodToRewardCycle)({
        bondIndex: opts.bondIndex + cycles_1.BOND_END_OFFSET_PERIODS,
        poxInfo: opts.poxInfo
      });
      const endBurnHeight = (0, cycles_1.rewardCycleToBurnHeight)({
        cycle: endCycle,
        poxInfo: opts.poxInfo
      });
      return endBurnHeight - Math.floor(opts.poxInfo.rewardCycleLength / 2);
    }
    function buildRegisterMetadata2(opts) {
      const unlockHeight = computeBondUnlockHeight3({
        bondIndex: opts.bondIndex,
        poxInfo: opts.poxInfo
      });
      const unlockBytes = buildUnlockScript2(opts.bitcoinPublicKey);
      const lockScript = buildLockScript2({
        stxAddress: opts.stxAddress,
        unlockHeight,
        unlockBytes,
        earlyUnlockBytes: opts.earlyUnlockBytes
      });
      return {
        lockAddress: lockScriptToAddress(lockScript, (0, network_1.networkNameFrom)(opts.network)),
        lockScript,
        outputScript: computeP2wshOutputScript(lockScript),
        unlockBytes,
        unlockHeight
      };
    }
  }
});

// node_modules/@stacks/bitcoin-staking/dist/proof.js
var require_proof = __commonJS({
  "node_modules/@stacks/bitcoin-staking/dist/proof.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod2) {
        if (mod2 && mod2.__esModule) return mod2;
        var result = {};
        if (mod2 != null) {
          for (var k = ownKeys(mod2), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod2, k[i]);
        }
        __setModuleDefault(result, mod2);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.serializeBitcoinTx = serializeBitcoinTx;
    exports2.serializeBitcoinHeader = serializeBitcoinHeader;
    exports2.computeBitcoinTxid = computeBitcoinTxid;
    exports2.buildLockProof = buildLockProof2;
    exports2.computeMerkleBranch = computeMerkleBranch;
    exports2.buildLockProofFromBlock = buildLockProofFromBlock;
    var btc = __importStar((init_btc_signer(), __toCommonJS(btc_signer_exports)));
    var sha2_js_1 = require("@noble/hashes/sha2.js");
    var common_1 = require_dist2();
    var script_1 = require_script();
    var MAX_TX_BYTES = 1e5;
    function serializeBitcoinTx(tx) {
      const bytes2 = typeof tx === "string" ? (0, common_1.hexToBytes)(tx) : tx;
      if (bytes2.length > MAX_TX_BYTES) {
        throw new Error(`serializeBitcoinTx: tx is ${bytes2.length} bytes; exceeds the ${MAX_TX_BYTES}-byte contract cap`);
      }
      return bytes2;
    }
    function serializeBitcoinHeader(header) {
      const bytes2 = typeof header === "string" ? (0, common_1.hexToBytes)(header) : header;
      if (bytes2.length !== 80) {
        throw new Error(`serializeBitcoinHeader: expected 80 bytes, got ${bytes2.length}`);
      }
      return bytes2;
    }
    function computeBitcoinTxid(rawTx) {
      return reverse32((0, sha2_js_1.sha256)((0, sha2_js_1.sha256)(rawTx)));
    }
    function reverse32(bytes2) {
      const out = new Uint8Array(bytes2.length);
      for (let i = 0; i < bytes2.length; i++)
        out[i] = bytes2[bytes2.length - 1 - i];
      return out;
    }
    function range(n) {
      return Array.from({ length: n }, (_, i) => i);
    }
    function resolveExpectedScript(input) {
      if (input.expectedScript !== void 0) {
        return typeof input.expectedScript === "string" ? (0, common_1.hexToBytes)(input.expectedScript) : input.expectedScript;
      }
      if (input.lockScript !== void 0) {
        const script = typeof input.lockScript === "string" ? (0, common_1.hexToBytes)(input.lockScript) : input.lockScript;
        return (0, script_1.computeP2wshOutputScript)(script);
      }
      throw new Error("buildLockProof: provide either `expectedScript` (P2WSH scriptPubKey) or `lockScript` (witness script)");
    }
    function buildLockProof2(input) {
      const tx = btc.Transaction.fromRaw((0, common_1.hexToBytes)(input.txHex), {
        allowUnknownOutputs: true,
        disableScriptCheck: true
      });
      const legacy = tx.toBytes(true, false);
      const expectedScript = resolveExpectedScript(input);
      const outputIndex = range(tx.outputsLength).findIndex((i) => {
        const out = tx.getOutput(i);
        return out.script && (0, common_1.equals)(out.script, expectedScript);
      });
      if (outputIndex === -1) {
        throw new Error("buildLockProof: no output matches the expected lockup script");
      }
      return {
        height: input.merkleProof.block_height,
        tx: serializeBitcoinTx(legacy),
        outputIndex,
        header: serializeBitcoinHeader(input.header),
        leafHashes: input.merkleProof.merkle.map((h) => reverse32((0, common_1.hexToBytes)(h))),
        txCount: input.txCount,
        txIndex: input.merkleProof.pos,
        amount: tx.getOutput(outputIndex).amount ?? 0n
      };
    }
    function computeMerkleBranch(txids, pos) {
      if (pos < 0 || pos >= txids.length) {
        throw new Error(`computeMerkleBranch: pos ${pos} out of range (0..${txids.length - 1})`);
      }
      let level = txids.map((id) => reverse32((0, common_1.hexToBytes)(id)));
      let index = pos;
      const siblings = [];
      while (level.length > 1) {
        if (level.length % 2 === 1)
          level.push(level[level.length - 1]);
        siblings.push(level[index ^ 1]);
        const next = [];
        for (let i = 0; i < level.length; i += 2) {
          next.push((0, sha2_js_1.sha256)((0, sha2_js_1.sha256)((0, common_1.concatBytes)(level[i], level[i + 1]))));
        }
        level = next;
        index = Math.floor(index / 2);
      }
      return siblings.map((s) => (0, common_1.bytesToHex)(reverse32(s)));
    }
    function buildLockProofFromBlock(input) {
      const tx = btc.Transaction.fromRaw((0, common_1.hexToBytes)(input.txHex), {
        allowUnknownOutputs: true,
        disableScriptCheck: true
      });
      const txid = (0, common_1.bytesToHex)(computeBitcoinTxid(tx.toBytes(true, false)));
      const pos = input.txids.indexOf(txid);
      if (pos === -1) {
        throw new Error(`buildLockProofFromBlock: txid ${txid} not found in the block's txids`);
      }
      return buildLockProof2({
        txHex: input.txHex,
        header: input.header,
        txCount: input.txids.length,
        expectedScript: resolveExpectedScript(input),
        merkleProof: {
          block_height: input.blockHeight,
          merkle: computeMerkleBranch(input.txids, pos),
          pos
        }
      });
    }
  }
});

// node_modules/@stacks/bitcoin-staking/dist/build.js
var require_build = __commonJS({
  "node_modules/@stacks/bitcoin-staking/dist/build.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.buildSetBondAdmin = buildSetBondAdmin;
    exports2.buildSetupBond = buildSetupBond;
    exports2.buildRegisterForBond = buildRegisterForBond;
    exports2.buildUpdateBondRegistration = buildUpdateBondRegistration;
    exports2.buildAnnounceL1EarlyExit = buildAnnounceL1EarlyExit;
    exports2.buildUnstakeSbtc = buildUnstakeSbtc;
    exports2.buildStake = buildStake;
    exports2.buildStakeUpdate = buildStakeUpdate;
    exports2.buildUnstake = buildUnstake;
    exports2.buildCalculateRewards = buildCalculateRewards2;
    exports2.buildClaimRewards = buildClaimRewards;
    exports2.buildClaimStakerRewardsForSigner = buildClaimStakerRewardsForSigner;
    exports2.buildGrantSignerKey = buildGrantSignerKey;
    exports2.buildRevokeSignerGrant = buildRevokeSignerGrant;
    var transactions_1 = require("@stacks/transactions");
    var constants_1 = require_constants2();
    var network_1 = require("@stacks/network");
    function clBufferFrom(value) {
      return typeof value === "string" ? transactions_1.Cl.bufferFromHex(value) : transactions_1.Cl.buffer(value);
    }
    function clOptionalBufferFrom(value) {
      if (value === void 0)
        return transactions_1.Cl.none();
      return transactions_1.Cl.some(clBufferFrom(value));
    }
    async function callPox5(functionName, functionArgs, tx) {
      const network = (0, network_1.networkFrom)(tx.network);
      const base = {
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName,
        functionArgs,
        fee: tx.fee,
        nonce: tx.nonce,
        network: tx.network,
        ...tx.postConditions ? { postConditions: tx.postConditions } : {},
        ...tx.postConditionMode ? { postConditionMode: tx.postConditionMode } : {}
      };
      return (0, transactions_1.makeUnsignedContractCall)("publicKey" in tx ? { ...base, publicKey: tx.publicKey } : {
        ...base,
        publicKeys: tx.publicKeys,
        numSignatures: tx.numSignatures,
        useNonSequentialMultiSig: tx.useNonSequentialMultiSig ?? true,
        ...tx.address ? { address: tx.address } : {}
      });
    }
    async function buildSetBondAdmin(args) {
      return callPox5("set-bond-admin", [transactions_1.Cl.address(args.newAdmin)], args);
    }
    async function buildSetupBond(args) {
      const allowlistCV = transactions_1.Cl.list(args.allowlist.map((entry) => transactions_1.Cl.tuple({
        staker: transactions_1.Cl.address(entry.staker),
        "max-sats": transactions_1.Cl.uint(entry.maxSats)
      })));
      return callPox5("setup-bond", [
        transactions_1.Cl.uint(args.bondIndex),
        transactions_1.Cl.uint(args.targetRateBps),
        transactions_1.Cl.uint(args.stxValueRatio),
        transactions_1.Cl.uint(args.minUstxRatioBps),
        clBufferFrom(args.earlyUnlockBytes),
        allowlistCV
      ], args);
    }
    function buildRegisterForBond(args) {
      return callPox5("register-for-bond", [
        transactions_1.Cl.uint(args.bondIndex),
        transactions_1.Cl.address(args.signerManager),
        transactions_1.Cl.uint(args.amountUstx),
        lockupToCV(args.lockup),
        clOptionalBufferFrom(args.signerCalldata)
      ], args);
    }
    function lockupToCV(lockup) {
      if (lockup.kind === "sbtc")
        return transactions_1.Cl.error(transactions_1.Cl.uint(lockup.sbtcSats));
      return transactions_1.Cl.ok(transactions_1.Cl.tuple({
        outputs: transactions_1.Cl.list(lockup.outputs.map((o) => transactions_1.Cl.tuple({
          height: transactions_1.Cl.uint(o.height),
          tx: clBufferFrom(o.tx),
          "output-index": transactions_1.Cl.uint(o.outputIndex),
          header: clBufferFrom(o.header),
          "leaf-hashes": transactions_1.Cl.list(o.leafHashes.map((h) => clBufferFrom(h))),
          "tx-count": transactions_1.Cl.uint(o.txCount),
          "tx-index": transactions_1.Cl.uint(o.txIndex),
          amount: transactions_1.Cl.uint(o.amount)
        }))),
        "staker-unlock-bytes": clBufferFrom(lockup.unlockBytes)
      }));
    }
    async function buildUpdateBondRegistration(args) {
      return callPox5("update-bond-registration", [
        transactions_1.Cl.address(args.signerManager),
        transactions_1.Cl.address(args.oldSignerManager),
        clOptionalBufferFrom(args.signerCalldata)
      ], args);
    }
    async function buildAnnounceL1EarlyExit(args) {
      return callPox5("announce-l1-early-exit", [transactions_1.Cl.address(args.staker), transactions_1.Cl.address(args.oldSignerManager)], args);
    }
    async function buildUnstakeSbtc(args) {
      return callPox5("unstake-sbtc", [transactions_1.Cl.address(args.signerManager), transactions_1.Cl.uint(args.amountToWithdrawSats)], args);
    }
    async function buildStake(args) {
      return callPox5("stake", [
        transactions_1.Cl.address(args.signerManager),
        transactions_1.Cl.uint(args.amountUstx),
        transactions_1.Cl.uint(args.numCycles),
        transactions_1.Cl.uint(args.startBurnHt),
        clOptionalBufferFrom(args.signerCalldata)
      ], args);
    }
    async function buildStakeUpdate(args) {
      return callPox5("stake-update", [
        transactions_1.Cl.address(args.signerManager),
        transactions_1.Cl.address(args.oldSignerManager),
        transactions_1.Cl.uint(args.cyclesToExtend ?? 0),
        transactions_1.Cl.uint(args.amountIncrease ?? 0n),
        clOptionalBufferFrom(args.signerCalldata)
      ], args);
    }
    async function buildUnstake(args) {
      return callPox5("unstake", [transactions_1.Cl.address(args.oldSignerManager)], args);
    }
    async function buildCalculateRewards2(args) {
      return callPox5("calculate-rewards", [transactions_1.Cl.list(args.bondIndices.map((i) => transactions_1.Cl.uint(i)))], args);
    }
    async function buildClaimRewards(args) {
      return callPox5("claim-rewards", [transactions_1.Cl.list(args.bondIndices.map((i) => transactions_1.Cl.uint(i))), transactions_1.Cl.uint(args.rewardCycle)], args);
    }
    async function buildClaimStakerRewardsForSigner(args) {
      return callPox5("claim-staker-rewards-for-signer", [
        transactions_1.Cl.address(args.staker),
        transactions_1.Cl.uint(args.rewardCycle),
        args.bondIndex === void 0 ? transactions_1.Cl.none() : transactions_1.Cl.some(transactions_1.Cl.uint(args.bondIndex))
      ], args);
    }
    async function buildGrantSignerKey(args) {
      return callPox5("grant-signer-key", [
        clBufferFrom(args.signerKey),
        transactions_1.Cl.address(args.signerManager),
        transactions_1.Cl.uint(args.authId),
        clBufferFrom(args.signerSignature)
      ], args);
    }
    async function buildRevokeSignerGrant(args) {
      return callPox5("revoke-signer-grant", [transactions_1.Cl.address(args.signerManager), clBufferFrom(args.signerKey)], args);
    }
  }
});

// node_modules/@stacks/bitcoin-staking/dist/fetch.js
var require_fetch3 = __commonJS({
  "node_modules/@stacks/bitcoin-staking/dist/fetch.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.fetchPoxInfo = fetchPoxInfo;
    exports2.fetchStakerInfo = fetchStakerInfo2;
    exports2.fetchAccountStatus = fetchAccountStatus2;
    exports2.fetchBondMembership = fetchBondMembership2;
    exports2.fetchProtocolBondMemberships = fetchProtocolBondMemberships;
    exports2.fetchStakerSharesStakedForCycle = fetchStakerSharesStakedForCycle2;
    exports2.fetchBond = fetchBond2;
    exports2.fetchProtocolBond = fetchProtocolBond;
    exports2.fetchBondAdmin = fetchBondAdmin;
    exports2.fetchBondStatus = fetchBondStatus2;
    exports2.fetchTotalSbtcStakedForBond = fetchTotalSbtcStakedForBond;
    exports2.fetchTotalSharesStakedForCycle = fetchTotalSharesStakedForCycle;
    exports2.fetchTotalSbtcStaked = fetchTotalSbtcStaked;
    exports2.fetchBondL1UnlockHeight = fetchBondL1UnlockHeight2;
    exports2.fetchConstructLockupScript = fetchConstructLockupScript;
    exports2.fetchConstructLockupOutputScript = fetchConstructLockupOutputScript2;
    exports2.fetchPushScriptBytes = fetchPushScriptBytes;
    exports2.fetchSerializeCScriptNum = fetchSerializeCScriptNum;
    exports2.fetchPushCScriptNum = fetchPushCScriptNum;
    exports2.fetchUintToBuffLe = fetchUintToBuffLe;
    exports2.fetchReverseBuff32 = fetchReverseBuff32;
    exports2.fetchReversedTxid = fetchReversedTxid;
    exports2.fetchParseBlockHeader = fetchParseBlockHeader;
    exports2.fetchVerifyBlockHeader = fetchVerifyBlockHeader;
    exports2.fetchBurnBlockHeaderHash = fetchBurnBlockHeaderHash;
    exports2.fetchTotalUstxStacked = fetchTotalUstxStacked;
    exports2.fetchBondAllowance = fetchBondAllowance2;
    exports2.fetchSignerSharesStakedForCycle = fetchSignerSharesStakedForCycle;
    exports2.fetchEarned = fetchEarned2;
    exports2.fetchSignerUnclaimedRewards = fetchSignerUnclaimedRewards;
    exports2.fetchSignerRewardsPerTokenSettled = fetchSignerRewardsPerTokenSettled;
    exports2.fetchSignerRewardsPerTokenForCycle = fetchSignerRewardsPerTokenForCycle;
    exports2.fetchEarnedStakerRewards = fetchEarnedStakerRewards2;
    exports2.fetchStakerRewardsPerTokenSettled = fetchStakerRewardsPerTokenSettled;
    exports2.fetchStakerUnclaimedRewards = fetchStakerUnclaimedRewards;
    exports2.fetchLastRewardComputeHeight = fetchLastRewardComputeHeight2;
    exports2.fetchRewards = fetchRewards;
    exports2.fetchNewRewards = fetchNewRewards;
    exports2.fetchReserveBalance = fetchReserveBalance;
    exports2.fetchLastAccountedRewards = fetchLastAccountedRewards;
    exports2.fetchRewardsPerTokenForCycle = fetchRewardsPerTokenForCycle;
    exports2.fetchSignerPendingStakedUstx = fetchSignerPendingStakedUstx;
    exports2.fetchAmountDelegatedForSigner = fetchAmountDelegatedForSigner;
    exports2.fetchUstxDelegatedForCycle = fetchUstxDelegatedForCycle;
    exports2.fetchSignerCycleMembership = fetchSignerCycleMembership2;
    exports2.fetchSignerSetContainsForCycle = fetchSignerSetContainsForCycle;
    exports2.fetchSignerSetFirstItem = fetchSignerSetFirstItem;
    exports2.fetchSignerSetLastItem = fetchSignerSetLastItem;
    exports2.fetchSignerSetNextItem = fetchSignerSetNextItem;
    exports2.fetchSignerSetPrevItem = fetchSignerSetPrevItem;
    exports2.fetchSignerSetItem = fetchSignerSetItem;
    exports2.fetchStakerCustodiedSbtc = fetchStakerCustodiedSbtc2;
    exports2.fetchBondOverlapsNewPosition = fetchBondOverlapsNewPosition;
    exports2.fetchHasAnnouncedL1EarlyExit = fetchHasAnnouncedL1EarlyExit2;
    exports2.fetchSignerInfo = fetchSignerInfo2;
    exports2.fetchVerifySignerKeyGrant = fetchVerifySignerKeyGrant2;
    exports2.fetchSignerKeyGrantUsed = fetchSignerKeyGrantUsed;
    exports2.fetchSignerGrantMessageHash = fetchSignerGrantMessageHash2;
    var common_1 = require_dist2();
    var network_1 = require("@stacks/network");
    var transactions_1 = require("@stacks/transactions");
    var constants_1 = require_constants2();
    var cycles_1 = require_cycles();
    function bondIndexCV(bondIndex) {
      return bondIndex === void 0 ? transactions_1.Cl.none() : transactions_1.Cl.some(transactions_1.Cl.uint(bondIndex));
    }
    async function fetchPoxInfo(opts = {}) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const client = Object.assign({}, (0, network_1.clientFromNetwork)(network), opts.client);
      const url = `${client.baseUrl}/v2/pox`;
      const response = await client.fetch(url);
      const data = await response.json();
      return {
        contractId: data.contract_id,
        currentBurnchainBlockHeight: data.current_burnchain_block_height,
        firstBurnchainBlockHeight: data.first_burnchain_block_height,
        rewardCycleId: data.reward_cycle_id,
        rewardCycleLength: data.reward_cycle_length,
        prepareCycleLength: data.prepare_cycle_length,
        rewardSlots: data.reward_slots,
        currentCycle: {
          id: data.current_cycle.id,
          stakedUstx: BigInt(data.current_cycle.stacked_ustx),
          isPoxActive: data.current_cycle.is_pox_active
        },
        nextCycle: {
          id: data.next_cycle.id,
          stakedUstx: BigInt(data.next_cycle.stacked_ustx),
          isPoxActive: data.next_cycle.is_pox_active
        },
        contractVersions: (data.contract_versions ?? []).map((v) => ({
          contractId: v.contract_id,
          activationBurnchainBlockHeight: v.activation_burnchain_block_height,
          firstRewardCycleId: v.first_reward_cycle_id
        }))
      };
    }
    async function fetchStakerInfo2(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-staker-info",
        functionArgs: [transactions_1.Cl.address(opts.address)],
        senderAddress: opts.address,
        network: opts.network,
        client: opts.client
      });
      const optional = result;
      if (optional.type === transactions_1.ClarityType.OptionalNone)
        return { staked: false };
      const tuple2 = optional.value;
      return {
        staked: true,
        details: {
          amountUstx: BigInt(tuple2.value["amount-ustx"].value),
          firstRewardCycle: Number(tuple2.value["first-reward-cycle"].value),
          numCycles: Number(tuple2.value["num-cycles"].value),
          signer: (0, transactions_1.cvToValue)(tuple2.value["signer"])
        }
      };
    }
    async function fetchAccountStatus2(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const client = Object.assign({}, (0, network_1.clientFromNetwork)(network), opts.client);
      const url = `${client.baseUrl}/v2/accounts/${opts.address}?proof=0`;
      const response = await client.fetch(url);
      const data = await response.json();
      return {
        balance: (0, common_1.hexToBigInt)(data.balance),
        locked: (0, common_1.hexToBigInt)(data.locked),
        nonce: BigInt(data.nonce ?? 0),
        unlockHeight: Number(data.unlock_height ?? 0)
      };
    }
    function decodeBondMembership(tuple2) {
      return {
        bondIndex: Number(tuple2.value["bond-index"].value),
        amountUstx: BigInt(tuple2.value["amount-ustx"].value),
        signer: (0, transactions_1.cvToValue)(tuple2.value["signer"]),
        isL1Lock: tuple2.value["is-l1-lock"].type === transactions_1.ClarityType.BoolTrue,
        amountSats: BigInt(tuple2.value["amount-sats"].value)
      };
    }
    async function fetchBondMembership2(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-bond-membership",
        functionArgs: [transactions_1.Cl.address(opts.address)],
        senderAddress: opts.address,
        network: opts.network,
        client: opts.client
      });
      const optional = result;
      if (optional.type === transactions_1.ClarityType.OptionalNone)
        return void 0;
      return decodeBondMembership(optional.value);
    }
    async function fetchProtocolBondMemberships(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const entry = await (0, transactions_1.fetchContractMapEntry)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        mapName: "protocol-bond-memberships",
        mapKey: transactions_1.Cl.address(opts.address),
        network: opts.network,
        client: opts.client
      });
      const optional = entry;
      if (optional.type === transactions_1.ClarityType.OptionalNone)
        return void 0;
      return decodeBondMembership(optional.value);
    }
    async function fetchStakerSharesStakedForCycle2(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-staker-shares-staked-for-cycle",
        functionArgs: [
          transactions_1.Cl.address(opts.staker),
          transactions_1.Cl.uint(opts.rewardCycle),
          bondIndexCV(opts.bondIndex),
          transactions_1.Cl.address(opts.signer)
        ],
        senderAddress: opts.staker,
        network: opts.network,
        client: opts.client
      });
      return BigInt(result.value);
    }
    async function fetchBond2(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const bondEntry = await (0, transactions_1.fetchContractMapEntry)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        mapName: "protocol-bonds",
        mapKey: transactions_1.Cl.uint(opts.bondIndex),
        network: opts.network,
        client: opts.client
      });
      const optional = bondEntry;
      if (optional.type === transactions_1.ClarityType.OptionalNone)
        return void 0;
      return decodeBondTuple(opts.bondIndex, optional.value);
    }
    async function fetchProtocolBond(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-protocol-bond",
        functionArgs: [transactions_1.Cl.uint(opts.bondIndex)],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      const optional = result;
      if (optional.type === transactions_1.ClarityType.OptionalNone)
        return void 0;
      return decodeBondTuple(opts.bondIndex, optional.value);
    }
    async function fetchBondAdmin(opts = {}) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const client = Object.assign({}, (0, network_1.clientFromNetwork)(network), opts.client);
      const url = `${client.baseUrl}/v2/data_var/${network.bootAddress}/${constants_1.POX5_CONTRACT_NAME}/bond-admin?proof=0`;
      const response = await client.fetch(url);
      const { data } = await response.json();
      return (0, transactions_1.cvToValue)(transactions_1.Cl.deserialize(data));
    }
    async function fetchBondStatus2(opts) {
      const [poxInfo2, isBondSetup] = await Promise.all([
        opts.poxInfo ?? fetchPoxInfo({ network: opts.network, client: opts.client }),
        opts.isBondSetup ?? fetchProtocolBond({
          bondIndex: opts.bondIndex,
          network: opts.network,
          client: opts.client
        }).then((bond) => bond !== void 0)
      ]);
      return (0, cycles_1.bondStatus)({ bondIndex: opts.bondIndex, poxInfo: poxInfo2, isBondSetup });
    }
    function decodeBondTuple(bondIndex, tuple2) {
      const targetRate = tuple2.value["target-rate"].value;
      const stxValueRatio = tuple2.value["stx-value-ratio"].value;
      const minUstxRatio = tuple2.value["min-ustx-ratio"].value;
      const earlyUnlockBytes = tuple2.value["early-unlock-bytes"].value;
      return {
        bondIndex,
        targetRateBps: Number(targetRate),
        stxValueRatio: BigInt(stxValueRatio),
        minUstxRatioBps: Number(minUstxRatio),
        earlyUnlockBytes
      };
    }
    async function fetchTotalSbtcStakedForBond(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-total-sbtc-staked-for-bond",
        functionArgs: [transactions_1.Cl.uint(opts.bondIndex)],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return BigInt(result.value);
    }
    async function fetchTotalSharesStakedForCycle(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-total-shares-staked-for-cycle",
        functionArgs: [transactions_1.Cl.uint(opts.rewardCycle), bondIndexCV(opts.bondIndex)],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return BigInt(result.value);
    }
    async function fetchTotalSbtcStaked(opts = {}) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-total-sbtc-staked",
        functionArgs: [],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return BigInt(result.value);
    }
    async function fetchBondL1UnlockHeight2(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-bond-l1-unlock-height",
        functionArgs: [transactions_1.Cl.uint(opts.bondIndex)],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return BigInt(result.value);
    }
    async function fetchConstructLockupRead(functionName, opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const buf = (v) => typeof v === "string" ? transactions_1.Cl.bufferFromHex(v) : transactions_1.Cl.buffer(v);
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName,
        functionArgs: [
          transactions_1.Cl.address(opts.stxAddress),
          transactions_1.Cl.uint(opts.unlockHeight),
          buf(opts.unlockBytes),
          buf(opts.earlyUnlockBytes)
        ],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return (0, common_1.hexToBytes)(result.value);
    }
    async function fetchConstructLockupScript(opts) {
      return fetchConstructLockupRead("construct-lockup-script", opts);
    }
    async function fetchConstructLockupOutputScript2(opts) {
      return fetchConstructLockupRead("construct-lockup-output-script", opts);
    }
    function bufferArg(v) {
      return typeof v === "string" ? transactions_1.Cl.bufferFromHex(v) : transactions_1.Cl.buffer(v);
    }
    async function fetchBufferRead(functionName, functionArgs, opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName,
        functionArgs,
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return (0, common_1.hexToBytes)(result.value);
    }
    async function fetchPushScriptBytes(opts) {
      return fetchBufferRead("push-script-bytes", [bufferArg(opts.bytes)], opts);
    }
    async function fetchSerializeCScriptNum(opts) {
      return fetchBufferRead("serialize-c-script-num", [transactions_1.Cl.uint(opts.n)], opts);
    }
    async function fetchPushCScriptNum(opts) {
      return fetchBufferRead("push-c-script-num", [transactions_1.Cl.uint(opts.n)], opts);
    }
    async function fetchUintToBuffLe(opts) {
      return fetchBufferRead("uint-to-buff-le", [transactions_1.Cl.uint(opts.n)], opts);
    }
    async function fetchReverseBuff32(opts) {
      return fetchBufferRead("reverse-buff32", [bufferArg(opts.input)], opts);
    }
    async function fetchReversedTxid(opts) {
      return fetchBufferRead("get-reversed-txid", [bufferArg(opts.tx)], opts);
    }
    async function fetchParseBlockHeader(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "parse-block-header",
        functionArgs: [bufferArg(opts.header)],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      if (result.type !== transactions_1.ClarityType.ResponseOk) {
        throw new Error("parse-block-header returned an error response");
      }
      const tuple2 = result.value;
      return {
        version: Number(tuple2.value.version.value),
        parent: (0, common_1.hexToBytes)(tuple2.value.parent.value),
        merkleRoot: (0, common_1.hexToBytes)(tuple2.value["merkle-root"].value),
        timestamp: Number(tuple2.value.timestamp.value),
        nbits: Number(tuple2.value.nbits.value),
        nonce: Number(tuple2.value.nonce.value)
      };
    }
    async function fetchVerifyBlockHeader(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "verify-block-header",
        functionArgs: [bufferArg(opts.header), transactions_1.Cl.uint(opts.expectedBlockHeight)],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return result.type === transactions_1.ClarityType.BoolTrue;
    }
    async function fetchBurnBlockHeaderHash(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-bc-h-hash",
        functionArgs: [transactions_1.Cl.uint(opts.burnHeight)],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      const optional = result;
      if (optional.type === transactions_1.ClarityType.OptionalNone)
        return void 0;
      return (0, common_1.hexToBytes)(optional.value.value);
    }
    async function fetchTotalUstxStacked(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-total-ustx-stacked",
        functionArgs: [transactions_1.Cl.uint(opts.rewardCycle)],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return BigInt(result.value);
    }
    async function fetchBondAllowance2(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const entry = await (0, transactions_1.fetchContractMapEntry)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        mapName: "protocol-bond-allowances",
        mapKey: transactions_1.Cl.tuple({
          "bond-index": transactions_1.Cl.uint(opts.bondIndex),
          staker: transactions_1.Cl.address(opts.address)
        }),
        network: opts.network,
        client: opts.client
      });
      const optional = entry;
      if (optional.type === transactions_1.ClarityType.OptionalNone)
        return 0n;
      return BigInt(optional.value.value);
    }
    async function fetchSignerSharesStakedForCycle(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-signer-shares-staked-for-cycle",
        functionArgs: [
          transactions_1.Cl.address(opts.signerManager),
          transactions_1.Cl.uint(opts.rewardCycle),
          bondIndexCV(opts.bondIndex)
        ],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return BigInt(result.value);
    }
    async function fetchEarned2(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-earned",
        functionArgs: [
          transactions_1.Cl.address(opts.signerManager),
          transactions_1.Cl.uint(opts.rewardCycle),
          bondIndexCV(opts.bondIndex)
        ],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return BigInt(result.value);
    }
    async function fetchSignerUnclaimedRewards(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-signer-unclaimed-rewards-for-cycle",
        functionArgs: [
          transactions_1.Cl.address(opts.signerManager),
          transactions_1.Cl.uint(opts.rewardCycle),
          bondIndexCV(opts.bondIndex)
        ],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return BigInt(result.value);
    }
    async function fetchSignerRewardsPerTokenSettled(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-signer-rewards-per-token-settled-for-cycle",
        functionArgs: [
          transactions_1.Cl.address(opts.signerManager),
          transactions_1.Cl.uint(opts.rewardCycle),
          bondIndexCV(opts.bondIndex)
        ],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return BigInt(result.value);
    }
    async function fetchSignerRewardsPerTokenForCycle(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-signer-rewards-per-token-for-cycle",
        functionArgs: [
          transactions_1.Cl.address(opts.signerManager),
          transactions_1.Cl.uint(opts.rewardCycle),
          bondIndexCV(opts.bondIndex)
        ],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return BigInt(result.value);
    }
    async function fetchEarnedStakerRewards2(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-earned-staker-rewards",
        functionArgs: [
          transactions_1.Cl.address(opts.signerManager),
          transactions_1.Cl.uint(opts.rewardCycle),
          bondIndexCV(opts.bondIndex),
          transactions_1.Cl.address(opts.staker)
        ],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return BigInt(result.value);
    }
    async function fetchStakerRewardsPerTokenSettled(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-staker-rewards-per-token-settled-for-cycle",
        functionArgs: [
          transactions_1.Cl.address(opts.signerManager),
          transactions_1.Cl.uint(opts.rewardCycle),
          bondIndexCV(opts.bondIndex),
          transactions_1.Cl.address(opts.staker)
        ],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return BigInt(result.value);
    }
    async function fetchStakerUnclaimedRewards(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-staker-unclaimed-rewards-for-cycle",
        functionArgs: [
          transactions_1.Cl.address(opts.signerManager),
          transactions_1.Cl.uint(opts.rewardCycle),
          bondIndexCV(opts.bondIndex),
          transactions_1.Cl.address(opts.staker)
        ],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return BigInt(result.value);
    }
    async function fetchLastRewardComputeHeight2(opts = {}) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-last-reward-compute-height",
        functionArgs: [],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return Number(result.value);
    }
    async function fetchRewards(opts = {}) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-rewards",
        functionArgs: [],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return BigInt(result.value);
    }
    async function fetchNewRewards(opts = {}) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-new-rewards",
        functionArgs: [],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return BigInt(result.value);
    }
    async function fetchReserveBalance(opts = {}) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-reserve-balance",
        functionArgs: [],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return BigInt(result.value);
    }
    async function fetchLastAccountedRewards(opts = {}) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-last-accounted-rewards-only",
        functionArgs: [],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return BigInt(result.value);
    }
    async function fetchRewardsPerTokenForCycle(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-rewards-per-token-for-cycle",
        functionArgs: [transactions_1.Cl.uint(opts.rewardCycle), bondIndexCV(opts.bondIndex)],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return BigInt(result.value);
    }
    async function fetchSignerPendingStakedUstx(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-signer-pending-staked-ustx-per-cycle",
        functionArgs: [transactions_1.Cl.address(opts.signerManager), transactions_1.Cl.uint(opts.cycle)],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return BigInt(result.value);
    }
    async function fetchAmountDelegatedForSigner(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-amount-delegated-for-signer",
        functionArgs: [transactions_1.Cl.address(opts.signerManager), transactions_1.Cl.uint(opts.cycle)],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return BigInt(result.value);
    }
    async function fetchUstxDelegatedForCycle(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-ustx-delegated-for-cycle",
        functionArgs: [transactions_1.Cl.uint(opts.rewardCycle)],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return BigInt(result.value);
    }
    async function fetchSignerCycleMembership2(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-signer-cycle-membership",
        functionArgs: [transactions_1.Cl.address(opts.staker), transactions_1.Cl.uint(opts.cycle)],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      const optional = result;
      if (optional.type === transactions_1.ClarityType.OptionalNone)
        return void 0;
      return {
        amountUstx: BigInt(optional.value.value["amount-ustx"].value),
        signer: (0, transactions_1.cvToValue)(optional.value.value.signer)
      };
    }
    async function fetchSignerSetContainsForCycle(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "signer-set-contains-for-cycle",
        functionArgs: [transactions_1.Cl.address(opts.signer), transactions_1.Cl.uint(opts.cycle)],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return result.type === transactions_1.ClarityType.BoolTrue;
    }
    async function fetchSignerSetPrincipal(functionName, functionArgs, opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName,
        functionArgs,
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      const optional = result;
      if (optional.type === transactions_1.ClarityType.OptionalNone)
        return void 0;
      return (0, transactions_1.cvToValue)(optional.value);
    }
    async function fetchSignerSetFirstItem(opts) {
      return fetchSignerSetPrincipal("get-signer-set-first-item-for-cycle", [transactions_1.Cl.uint(opts.cycle)], opts);
    }
    async function fetchSignerSetLastItem(opts) {
      return fetchSignerSetPrincipal("get-signer-set-last-item-for-cycle", [transactions_1.Cl.uint(opts.cycle)], opts);
    }
    async function fetchSignerSetNextItem(opts) {
      return fetchSignerSetPrincipal("get-signer-set-next-item-for-cycle", [transactions_1.Cl.address(opts.signer), transactions_1.Cl.uint(opts.cycle)], opts);
    }
    async function fetchSignerSetPrevItem(opts) {
      return fetchSignerSetPrincipal("get-signer-set-prev-item-for-cycle", [transactions_1.Cl.address(opts.signer), transactions_1.Cl.uint(opts.cycle)], opts);
    }
    async function fetchSignerSetItem(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-signer-set-item-for-cycle",
        functionArgs: [transactions_1.Cl.address(opts.signer), transactions_1.Cl.uint(opts.cycle)],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      const optional = result;
      if (optional.type === transactions_1.ClarityType.OptionalNone)
        return void 0;
      const unwrapPrincipal = (cv) => cv.type === transactions_1.ClarityType.OptionalNone ? void 0 : (0, transactions_1.cvToValue)(cv.value);
      return {
        prev: unwrapPrincipal(optional.value.value.prev),
        next: unwrapPrincipal(optional.value.value.next)
      };
    }
    async function fetchStakerCustodiedSbtc2(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-staker-custodied-sbtc",
        functionArgs: [transactions_1.Cl.address(opts.staker)],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return BigInt(result.value);
    }
    async function fetchBondOverlapsNewPosition(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const membershipArg = opts.membership ? transactions_1.Cl.some(transactions_1.Cl.tuple({
        "bond-index": transactions_1.Cl.uint(opts.membership.bondIndex),
        "amount-ustx": transactions_1.Cl.uint(opts.membership.amountUstx),
        signer: transactions_1.Cl.address(opts.membership.signer),
        "is-l1-lock": transactions_1.Cl.bool(opts.membership.isL1Lock),
        "amount-sats": transactions_1.Cl.uint(opts.membership.amountSats)
      })) : transactions_1.Cl.none();
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "bond-overlaps-new-position?",
        functionArgs: [membershipArg, transactions_1.Cl.uint(opts.newFirstRewardCycle)],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return result.type === transactions_1.ClarityType.BoolTrue;
    }
    async function fetchHasAnnouncedL1EarlyExit2(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "has-announced-l1-early-exit",
        functionArgs: [transactions_1.Cl.uint(opts.bondIndex), transactions_1.Cl.address(opts.staker)],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return result.type === transactions_1.ClarityType.BoolTrue;
    }
    async function fetchSignerInfo2(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-signer-info",
        functionArgs: [transactions_1.Cl.address(opts.signerManager)],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      const optional = result;
      if (optional.type === transactions_1.ClarityType.OptionalNone)
        return void 0;
      return { signerKey: optional.value.value };
    }
    async function fetchVerifySignerKeyGrant2(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const signerKeyArg = typeof opts.signerKey === "string" ? transactions_1.Cl.bufferFromHex(opts.signerKey) : transactions_1.Cl.buffer(opts.signerKey);
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "verify-signer-key-grant",
        functionArgs: [transactions_1.Cl.address(opts.signerManager), signerKeyArg],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return result.type === transactions_1.ClarityType.ResponseOk;
    }
    async function fetchSignerKeyGrantUsed(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const entry = await (0, transactions_1.fetchContractMapEntry)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        mapName: "used-signer-key-grants",
        mapKey: transactions_1.Cl.tuple({
          "signer-key": typeof opts.signerKey === "string" ? transactions_1.Cl.bufferFromHex(opts.signerKey) : transactions_1.Cl.buffer(opts.signerKey),
          "signer-manager": transactions_1.Cl.address(opts.signerManager),
          "auth-id": transactions_1.Cl.uint(opts.authId)
        }),
        network: opts.network,
        client: opts.client
      });
      return entry.type !== transactions_1.ClarityType.OptionalNone;
    }
    async function fetchSignerGrantMessageHash2(opts) {
      const network = (0, network_1.networkFrom)(opts.network ?? "mainnet");
      const result = await (0, transactions_1.fetchCallReadOnlyFunction)({
        contractAddress: network.bootAddress,
        contractName: constants_1.POX5_CONTRACT_NAME,
        functionName: "get-signer-grant-message-hash",
        functionArgs: [transactions_1.Cl.address(opts.signerManager), transactions_1.Cl.uint(opts.authId)],
        senderAddress: network.bootAddress,
        network: opts.network,
        client: opts.client
      });
      return result.value;
    }
  }
});

// node_modules/@stacks/bitcoin-staking/dist/errors.js
var require_errors3 = __commonJS({
  "node_modules/@stacks/bitcoin-staking/dist/errors.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.POX5_ERROR_DESCRIPTIONS = exports2.POX5_ERROR_NAMES = exports2.Pox5ErrorCode = void 0;
    exports2.describePox5Error = describePox5Error2;
    var Pox5ErrorCode;
    (function(Pox5ErrorCode2) {
      Pox5ErrorCode2[Pox5ErrorCode2["Unauthorized"] = 1] = "Unauthorized";
      Pox5ErrorCode2[Pox5ErrorCode2["CannotSetupBondTooSoon"] = 2] = "CannotSetupBondTooSoon";
      Pox5ErrorCode2[Pox5ErrorCode2["CannotSetupBondTooLate"] = 3] = "CannotSetupBondTooLate";
      Pox5ErrorCode2[Pox5ErrorCode2["BondAlreadySetup"] = 4] = "BondAlreadySetup";
      Pox5ErrorCode2[Pox5ErrorCode2["StakerAlreadyAdded"] = 5] = "StakerAlreadyAdded";
      Pox5ErrorCode2[Pox5ErrorCode2["BondNotFound"] = 7] = "BondNotFound";
      Pox5ErrorCode2[Pox5ErrorCode2["InsufficientStx"] = 8] = "InsufficientStx";
      Pox5ErrorCode2[Pox5ErrorCode2["AlreadyRegistered"] = 9] = "AlreadyRegistered";
      Pox5ErrorCode2[Pox5ErrorCode2["TooMuchSats"] = 10] = "TooMuchSats";
      Pox5ErrorCode2[Pox5ErrorCode2["NotAllowlisted"] = 11] = "NotAllowlisted";
      Pox5ErrorCode2[Pox5ErrorCode2["SignerKeyGrantUsed"] = 12] = "SignerKeyGrantUsed";
      Pox5ErrorCode2[Pox5ErrorCode2["InvalidSignatureRecover"] = 13] = "InvalidSignatureRecover";
      Pox5ErrorCode2[Pox5ErrorCode2["InvalidSignaturePubkey"] = 14] = "InvalidSignaturePubkey";
      Pox5ErrorCode2[Pox5ErrorCode2["SignerKeyGrantNotFound"] = 17] = "SignerKeyGrantNotFound";
      Pox5ErrorCode2[Pox5ErrorCode2["AlreadyStaked"] = 19] = "AlreadyStaked";
      Pox5ErrorCode2[Pox5ErrorCode2["InvalidNumCycles"] = 20] = "InvalidNumCycles";
      Pox5ErrorCode2[Pox5ErrorCode2["SignerNotFound"] = 23] = "SignerNotFound";
      Pox5ErrorCode2[Pox5ErrorCode2["InvalidStartBurnHeight"] = 24] = "InvalidStartBurnHeight";
      Pox5ErrorCode2[Pox5ErrorCode2["UnauthorizedSignerRegistration"] = 26] = "UnauthorizedSignerRegistration";
      Pox5ErrorCode2[Pox5ErrorCode2["NotStaking"] = 27] = "NotStaking";
      Pox5ErrorCode2[Pox5ErrorCode2["UnstakeInPreparePhase"] = 28] = "UnstakeInPreparePhase";
      Pox5ErrorCode2[Pox5ErrorCode2["InvalidBondPeriodOrdering"] = 29] = "InvalidBondPeriodOrdering";
      Pox5ErrorCode2[Pox5ErrorCode2["DistributionAlreadyComputed"] = 30] = "DistributionAlreadyComputed";
      Pox5ErrorCode2[Pox5ErrorCode2["BondNotActive"] = 31] = "BondNotActive";
      Pox5ErrorCode2[Pox5ErrorCode2["NoClaimableRewards"] = 32] = "NoClaimableRewards";
      Pox5ErrorCode2[Pox5ErrorCode2["ActiveBondNotIncluded"] = 33] = "ActiveBondNotIncluded";
      Pox5ErrorCode2[Pox5ErrorCode2["NotBondParticipant"] = 34] = "NotBondParticipant";
      Pox5ErrorCode2[Pox5ErrorCode2["CannotAnnounceL1EarlyUnlock"] = 35] = "CannotAnnounceL1EarlyUnlock";
      Pox5ErrorCode2[Pox5ErrorCode2["InvalidOldSignerManager"] = 36] = "InvalidOldSignerManager";
      Pox5ErrorCode2[Pox5ErrorCode2["InvalidUnstakeSbtcAmount"] = 37] = "InvalidUnstakeSbtcAmount";
      Pox5ErrorCode2[Pox5ErrorCode2["CannotUnstakeSbtc"] = 38] = "CannotUnstakeSbtc";
      Pox5ErrorCode2[Pox5ErrorCode2["ReadTxOutOfBounds"] = 39] = "ReadTxOutOfBounds";
      Pox5ErrorCode2[Pox5ErrorCode2["InvalidBtcHeader"] = 40] = "InvalidBtcHeader";
      Pox5ErrorCode2[Pox5ErrorCode2["InvalidMerkleProof"] = 41] = "InvalidMerkleProof";
      Pox5ErrorCode2[Pox5ErrorCode2["InvalidLockupScript"] = 42] = "InvalidLockupScript";
      Pox5ErrorCode2[Pox5ErrorCode2["BondAlreadyStarted"] = 43] = "BondAlreadyStarted";
      Pox5ErrorCode2[Pox5ErrorCode2["UpdateBondSameSigner"] = 44] = "UpdateBondSameSigner";
      Pox5ErrorCode2[Pox5ErrorCode2["InvalidLockupAmount"] = 45] = "InvalidLockupAmount";
      Pox5ErrorCode2[Pox5ErrorCode2["DuplicateLockupOutpoint"] = 46] = "DuplicateLockupOutpoint";
      Pox5ErrorCode2[Pox5ErrorCode2["StakeInPreparePhase"] = 47] = "StakeInPreparePhase";
      Pox5ErrorCode2[Pox5ErrorCode2["RolloverTooEarly"] = 48] = "RolloverTooEarly";
      Pox5ErrorCode2[Pox5ErrorCode2["ReentrantCall"] = 49] = "ReentrantCall";
      Pox5ErrorCode2[Pox5ErrorCode2["L1EarlyExitAlreadyAnnounced"] = 50] = "L1EarlyExitAlreadyAnnounced";
      Pox5ErrorCode2[Pox5ErrorCode2["InsufficientReserveBalance"] = 51] = "InsufficientReserveBalance";
    })(Pox5ErrorCode || (exports2.Pox5ErrorCode = Pox5ErrorCode = {}));
    exports2.POX5_ERROR_NAMES = {
      [Pox5ErrorCode.Unauthorized]: "ERR_UNAUTHORIZED",
      [Pox5ErrorCode.CannotSetupBondTooSoon]: "ERR_CANNOT_SETUP_BOND_TOO_SOON",
      [Pox5ErrorCode.CannotSetupBondTooLate]: "ERR_CANNOT_SETUP_BOND_TOO_LATE",
      [Pox5ErrorCode.BondAlreadySetup]: "ERR_BOND_ALREADY_SETUP",
      [Pox5ErrorCode.StakerAlreadyAdded]: "ERR_STAKER_ALREADY_ADDED",
      [Pox5ErrorCode.BondNotFound]: "ERR_BOND_NOT_FOUND",
      [Pox5ErrorCode.InsufficientStx]: "ERR_INSUFFICIENT_STX",
      [Pox5ErrorCode.AlreadyRegistered]: "ERR_ALREADY_REGISTERED",
      [Pox5ErrorCode.TooMuchSats]: "ERR_TOO_MUCH_SATS",
      [Pox5ErrorCode.NotAllowlisted]: "ERR_NOT_ALLOWLISTED",
      [Pox5ErrorCode.SignerKeyGrantUsed]: "ERR_SIGNER_KEY_GRANT_USED",
      [Pox5ErrorCode.InvalidSignatureRecover]: "ERR_INVALID_SIGNATURE_RECOVER",
      [Pox5ErrorCode.InvalidSignaturePubkey]: "ERR_INVALID_SIGNATURE_PUBKEY",
      [Pox5ErrorCode.SignerKeyGrantNotFound]: "ERR_SIGNER_KEY_GRANT_NOT_FOUND",
      [Pox5ErrorCode.AlreadyStaked]: "ERR_ALREADY_STAKED",
      [Pox5ErrorCode.InvalidNumCycles]: "ERR_INVALID_NUM_CYCLES",
      [Pox5ErrorCode.SignerNotFound]: "ERR_SIGNER_NOT_FOUND",
      [Pox5ErrorCode.InvalidStartBurnHeight]: "ERR_INVALID_START_BURN_HEIGHT",
      [Pox5ErrorCode.UnauthorizedSignerRegistration]: "ERR_UNAUTHORIZED_SIGNER_REGISTRATION",
      [Pox5ErrorCode.NotStaking]: "ERR_NOT_STAKING",
      [Pox5ErrorCode.UnstakeInPreparePhase]: "ERR_UNSTAKE_IN_PREPARE_PHASE",
      [Pox5ErrorCode.InvalidBondPeriodOrdering]: "ERR_INVALID_BOND_PERIOD_ORDERING",
      [Pox5ErrorCode.DistributionAlreadyComputed]: "ERR_DISTRIBUTION_ALREADY_COMPUTED",
      [Pox5ErrorCode.BondNotActive]: "ERR_BOND_NOT_ACTIVE",
      [Pox5ErrorCode.NoClaimableRewards]: "ERR_NO_CLAIMABLE_REWARDS",
      [Pox5ErrorCode.ActiveBondNotIncluded]: "ERR_ACTIVE_BOND_NOT_INCLUDED",
      [Pox5ErrorCode.NotBondParticipant]: "ERR_NOT_BOND_PARTICIPANT",
      [Pox5ErrorCode.CannotAnnounceL1EarlyUnlock]: "ERR_CANNOT_ANNOUNCE_L1_EARLY_UNLOCK",
      [Pox5ErrorCode.InvalidOldSignerManager]: "ERR_INVALID_OLD_SIGNER_MANAGER",
      [Pox5ErrorCode.InvalidUnstakeSbtcAmount]: "ERR_INVALID_UNSTAKE_SBTC_AMOUNT",
      [Pox5ErrorCode.CannotUnstakeSbtc]: "ERR_CANNOT_UNSTAKE_SBTC",
      [Pox5ErrorCode.ReadTxOutOfBounds]: "ERR_READ_TX_OUT_OF_BOUNDS",
      [Pox5ErrorCode.InvalidBtcHeader]: "ERR_INVALID_BTC_HEADER",
      [Pox5ErrorCode.InvalidMerkleProof]: "ERR_INVALID_MERKLE_PROOF",
      [Pox5ErrorCode.InvalidLockupScript]: "ERR_INVALID_LOCKUP_SCRIPT",
      [Pox5ErrorCode.BondAlreadyStarted]: "ERR_BOND_ALREADY_STARTED",
      [Pox5ErrorCode.UpdateBondSameSigner]: "ERR_UPDATE_BOND_SAME_SIGNER",
      [Pox5ErrorCode.InvalidLockupAmount]: "ERR_INVALID_LOCKUP_AMOUNT",
      [Pox5ErrorCode.DuplicateLockupOutpoint]: "ERR_DUPLICATE_LOCKUP_OUTPOINT",
      [Pox5ErrorCode.StakeInPreparePhase]: "ERR_STAKE_IN_PREPARE_PHASE",
      [Pox5ErrorCode.RolloverTooEarly]: "ERR_ROLLOVER_TOO_EARLY",
      [Pox5ErrorCode.ReentrantCall]: "ERR_REENTRANT_CALL",
      [Pox5ErrorCode.L1EarlyExitAlreadyAnnounced]: "ERR_L1_EARLY_EXIT_ALREADY_ANNOUNCED",
      [Pox5ErrorCode.InsufficientReserveBalance]: "ERR_INSUFFICIENT_RESERVE_BALANCE"
    };
    exports2.POX5_ERROR_DESCRIPTIONS = {
      [Pox5ErrorCode.Unauthorized]: "The caller is not authorized for this operation (generic authorization failure).",
      [Pox5ErrorCode.CannotSetupBondTooSoon]: "Bond setup attempted before the registration window opened (more than `BOND_GAP_CYCLES` reward cycles before bond start).",
      [Pox5ErrorCode.CannotSetupBondTooLate]: "Bond setup attempted after the registration window closed.",
      [Pox5ErrorCode.BondAlreadySetup]: "A bond has already been set up for this bond period.",
      [Pox5ErrorCode.StakerAlreadyAdded]: "This staker has already been added to the bond.",
      [Pox5ErrorCode.BondNotFound]: "No bond was found for the supplied bond index.",
      [Pox5ErrorCode.InsufficientStx]: "The caller does not have enough STX for this operation.",
      [Pox5ErrorCode.AlreadyRegistered]: "The staker / signer is already registered.",
      [Pox5ErrorCode.TooMuchSats]: "The supplied sats amount exceeds the allowed maximum.",
      [Pox5ErrorCode.NotAllowlisted]: "The principal is not on the bond allowlist.",
      [Pox5ErrorCode.SignerKeyGrantUsed]: "This signer-key grant has already been consumed.",
      [Pox5ErrorCode.InvalidSignatureRecover]: "Failed to recover a public key from the provided signature.",
      [Pox5ErrorCode.InvalidSignaturePubkey]: "The recovered public key does not match the expected signer key.",
      [Pox5ErrorCode.SignerKeyGrantNotFound]: "No signer-key grant was found for this signer key.",
      [Pox5ErrorCode.AlreadyStaked]: "The principal has already staked in this bond period.",
      [Pox5ErrorCode.InvalidNumCycles]: "The requested number of cycles is outside the allowed range.",
      [Pox5ErrorCode.SignerNotFound]: "No signer was found for the supplied principal.",
      [Pox5ErrorCode.InvalidStartBurnHeight]: "The provided start burn height does not match the current burn block.",
      [Pox5ErrorCode.UnauthorizedSignerRegistration]: "The caller is not authorized to register this signer.",
      [Pox5ErrorCode.NotStaking]: "The principal is not currently staking.",
      [Pox5ErrorCode.UnstakeInPreparePhase]: "Unstaking is not allowed during the prepare phase.",
      [Pox5ErrorCode.InvalidBondPeriodOrdering]: "Bond periods were supplied in an invalid order.",
      [Pox5ErrorCode.DistributionAlreadyComputed]: "The reward distribution has already been computed for this period.",
      [Pox5ErrorCode.BondNotActive]: "The bond is not currently active.",
      [Pox5ErrorCode.NoClaimableRewards]: "There are no claimable rewards for this caller.",
      [Pox5ErrorCode.ActiveBondNotIncluded]: "The currently active bond was not included in the supplied list.",
      [Pox5ErrorCode.NotBondParticipant]: "The caller is not actively in a bond.",
      [Pox5ErrorCode.CannotAnnounceL1EarlyUnlock]: "An early-unlock announcement was made for a bond membership that has an L2 lockup.",
      [Pox5ErrorCode.InvalidOldSignerManager]: "The argument provided does not match the staker's current signer.",
      [Pox5ErrorCode.InvalidUnstakeSbtcAmount]: "The amount of sats provided to unstake is invalid.",
      [Pox5ErrorCode.CannotUnstakeSbtc]: "The bond participant did not stake sBTC.",
      [Pox5ErrorCode.ReadTxOutOfBounds]: "A parse error occurred when reading a Bitcoin header.",
      [Pox5ErrorCode.InvalidBtcHeader]: "An incorrect Bitcoin header was provided as part of a lockup proof.",
      [Pox5ErrorCode.InvalidMerkleProof]: "An incorrect merkle proof was provided as part of a lockup proof.",
      [Pox5ErrorCode.InvalidLockupScript]: "The output script provided is incorrect.",
      [Pox5ErrorCode.BondAlreadyStarted]: "A staker tried to register for a bond after it already started.",
      [Pox5ErrorCode.UpdateBondSameSigner]: "Cannot call `update-bond-registration` with the same signer.",
      [Pox5ErrorCode.InvalidLockupAmount]: "The lockup output amount does not match the specified amount of sats.",
      [Pox5ErrorCode.DuplicateLockupOutpoint]: "The same Bitcoin outpoint (txid + output-index) appeared twice in the L1 lockup proof list submitted to register-for-bond.",
      [Pox5ErrorCode.StakeInPreparePhase]: "A staker tried to modify the next reward cycle's state during the prepare phase.",
      [Pox5ErrorCode.RolloverTooEarly]: "A staker tried to rollover a bond too early.",
      [Pox5ErrorCode.ReentrantCall]: "A reentrant call into pox-5 was detected while a signer-manager trait call was in flight.",
      [Pox5ErrorCode.L1EarlyExitAlreadyAnnounced]: "The staker already announced an L1 early exit for this bond period.",
      [Pox5ErrorCode.InsufficientReserveBalance]: "A reserve withdrawal was attempted with insufficient reserve balance."
    };
    function describePox5Error2(code) {
      const n = Number(code);
      if (!(n in exports2.POX5_ERROR_DESCRIPTIONS))
        return void 0;
      return {
        code: n,
        name: exports2.POX5_ERROR_NAMES[n],
        description: exports2.POX5_ERROR_DESCRIPTIONS[n]
      };
    }
  }
});

// node_modules/@stacks/bitcoin-staking/node_modules/@scure/base/index.js
var base_exports = {};
__export(base_exports, {
  base16: () => base16,
  base32: () => base32,
  base32crockford: () => base32crockford,
  base32hex: () => base32hex,
  base32hexnopad: () => base32hexnopad,
  base32nopad: () => base32nopad,
  base58: () => base582,
  base58check: () => base58check2,
  base58flickr: () => base58flickr,
  base58xmr: () => base58xmr,
  base58xrp: () => base58xrp,
  base64: () => base64,
  base64nopad: () => base64nopad,
  base64url: () => base64url,
  base64urlnopad: () => base64urlnopad,
  bech32: () => bech322,
  bech32m: () => bech32m2,
  bytes: () => bytes,
  bytesToString: () => bytesToString,
  createBase58check: () => createBase58check2,
  hex: () => hex3,
  str: () => str,
  stringToBytes: () => stringToBytes,
  utf8: () => utf82,
  utils: () => utils3
});
function isBytes6(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function abytes4(b) {
  if (!isBytes6(b))
    throw new Error("Uint8Array expected");
}
function isArrayOf3(isString, arr) {
  if (!Array.isArray(arr))
    return false;
  if (arr.length === 0)
    return true;
  if (isString) {
    return arr.every((item) => typeof item === "string");
  } else {
    return arr.every((item) => Number.isSafeInteger(item));
  }
}
function afn3(input) {
  if (typeof input !== "function")
    throw new Error("function expected");
  return true;
}
function astr3(label, input) {
  if (typeof input !== "string")
    throw new Error(`${label}: string expected`);
  return true;
}
function anumber5(n) {
  if (!Number.isSafeInteger(n))
    throw new Error(`invalid integer: ${n}`);
}
function aArr3(input) {
  if (!Array.isArray(input))
    throw new Error("array expected");
}
function astrArr3(label, input) {
  if (!isArrayOf3(true, input))
    throw new Error(`${label}: array of strings expected`);
}
function anumArr3(label, input) {
  if (!isArrayOf3(false, input))
    throw new Error(`${label}: array of numbers expected`);
}
// @__NO_SIDE_EFFECTS__
function chain3(...args) {
  const id = (a) => a;
  const wrap2 = (a, b) => (c) => a(b(c));
  const encode = args.map((x) => x.encode).reduceRight(wrap2, id);
  const decode = args.map((x) => x.decode).reduce(wrap2, id);
  return { encode, decode };
}
// @__NO_SIDE_EFFECTS__
function alphabet3(letters) {
  const lettersA = typeof letters === "string" ? letters.split("") : letters;
  const len = lettersA.length;
  astrArr3("alphabet", lettersA);
  const indexes = new Map(lettersA.map((l, i) => [l, i]));
  return {
    encode: (digits) => {
      aArr3(digits);
      return digits.map((i) => {
        if (!Number.isSafeInteger(i) || i < 0 || i >= len)
          throw new Error(`alphabet.encode: digit index outside alphabet "${i}". Allowed: ${letters}`);
        return lettersA[i];
      });
    },
    decode: (input) => {
      aArr3(input);
      return input.map((letter) => {
        astr3("alphabet.decode", letter);
        const i = indexes.get(letter);
        if (i === void 0)
          throw new Error(`Unknown letter: "${letter}". Allowed: ${letters}`);
        return i;
      });
    }
  };
}
// @__NO_SIDE_EFFECTS__
function join3(separator = "") {
  astr3("join", separator);
  return {
    encode: (from) => {
      astrArr3("join.decode", from);
      return from.join(separator);
    },
    decode: (to) => {
      astr3("join.decode", to);
      return to.split(separator);
    }
  };
}
// @__NO_SIDE_EFFECTS__
function padding(bits, chr = "=") {
  anumber5(bits);
  astr3("padding", chr);
  return {
    encode(data) {
      astrArr3("padding.encode", data);
      while (data.length * bits % 8)
        data.push(chr);
      return data;
    },
    decode(input) {
      astrArr3("padding.decode", input);
      let end = input.length;
      if (end * bits % 8)
        throw new Error("padding: invalid, string should have whole number of bytes");
      for (; end > 0 && input[end - 1] === chr; end--) {
        const last = end - 1;
        const byte = last * bits;
        if (byte % 8 === 0)
          throw new Error("padding: invalid, string has too much padding");
      }
      return input.slice(0, end);
    }
  };
}
// @__NO_SIDE_EFFECTS__
function normalize3(fn) {
  afn3(fn);
  return { encode: (from) => from, decode: (to) => fn(to) };
}
function convertRadix3(data, from, to) {
  if (from < 2)
    throw new Error(`convertRadix: invalid from=${from}, base cannot be less than 2`);
  if (to < 2)
    throw new Error(`convertRadix: invalid to=${to}, base cannot be less than 2`);
  aArr3(data);
  if (!data.length)
    return [];
  let pos = 0;
  const res = [];
  const digits = Array.from(data, (d) => {
    anumber5(d);
    if (d < 0 || d >= from)
      throw new Error(`invalid integer: ${d}`);
    return d;
  });
  const dlen = digits.length;
  while (true) {
    let carry = 0;
    let done = true;
    for (let i = pos; i < dlen; i++) {
      const digit = digits[i];
      const fromCarry = from * carry;
      const digitBase = fromCarry + digit;
      if (!Number.isSafeInteger(digitBase) || fromCarry / from !== carry || digitBase - digit !== fromCarry) {
        throw new Error("convertRadix: carry overflow");
      }
      const div = digitBase / to;
      carry = digitBase % to;
      const rounded = Math.floor(div);
      digits[i] = rounded;
      if (!Number.isSafeInteger(rounded) || rounded * to + carry !== digitBase)
        throw new Error("convertRadix: carry overflow");
      if (!done)
        continue;
      else if (!rounded)
        pos = i;
      else
        done = false;
    }
    res.push(carry);
    if (done)
      break;
  }
  for (let i = 0; i < data.length - 1 && data[i] === 0; i++)
    res.push(0);
  return res.reverse();
}
function convertRadix23(data, from, to, padding2) {
  aArr3(data);
  if (from <= 0 || from > 32)
    throw new Error(`convertRadix2: wrong from=${from}`);
  if (to <= 0 || to > 32)
    throw new Error(`convertRadix2: wrong to=${to}`);
  if (/* @__PURE__ */ radix2carry3(from, to) > 32) {
    throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${/* @__PURE__ */ radix2carry3(from, to)}`);
  }
  let carry = 0;
  let pos = 0;
  const max = powers3[from];
  const mask = powers3[to] - 1;
  const res = [];
  for (const n of data) {
    anumber5(n);
    if (n >= max)
      throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
    carry = carry << from | n;
    if (pos + from > 32)
      throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
    pos += from;
    for (; pos >= to; pos -= to)
      res.push((carry >> pos - to & mask) >>> 0);
    const pow = powers3[pos];
    if (pow === void 0)
      throw new Error("invalid carry");
    carry &= pow - 1;
  }
  carry = carry << to - pos & mask;
  if (!padding2 && pos >= from)
    throw new Error("Excess padding");
  if (!padding2 && carry > 0)
    throw new Error(`Non-zero padding: ${carry}`);
  if (padding2 && pos > 0)
    res.push(carry >>> 0);
  return res;
}
// @__NO_SIDE_EFFECTS__
function radix3(num2) {
  anumber5(num2);
  const _256 = 2 ** 8;
  return {
    encode: (bytes2) => {
      if (!isBytes6(bytes2))
        throw new Error("radix.encode input should be Uint8Array");
      return convertRadix3(Array.from(bytes2), _256, num2);
    },
    decode: (digits) => {
      anumArr3("radix.decode", digits);
      return Uint8Array.from(convertRadix3(digits, num2, _256));
    }
  };
}
// @__NO_SIDE_EFFECTS__
function radix23(bits, revPadding = false) {
  anumber5(bits);
  if (bits <= 0 || bits > 32)
    throw new Error("radix2: bits should be in (0..32]");
  if (/* @__PURE__ */ radix2carry3(8, bits) > 32 || /* @__PURE__ */ radix2carry3(bits, 8) > 32)
    throw new Error("radix2: carry overflow");
  return {
    encode: (bytes2) => {
      if (!isBytes6(bytes2))
        throw new Error("radix2.encode input should be Uint8Array");
      return convertRadix23(Array.from(bytes2), 8, bits, !revPadding);
    },
    decode: (digits) => {
      anumArr3("radix2.decode", digits);
      return Uint8Array.from(convertRadix23(digits, bits, 8, revPadding));
    }
  };
}
function unsafeWrapper2(fn) {
  afn3(fn);
  return function(...args) {
    try {
      return fn.apply(null, args);
    } catch (e) {
    }
  };
}
function checksum2(len, fn) {
  anumber5(len);
  afn3(fn);
  return {
    encode(data) {
      if (!isBytes6(data))
        throw new Error("checksum.encode: input should be Uint8Array");
      const sum = fn(data).slice(0, len);
      const res = new Uint8Array(data.length + len);
      res.set(data);
      res.set(sum, data.length);
      return res;
    },
    decode(data) {
      if (!isBytes6(data))
        throw new Error("checksum.decode: input should be Uint8Array");
      const payload = data.slice(0, -len);
      const oldChecksum = data.slice(-len);
      const newChecksum = fn(payload).slice(0, len);
      for (let i = 0; i < len; i++)
        if (newChecksum[i] !== oldChecksum[i])
          throw new Error("Invalid checksum");
      return payload;
    }
  };
}
function bech32Polymod2(pre) {
  const b = pre >> 25;
  let chk = (pre & 33554431) << 5;
  for (let i = 0; i < POLYMOD_GENERATORS2.length; i++) {
    if ((b >> i & 1) === 1)
      chk ^= POLYMOD_GENERATORS2[i];
  }
  return chk;
}
function bechChecksum2(prefix2, words, encodingConst = 1) {
  const len = prefix2.length;
  let chk = 1;
  for (let i = 0; i < len; i++) {
    const c = prefix2.charCodeAt(i);
    if (c < 33 || c > 126)
      throw new Error(`Invalid prefix (${prefix2})`);
    chk = bech32Polymod2(chk) ^ c >> 5;
  }
  chk = bech32Polymod2(chk);
  for (let i = 0; i < len; i++)
    chk = bech32Polymod2(chk) ^ prefix2.charCodeAt(i) & 31;
  for (let v of words)
    chk = bech32Polymod2(chk) ^ v;
  for (let i = 0; i < 6; i++)
    chk = bech32Polymod2(chk);
  chk ^= encodingConst;
  return BECH_ALPHABET2.encode(convertRadix23([chk % powers3[30]], 30, 5, false));
}
// @__NO_SIDE_EFFECTS__
function genBech322(encoding) {
  const ENCODING_CONST = encoding === "bech32" ? 1 : 734539939;
  const _words = /* @__PURE__ */ radix23(5);
  const fromWords = _words.decode;
  const toWords = _words.encode;
  const fromWordsUnsafe = unsafeWrapper2(fromWords);
  function encode(prefix2, words, limit = 90) {
    astr3("bech32.encode prefix", prefix2);
    if (isBytes6(words))
      words = Array.from(words);
    anumArr3("bech32.encode", words);
    const plen = prefix2.length;
    if (plen === 0)
      throw new TypeError(`Invalid prefix length ${plen}`);
    const actualLength = plen + 7 + words.length;
    if (limit !== false && actualLength > limit)
      throw new TypeError(`Length ${actualLength} exceeds limit ${limit}`);
    const lowered = prefix2.toLowerCase();
    const sum = bechChecksum2(lowered, words, ENCODING_CONST);
    return `${lowered}1${BECH_ALPHABET2.encode(words)}${sum}`;
  }
  function decode(str2, limit = 90) {
    astr3("bech32.decode input", str2);
    const slen = str2.length;
    if (slen < 8 || limit !== false && slen > limit)
      throw new TypeError(`invalid string length: ${slen} (${str2}). Expected (8..${limit})`);
    const lowered = str2.toLowerCase();
    if (str2 !== lowered && str2 !== str2.toUpperCase())
      throw new Error(`String must be lowercase or uppercase`);
    const sepIndex = lowered.lastIndexOf("1");
    if (sepIndex === 0 || sepIndex === -1)
      throw new Error(`Letter "1" must be present between prefix and data only`);
    const prefix2 = lowered.slice(0, sepIndex);
    const data = lowered.slice(sepIndex + 1);
    if (data.length < 6)
      throw new Error("Data must be at least 6 characters long");
    const words = BECH_ALPHABET2.decode(data).slice(0, -6);
    const sum = bechChecksum2(prefix2, words, ENCODING_CONST);
    if (!data.endsWith(sum))
      throw new Error(`Invalid checksum in ${str2}: expected "${sum}"`);
    return { prefix: prefix2, words };
  }
  const decodeUnsafe = unsafeWrapper2(decode);
  function decodeToBytes(str2) {
    const { prefix: prefix2, words } = decode(str2, false);
    return { prefix: prefix2, words, bytes: fromWords(words) };
  }
  function encodeFromBytes(prefix2, bytes2) {
    return encode(prefix2, toWords(bytes2));
  }
  return {
    encode,
    decode,
    encodeFromBytes,
    decodeToBytes,
    decodeUnsafe,
    fromWords,
    fromWordsUnsafe,
    toWords
  };
}
var gcd3, radix2carry3, powers3, utils3, base16, base32, base32nopad, base32hex, base32hexnopad, base32crockford, hasBase64Builtin, decodeBase64Builtin, base64, base64nopad, base64url, base64urlnopad, genBase582, base582, base58flickr, base58xrp, XMR_BLOCK_LEN, base58xmr, createBase58check2, base58check2, BECH_ALPHABET2, POLYMOD_GENERATORS2, bech322, bech32m2, utf82, hasHexBuiltin3, hexBuiltin3, hex3, CODERS, coderTypeError, bytesToString, str, stringToBytes, bytes;
var init_base3 = __esm({
  "node_modules/@stacks/bitcoin-staking/node_modules/@scure/base/index.js"() {
    gcd3 = (a, b) => b === 0 ? a : gcd3(b, a % b);
    radix2carry3 = /* @__NO_SIDE_EFFECTS__ */ (from, to) => from + (to - gcd3(from, to));
    powers3 = /* @__PURE__ */ (() => {
      let res = [];
      for (let i = 0; i < 40; i++)
        res.push(2 ** i);
      return res;
    })();
    utils3 = {
      alphabet: alphabet3,
      chain: chain3,
      checksum: checksum2,
      convertRadix: convertRadix3,
      convertRadix2: convertRadix23,
      radix: radix3,
      radix2: radix23,
      join: join3,
      padding
    };
    base16 = /* @__PURE__ */ chain3(/* @__PURE__ */ radix23(4), /* @__PURE__ */ alphabet3("0123456789ABCDEF"), /* @__PURE__ */ join3(""));
    base32 = /* @__PURE__ */ chain3(/* @__PURE__ */ radix23(5), /* @__PURE__ */ alphabet3("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"), /* @__PURE__ */ padding(5), /* @__PURE__ */ join3(""));
    base32nopad = /* @__PURE__ */ chain3(/* @__PURE__ */ radix23(5), /* @__PURE__ */ alphabet3("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"), /* @__PURE__ */ join3(""));
    base32hex = /* @__PURE__ */ chain3(/* @__PURE__ */ radix23(5), /* @__PURE__ */ alphabet3("0123456789ABCDEFGHIJKLMNOPQRSTUV"), /* @__PURE__ */ padding(5), /* @__PURE__ */ join3(""));
    base32hexnopad = /* @__PURE__ */ chain3(/* @__PURE__ */ radix23(5), /* @__PURE__ */ alphabet3("0123456789ABCDEFGHIJKLMNOPQRSTUV"), /* @__PURE__ */ join3(""));
    base32crockford = /* @__PURE__ */ chain3(/* @__PURE__ */ radix23(5), /* @__PURE__ */ alphabet3("0123456789ABCDEFGHJKMNPQRSTVWXYZ"), /* @__PURE__ */ join3(""), /* @__PURE__ */ normalize3((s) => s.toUpperCase().replace(/O/g, "0").replace(/[IL]/g, "1")));
    hasBase64Builtin = /* @__PURE__ */ (() => typeof Uint8Array.from([]).toBase64 === "function" && typeof Uint8Array.fromBase64 === "function")();
    decodeBase64Builtin = (s, isUrl) => {
      astr3("base64", s);
      const re = isUrl ? /^[A-Za-z0-9=_-]+$/ : /^[A-Za-z0-9=+/]+$/;
      const alphabet4 = isUrl ? "base64url" : "base64";
      if (s.length > 0 && !re.test(s))
        throw new Error("invalid base64");
      return Uint8Array.fromBase64(s, { alphabet: alphabet4, lastChunkHandling: "strict" });
    };
    base64 = hasBase64Builtin ? {
      encode(b) {
        abytes4(b);
        return b.toBase64();
      },
      decode(s) {
        return decodeBase64Builtin(s, false);
      }
    } : /* @__PURE__ */ chain3(/* @__PURE__ */ radix23(6), /* @__PURE__ */ alphabet3("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"), /* @__PURE__ */ padding(6), /* @__PURE__ */ join3(""));
    base64nopad = /* @__PURE__ */ chain3(/* @__PURE__ */ radix23(6), /* @__PURE__ */ alphabet3("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"), /* @__PURE__ */ join3(""));
    base64url = hasBase64Builtin ? {
      encode(b) {
        abytes4(b);
        return b.toBase64({ alphabet: "base64url" });
      },
      decode(s) {
        return decodeBase64Builtin(s, true);
      }
    } : /* @__PURE__ */ chain3(/* @__PURE__ */ radix23(6), /* @__PURE__ */ alphabet3("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"), /* @__PURE__ */ padding(6), /* @__PURE__ */ join3(""));
    base64urlnopad = /* @__PURE__ */ chain3(/* @__PURE__ */ radix23(6), /* @__PURE__ */ alphabet3("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"), /* @__PURE__ */ join3(""));
    genBase582 = /* @__NO_SIDE_EFFECTS__ */ (abc) => /* @__PURE__ */ chain3(/* @__PURE__ */ radix3(58), /* @__PURE__ */ alphabet3(abc), /* @__PURE__ */ join3(""));
    base582 = /* @__PURE__ */ genBase582("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");
    base58flickr = /* @__PURE__ */ genBase582("123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ");
    base58xrp = /* @__PURE__ */ genBase582("rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz");
    XMR_BLOCK_LEN = [0, 2, 3, 5, 6, 7, 9, 10, 11];
    base58xmr = {
      encode(data) {
        let res = "";
        for (let i = 0; i < data.length; i += 8) {
          const block = data.subarray(i, i + 8);
          res += base582.encode(block).padStart(XMR_BLOCK_LEN[block.length], "1");
        }
        return res;
      },
      decode(str2) {
        let res = [];
        for (let i = 0; i < str2.length; i += 11) {
          const slice = str2.slice(i, i + 11);
          const blockLen = XMR_BLOCK_LEN.indexOf(slice.length);
          const block = base582.decode(slice);
          for (let j = 0; j < block.length - blockLen; j++) {
            if (block[j] !== 0)
              throw new Error("base58xmr: wrong padding");
          }
          res = res.concat(Array.from(block.slice(block.length - blockLen)));
        }
        return Uint8Array.from(res);
      }
    };
    createBase58check2 = (sha2565) => /* @__PURE__ */ chain3(checksum2(4, (data) => sha2565(sha2565(data))), base582);
    base58check2 = createBase58check2;
    BECH_ALPHABET2 = /* @__PURE__ */ chain3(/* @__PURE__ */ alphabet3("qpzry9x8gf2tvdw0s3jn54khce6mua7l"), /* @__PURE__ */ join3(""));
    POLYMOD_GENERATORS2 = [996825010, 642813549, 513874426, 1027748829, 705979059];
    bech322 = /* @__PURE__ */ genBech322("bech32");
    bech32m2 = /* @__PURE__ */ genBech322("bech32m");
    utf82 = {
      encode: (data) => new TextDecoder().decode(data),
      decode: (str2) => new TextEncoder().encode(str2)
    };
    hasHexBuiltin3 = /* @__PURE__ */ (() => typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function")();
    hexBuiltin3 = {
      encode(data) {
        abytes4(data);
        return data.toHex();
      },
      decode(s) {
        astr3("hex", s);
        return Uint8Array.fromHex(s);
      }
    };
    hex3 = hasHexBuiltin3 ? hexBuiltin3 : /* @__PURE__ */ chain3(/* @__PURE__ */ radix23(4), /* @__PURE__ */ alphabet3("0123456789abcdef"), /* @__PURE__ */ join3(""), /* @__PURE__ */ normalize3((s) => {
      if (typeof s !== "string" || s.length % 2 !== 0)
        throw new TypeError(`hex.decode: expected string, got ${typeof s} with length ${s.length}`);
      return s.toLowerCase();
    }));
    CODERS = {
      utf8: utf82,
      hex: hex3,
      base16,
      base32,
      base64,
      base64url,
      base58: base582,
      base58xmr
    };
    coderTypeError = "Invalid encoding type. Available types: utf8, hex, base16, base32, base64, base64url, base58, base58xmr";
    bytesToString = (type, bytes2) => {
      if (typeof type !== "string" || !CODERS.hasOwnProperty(type))
        throw new TypeError(coderTypeError);
      if (!isBytes6(bytes2))
        throw new TypeError("bytesToString() expects Uint8Array");
      return CODERS[type].encode(bytes2);
    };
    str = bytesToString;
    stringToBytes = (type, str2) => {
      if (!CODERS.hasOwnProperty(type))
        throw new TypeError(coderTypeError);
      if (typeof str2 !== "string")
        throw new TypeError("stringToBytes() expects string");
      return CODERS[type].decode(str2);
    };
    bytes = stringToBytes;
  }
});

// node_modules/@stacks/bitcoin-staking/dist/btc-address.js
var require_btc_address = __commonJS({
  "node_modules/@stacks/bitcoin-staking/dist/btc-address.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.parse = parse;
    exports2.stringify = stringify;
    var base_1 = (init_base3(), __toCommonJS(base_exports));
    var common_1 = require_dist2();
    var encryption_1 = require("@stacks/encryption");
    var transactions_1 = require("@stacks/transactions");
    var constants_1 = require_constants2();
    var network_1 = require_network();
    function btcAddressVersionToLegacyHashMode(btcAddressVersion) {
      switch (btcAddressVersion) {
        case constants_1.BitcoinNetworkVersion.mainnet.P2PKH:
        case constants_1.BitcoinNetworkVersion.testnet.P2PKH:
          return constants_1.PoXAddressVersion.P2PKH;
        case constants_1.BitcoinNetworkVersion.mainnet.P2SH:
        case constants_1.BitcoinNetworkVersion.testnet.P2SH:
          return constants_1.PoXAddressVersion.P2SH;
        default:
          throw new Error("Invalid pox address version");
      }
    }
    function nativeAddressToSegwitVersion(witnessVersion, dataLength) {
      if (witnessVersion === constants_1.SEGWIT_V0 && dataLength === 20)
        return constants_1.PoXAddressVersion.P2WPKH;
      if (witnessVersion === constants_1.SEGWIT_V0 && dataLength === 32)
        return constants_1.PoXAddressVersion.P2WSH;
      if (witnessVersion === constants_1.SEGWIT_V1 && dataLength === 32)
        return constants_1.PoXAddressVersion.P2TR;
      throw new Error("Invalid native segwit witness version and byte length. Only P2WPKH, P2WSH, and P2TR are supported.");
    }
    function bech32Decode(btcAddress) {
      const { words } = base_1.bech32.decode(btcAddress);
      const witnessVersion = words[0];
      if (witnessVersion > 0)
        throw new Error("Addresses with a witness version >= 1 should be encoded in bech32m");
      return { witnessVersion, data: base_1.bech32.fromWords(words.slice(1)) };
    }
    function bech32MDecode(btcAddress) {
      const { words } = base_1.bech32m.decode(btcAddress);
      const witnessVersion = words[0];
      if (witnessVersion === 0)
        throw new Error("Addresses with witness version 0 should be encoded in bech32");
      return { witnessVersion, data: base_1.bech32m.fromWords(words.slice(1)) };
    }
    function decodeNativeSegwitBtcAddress(btcAddress) {
      if (constants_1.SEGWIT_V0_ADDR_PREFIX.test(btcAddress))
        return bech32Decode(btcAddress);
      if (constants_1.SEGWIT_V1_ADDR_PREFIX.test(btcAddress))
        return bech32MDecode(btcAddress);
      throw new Error(`Native segwit address ${btcAddress} does not match a valid prefix`);
    }
    function legacyHashModeToBtcAddressVersion(hashMode, network) {
      switch (hashMode) {
        case constants_1.PoXAddressVersion.P2PKH:
          return constants_1.BitcoinNetworkVersion[network].P2PKH;
        case constants_1.PoXAddressVersion.P2SH:
        case constants_1.PoXAddressVersion.P2SHP2WPKH:
        case constants_1.PoXAddressVersion.P2SHP2WSH:
          return constants_1.BitcoinNetworkVersion[network].P2SH;
        default:
          throw new Error("Invalid pox address version");
      }
    }
    function fromPoxTuple(poxAddr) {
      const cv = poxAddr;
      if (cv.type !== transactions_1.ClarityType.Tuple || !cv.value) {
        throw new Error("Invalid argument, expected ClarityValue to be a TupleCV");
      }
      if (!("version" in cv.value) || !("hashbytes" in cv.value)) {
        throw new Error("Invalid argument, expected Clarity tuple to contain `version` and `hashbytes` keys");
      }
      const versionCV = cv.value["version"];
      const hashBytesCV = cv.value["hashbytes"];
      if (versionCV.type !== transactions_1.ClarityType.Buffer || hashBytesCV.type !== transactions_1.ClarityType.Buffer) {
        throw new Error("Invalid argument, expected `version` and `hashbytes` to be buffer values");
      }
      return {
        version: (0, common_1.hexToBytes)(versionCV.value)[0],
        data: (0, common_1.hexToBytes)(hashBytesCV.value)
      };
    }
    function parse(btcAddress) {
      try {
        if (constants_1.B58_ADDR_PREFIXES.test(btcAddress)) {
          const b58 = (0, encryption_1.base58CheckDecode)(btcAddress);
          return {
            version: btcAddressVersionToLegacyHashMode(b58.version),
            data: b58.hash
          };
        }
        if (constants_1.SEGWIT_ADDR_PREFIXES.test(btcAddress)) {
          const b32 = decodeNativeSegwitBtcAddress(btcAddress);
          return {
            version: nativeAddressToSegwitVersion(b32.witnessVersion, b32.data.length),
            data: b32.data
          };
        }
      } catch (cause) {
        throw new Error(`'${btcAddress}' is not a valid P2PKH/P2SH/P2WPKH/P2WSH/P2TR address`, {
          cause
        });
      }
      throw new Error(`'${btcAddress}' is not a valid P2PKH/P2SH/P2WPKH/P2WSH/P2TR address`);
    }
    function stringify(address, network) {
      const networkName = (0, network_1.networkNameFrom)(network);
      const { version, data } = "type" in address ? fromPoxTuple(address) : address;
      switch (version) {
        case constants_1.PoXAddressVersion.P2PKH:
        case constants_1.PoXAddressVersion.P2SH:
        case constants_1.PoXAddressVersion.P2SHP2WPKH:
        case constants_1.PoXAddressVersion.P2SHP2WSH: {
          const btcAddrVersion = legacyHashModeToBtcAddressVersion(version, networkName);
          return (0, encryption_1.base58CheckEncode)(btcAddrVersion, data);
        }
        case constants_1.PoXAddressVersion.P2WPKH:
        case constants_1.PoXAddressVersion.P2WSH: {
          const words = base_1.bech32.toWords(data);
          return base_1.bech32.encode(constants_1.SegwitPrefix[networkName], [constants_1.SEGWIT_V0, ...words]);
        }
        case constants_1.PoXAddressVersion.P2TR: {
          const words = base_1.bech32m.toWords(data);
          return base_1.bech32m.encode(constants_1.SegwitPrefix[networkName], [constants_1.SEGWIT_V1, ...words]);
        }
        default:
          throw new Error(`Unexpected address version: ${version}`);
      }
    }
  }
});

// node_modules/@stacks/bitcoin-staking/dist/signer.js
var require_signer = __commonJS({
  "node_modules/@stacks/bitcoin-staking/dist/signer.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.buildSignerGrantMessage = buildSignerGrantMessage;
    exports2.computeSignerGrantHash = computeSignerGrantHash;
    exports2.signSignerGrant = signSignerGrant;
    exports2.verifySignerGrant = verifySignerGrant;
    exports2.buildSignerCalldata = buildSignerCalldata;
    exports2.decodeSignerCalldata = decodeSignerCalldata;
    var sha2_js_1 = require("@noble/hashes/sha2.js");
    var common_1 = require_dist2();
    var encryption_1 = require("@stacks/encryption");
    var transactions_1 = require("@stacks/transactions");
    var btc_address_1 = require_btc_address();
    function buildSignerGrantMessage(opts) {
      const message = transactions_1.Cl.tuple({
        topic: transactions_1.Cl.stringAscii("grant-authorization"),
        "signer-manager": transactions_1.Cl.address(opts.signerManager),
        "auth-id": transactions_1.Cl.uint(opts.authId)
      });
      const domain = transactions_1.Cl.tuple({
        name: transactions_1.Cl.stringAscii("pox-5-signer"),
        version: transactions_1.Cl.stringAscii("1.0.0"),
        "chain-id": transactions_1.Cl.uint(opts.chainId)
      });
      return { message, domain };
    }
    function computeSignerGrantHash(opts) {
      return (0, sha2_js_1.sha256)((0, transactions_1.encodeStructuredDataBytes)(buildSignerGrantMessage(opts)));
    }
    function signSignerGrant(opts) {
      return (0, transactions_1.signStructuredData)({
        ...buildSignerGrantMessage(opts),
        privateKey: opts.privateKey
      });
    }
    function verifySignerGrant(opts) {
      return (0, encryption_1.verifyMessageSignatureRsv)({
        message: computeSignerGrantHash(opts),
        publicKey: typeof opts.publicKey === "string" ? opts.publicKey : (0, common_1.bytesToHex)(opts.publicKey),
        signature: typeof opts.signature === "string" ? opts.signature : (0, common_1.bytesToHex)(opts.signature)
      });
    }
    function buildSignerCalldata(opts) {
      const { version, data } = typeof opts.poxAddress === "string" ? (0, btc_address_1.parse)(opts.poxAddress) : opts.poxAddress;
      return (0, transactions_1.serializeCVBytes)(transactions_1.Cl.tuple({
        "pox-addr": transactions_1.Cl.tuple({
          version: transactions_1.Cl.buffer(Uint8Array.of(version)),
          hashbytes: transactions_1.Cl.buffer(data)
        }),
        "max-fee": transactions_1.Cl.uint(opts.maxFeeSats)
      }));
    }
    function decodeSignerCalldata(calldata) {
      const cv = (0, transactions_1.deserializeCV)(calldata);
      if (cv.type !== transactions_1.ClarityType.Tuple || !("pox-addr" in cv.value) || !("max-fee" in cv.value)) {
        throw new Error("Invalid signer calldata: expected a `{ pox-addr, max-fee }` tuple");
      }
      const poxAddrCV = cv.value["pox-addr"];
      const maxFeeCV = cv.value["max-fee"];
      if (poxAddrCV.type !== transactions_1.ClarityType.Tuple || maxFeeCV.type !== transactions_1.ClarityType.UInt) {
        throw new Error("Invalid signer calldata: unexpected `pox-addr` or `max-fee` types");
      }
      const versionCV = poxAddrCV.value["version"];
      const hashbytesCV = poxAddrCV.value["hashbytes"];
      if (versionCV?.type !== transactions_1.ClarityType.Buffer || hashbytesCV?.type !== transactions_1.ClarityType.Buffer) {
        throw new Error("Invalid signer calldata: expected buffer `version` and `hashbytes`");
      }
      return {
        poxAddress: {
          version: (0, common_1.hexToBytes)(versionCV.value)[0],
          data: (0, common_1.hexToBytes)(hashbytesCV.value)
        },
        maxFeeSats: BigInt(maxFeeCV.value)
      };
    }
  }
});

// node_modules/@stacks/bitcoin-staking/dist/eligibility.js
var require_eligibility = __commonJS({
  "node_modules/@stacks/bitcoin-staking/dist/eligibility.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.fetchEligibleRegisterForBond = fetchEligibleRegisterForBond2;
    exports2.fetchEligibleSetBondAdmin = fetchEligibleSetBondAdmin;
    exports2.fetchEligibleSetupBond = fetchEligibleSetupBond;
    exports2.fetchEligibleUpdateBondRegistration = fetchEligibleUpdateBondRegistration2;
    exports2.fetchEligibleAnnounceL1EarlyExit = fetchEligibleAnnounceL1EarlyExit2;
    exports2.fetchEligibleUnstakeSbtc = fetchEligibleUnstakeSbtc2;
    exports2.fetchEligibleStakeUpdate = fetchEligibleStakeUpdate2;
    exports2.fetchEligibleUnstake = fetchEligibleUnstake2;
    exports2.fetchEligibleCalculateRewards = fetchEligibleCalculateRewards2;
    exports2.fetchEligibleClaimRewards = fetchEligibleClaimRewards;
    exports2.fetchEligibleStake = fetchEligibleStake2;
    exports2.fetchEligibleGrantSignerKey = fetchEligibleGrantSignerKey;
    exports2.fetchEligibleRevokeSignerGrant = fetchEligibleRevokeSignerGrant;
    var common_1 = require_dist2();
    var network_1 = require("@stacks/network");
    var transactions_1 = require("@stacks/transactions");
    var constants_1 = require_constants2();
    var cycles_1 = require_cycles();
    var errors_1 = require_errors3();
    var fetch_1 = require_fetch3();
    var proof_1 = require_proof();
    var signer_1 = require_signer();
    async function fetchEligibleRegisterForBond2(opts) {
      const networkClient = { network: opts.network, client: opts.client };
      const staker = { address: opts.staker };
      const [poxInfo2, bond, allowance, stakerInfo, account, membership, signerInfo] = await Promise.all([
        opts.poxInfo ?? (0, fetch_1.fetchPoxInfo)(networkClient),
        (0, fetch_1.fetchProtocolBond)({ bondIndex: opts.bondIndex, ...networkClient }),
        (0, fetch_1.fetchBondAllowance)({ bondIndex: opts.bondIndex, ...staker, ...networkClient }),
        (0, fetch_1.fetchStakerInfo)({ ...staker, ...networkClient }),
        (0, fetch_1.fetchAccountStatus)({ ...staker, ...networkClient }),
        (0, fetch_1.fetchBondMembership)({ ...staker, ...networkClient }),
        (0, fetch_1.fetchSignerInfo)({ signerManager: opts.signerManager, ...networkClient })
      ]);
      const burnHeight = poxInfo2.currentBurnchainBlockHeight;
      const firstRewardCycle = (0, cycles_1.bondPeriodToRewardCycle)({ bondIndex: opts.bondIndex, poxInfo: poxInfo2 });
      const bondStartHeight = (0, cycles_1.bondPeriodToBurnHeight)({ bondIndex: opts.bondIndex, poxInfo: poxInfo2 });
      const [grantActive, overlaps, l1UnlockHeight] = await Promise.all([
        signerInfo ? (0, fetch_1.fetchVerifySignerKeyGrant)({
          signerKey: signerInfo.signerKey,
          signerManager: opts.signerManager,
          ...networkClient
        }) : false,
        membership ? (0, fetch_1.fetchBondOverlapsNewPosition)({
          membership,
          newFirstRewardCycle: firstRewardCycle,
          ...networkClient
        }) : false,
        membership ? (0, fetch_1.fetchBondL1UnlockHeight)({ bondIndex: membership.bondIndex, ...networkClient }) : void 0
      ]);
      const headerValidity = opts.outputs?.length ? await Promise.all(opts.outputs.map((o) => (0, fetch_1.fetchVerifyBlockHeader)({
        header: o.header,
        expectedBlockHeight: o.height,
        ...networkClient
      }))) : [];
      const reasons = [];
      if (opts.outputs?.length) {
        if (headerValidity.includes(false))
          reasons.push(errors_1.Pox5ErrorCode.InvalidBtcHeader);
        const outpoints = opts.outputs.map((o) => `${(0, common_1.bytesToHex)((0, proof_1.computeBitcoinTxid)((0, proof_1.serializeBitcoinTx)(o.tx)))}:${o.outputIndex}`);
        if (new Set(outpoints).size !== outpoints.length) {
          reasons.push(errors_1.Pox5ErrorCode.DuplicateLockupOutpoint);
        }
      }
      if (!bond)
        reasons.push(errors_1.Pox5ErrorCode.BondNotFound);
      if (allowance === 0n)
        reasons.push(errors_1.Pox5ErrorCode.NotAllowlisted);
      if ((0, cycles_1.isInPreparePhase)({ burnHeight, poxInfo: poxInfo2 })) {
        reasons.push(errors_1.Pox5ErrorCode.StakeInPreparePhase);
      }
      if (bond && opts.amountUstx < (0, cycles_1.minUstxForSatsAmount)({
        sats: opts.satsTotal,
        stxValueRatio: bond.stxValueRatio,
        minUstxRatioBps: bond.minUstxRatioBps
      })) {
        reasons.push(errors_1.Pox5ErrorCode.InsufficientStx);
      }
      if (burnHeight >= bondStartHeight)
        reasons.push(errors_1.Pox5ErrorCode.BondAlreadyStarted);
      if (stakerInfo.staked && stakerInfo.details.firstRewardCycle + stakerInfo.details.numCycles > firstRewardCycle) {
        reasons.push(errors_1.Pox5ErrorCode.AlreadyStaked);
      }
      if (opts.satsTotal > allowance)
        reasons.push(errors_1.Pox5ErrorCode.TooMuchSats);
      if (account.balance + account.locked < opts.amountUstx) {
        if (!reasons.includes(errors_1.Pox5ErrorCode.InsufficientStx)) {
          reasons.push(errors_1.Pox5ErrorCode.InsufficientStx);
        }
      }
      if (!signerInfo)
        reasons.push(errors_1.Pox5ErrorCode.SignerNotFound);
      else if (!grantActive)
        reasons.push(errors_1.Pox5ErrorCode.SignerKeyGrantNotFound);
      if (overlaps)
        reasons.push(errors_1.Pox5ErrorCode.AlreadyRegistered);
      if (membership && !overlaps && l1UnlockHeight !== void 0 && burnHeight < l1UnlockHeight) {
        reasons.push(errors_1.Pox5ErrorCode.RolloverTooEarly);
      }
      return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
    }
    async function fetchEligibleSetBondAdmin(opts) {
      const admin = await (0, fetch_1.fetchBondAdmin)({ network: opts.network, client: opts.client });
      return opts.caller === admin ? { ok: true } : { ok: false, reasons: [errors_1.Pox5ErrorCode.Unauthorized] };
    }
    async function fetchEligibleSetupBond(opts) {
      const networkClient = { network: opts.network, client: opts.client };
      const [admin, poxInfo2, bond] = await Promise.all([
        (0, fetch_1.fetchBondAdmin)(networkClient),
        opts.poxInfo ?? (0, fetch_1.fetchPoxInfo)(networkClient),
        (0, fetch_1.fetchProtocolBond)({ bondIndex: opts.bondIndex, ...networkClient })
      ]);
      const reasons = [];
      if (opts.caller !== admin)
        reasons.push(errors_1.Pox5ErrorCode.Unauthorized);
      const burnHeight = poxInfo2.currentBurnchainBlockHeight;
      const bondStartHeight = (0, cycles_1.bondPeriodToBurnHeight)({ bondIndex: opts.bondIndex, poxInfo: poxInfo2 });
      const gap = constants_1.BOND_GAP_CYCLES * poxInfo2.rewardCycleLength;
      if (bondStartHeight >= gap && bondStartHeight - gap > burnHeight) {
        reasons.push(errors_1.Pox5ErrorCode.CannotSetupBondTooSoon);
      }
      if (burnHeight >= bondStartHeight)
        reasons.push(errors_1.Pox5ErrorCode.CannotSetupBondTooLate);
      if (bond !== void 0)
        reasons.push(errors_1.Pox5ErrorCode.BondAlreadySetup);
      const stakers = opts.allowlist.map((e) => e.staker);
      if (new Set(stakers).size !== stakers.length) {
        reasons.push(errors_1.Pox5ErrorCode.StakerAlreadyAdded);
      }
      return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
    }
    async function fetchEligibleUpdateBondRegistration2(opts) {
      const networkClient = { network: opts.network, client: opts.client };
      const [poxInfo2, membership, signerInfo] = await Promise.all([
        opts.poxInfo ?? (0, fetch_1.fetchPoxInfo)(networkClient),
        (0, fetch_1.fetchBondMembership)({ address: opts.staker, ...networkClient }),
        (0, fetch_1.fetchSignerInfo)({ signerManager: opts.signerManager, ...networkClient })
      ]);
      const grantActive = signerInfo ? await (0, fetch_1.fetchVerifySignerKeyGrant)({
        signerKey: signerInfo.signerKey,
        signerManager: opts.signerManager,
        ...networkClient
      }) : false;
      const reasons = [];
      if (!membership)
        reasons.push(errors_1.Pox5ErrorCode.NotBondParticipant);
      if ((0, cycles_1.isInPreparePhase)({ burnHeight: poxInfo2.currentBurnchainBlockHeight, poxInfo: poxInfo2 })) {
        reasons.push(errors_1.Pox5ErrorCode.StakeInPreparePhase);
      }
      if (membership && opts.oldSignerManager !== membership.signer) {
        reasons.push(errors_1.Pox5ErrorCode.InvalidOldSignerManager);
      }
      if (opts.signerManager === opts.oldSignerManager) {
        reasons.push(errors_1.Pox5ErrorCode.UpdateBondSameSigner);
      }
      if (!signerInfo)
        reasons.push(errors_1.Pox5ErrorCode.SignerNotFound);
      else if (!grantActive)
        reasons.push(errors_1.Pox5ErrorCode.SignerKeyGrantNotFound);
      return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
    }
    async function fetchEligibleAnnounceL1EarlyExit2(opts) {
      const networkClient = { network: opts.network, client: opts.client };
      const [poxInfo2, membership] = await Promise.all([
        opts.poxInfo ?? (0, fetch_1.fetchPoxInfo)(networkClient),
        (0, fetch_1.fetchBondMembership)({ address: opts.staker, ...networkClient })
      ]);
      const alreadyAnnounced = membership ? await (0, fetch_1.fetchHasAnnouncedL1EarlyExit)({
        bondIndex: membership.bondIndex,
        staker: opts.staker,
        ...networkClient
      }) : false;
      const reasons = [];
      if (!membership)
        reasons.push(errors_1.Pox5ErrorCode.NotBondParticipant);
      if ((0, cycles_1.isInPreparePhase)({ burnHeight: poxInfo2.currentBurnchainBlockHeight, poxInfo: poxInfo2 })) {
        reasons.push(errors_1.Pox5ErrorCode.StakeInPreparePhase);
      }
      if (membership && !membership.isL1Lock) {
        reasons.push(errors_1.Pox5ErrorCode.CannotAnnounceL1EarlyUnlock);
      }
      if (membership && opts.oldSignerManager !== membership.signer) {
        reasons.push(errors_1.Pox5ErrorCode.InvalidOldSignerManager);
      }
      if (alreadyAnnounced)
        reasons.push(errors_1.Pox5ErrorCode.L1EarlyExitAlreadyAnnounced);
      return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
    }
    async function fetchEligibleUnstakeSbtc2(opts) {
      const networkClient = { network: opts.network, client: opts.client };
      const [poxInfo2, membership] = await Promise.all([
        opts.poxInfo ?? (0, fetch_1.fetchPoxInfo)(networkClient),
        (0, fetch_1.fetchProtocolBondMemberships)({ address: opts.staker, ...networkClient })
      ]);
      const reasons = [];
      if (!membership)
        reasons.push(errors_1.Pox5ErrorCode.NotBondParticipant);
      if (membership && opts.amountToWithdrawSats > membership.amountSats) {
        reasons.push(errors_1.Pox5ErrorCode.InvalidUnstakeSbtcAmount);
      }
      if ((0, cycles_1.isInPreparePhase)({ burnHeight: poxInfo2.currentBurnchainBlockHeight, poxInfo: poxInfo2 })) {
        reasons.push(errors_1.Pox5ErrorCode.StakeInPreparePhase);
      }
      if (membership && opts.signerManager !== membership.signer) {
        reasons.push(errors_1.Pox5ErrorCode.InvalidOldSignerManager);
      }
      if (membership && membership.isL1Lock)
        reasons.push(errors_1.Pox5ErrorCode.CannotUnstakeSbtc);
      return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
    }
    async function fetchEligibleStakeUpdate2(opts) {
      const networkClient = { network: opts.network, client: opts.client };
      const staker = { address: opts.staker };
      const [poxInfo2, stakerInfo, signerInfo, account] = await Promise.all([
        opts.poxInfo ?? (0, fetch_1.fetchPoxInfo)(networkClient),
        (0, fetch_1.fetchStakerInfo)({ ...staker, ...networkClient }),
        (0, fetch_1.fetchSignerInfo)({ signerManager: opts.signerManager, ...networkClient }),
        (0, fetch_1.fetchAccountStatus)({ ...staker, ...networkClient })
      ]);
      const grantActive = signerInfo ? await (0, fetch_1.fetchVerifySignerKeyGrant)({
        signerKey: signerInfo.signerKey,
        signerManager: opts.signerManager,
        ...networkClient
      }) : false;
      const reasons = [];
      if (!stakerInfo.staked)
        reasons.push(errors_1.Pox5ErrorCode.NotStaking);
      if ((0, cycles_1.isInPreparePhase)({ burnHeight: poxInfo2.currentBurnchainBlockHeight, poxInfo: poxInfo2 })) {
        reasons.push(errors_1.Pox5ErrorCode.StakeInPreparePhase);
      }
      if (stakerInfo.staked && opts.oldSignerManager !== stakerInfo.details.signer) {
        reasons.push(errors_1.Pox5ErrorCode.InvalidOldSignerManager);
      }
      if (!signerInfo)
        reasons.push(errors_1.Pox5ErrorCode.SignerNotFound);
      else if (!grantActive)
        reasons.push(errors_1.Pox5ErrorCode.SignerKeyGrantNotFound);
      if (stakerInfo.staked) {
        const numCycles = stakerInfo.details.firstRewardCycle + stakerInfo.details.numCycles + (opts.cyclesToExtend ?? 0) - poxInfo2.rewardCycleId - 1;
        if (numCycles < 1 || numCycles > constants_1.MAX_NUM_CYCLES) {
          reasons.push(errors_1.Pox5ErrorCode.InvalidNumCycles);
        }
      }
      if (account.balance < (opts.amountIncrease ?? 0n)) {
        reasons.push(errors_1.Pox5ErrorCode.InsufficientStx);
      }
      return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
    }
    async function fetchEligibleUnstake2(opts) {
      const networkClient = { network: opts.network, client: opts.client };
      const [poxInfo2, stakerInfo] = await Promise.all([
        opts.poxInfo ?? (0, fetch_1.fetchPoxInfo)(networkClient),
        (0, fetch_1.fetchStakerInfo)({ address: opts.staker, ...networkClient })
      ]);
      const reasons = [];
      if (!stakerInfo.staked)
        reasons.push(errors_1.Pox5ErrorCode.NotStaking);
      if (stakerInfo.staked && opts.oldSignerManager !== stakerInfo.details.signer) {
        reasons.push(errors_1.Pox5ErrorCode.InvalidOldSignerManager);
      }
      if ((0, cycles_1.isInPreparePhase)({ burnHeight: poxInfo2.currentBurnchainBlockHeight, poxInfo: poxInfo2 })) {
        reasons.push(errors_1.Pox5ErrorCode.UnstakeInPreparePhase);
      }
      return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
    }
    async function fetchEligibleCalculateRewards2(opts) {
      const networkClient = { network: opts.network, client: opts.client };
      const poxInfo2 = opts.poxInfo ?? await (0, fetch_1.fetchPoxInfo)(networkClient);
      const calcHeight = (0, cycles_1.distributionCycleToBurnHeight)({ distributionCycle: (0, cycles_1.currentDistributionCycle)(poxInfo2), poxInfo: poxInfo2 }) - 1;
      const calcCycle = (0, cycles_1.burnHeightToRewardCycle)({ burnHeight: calcHeight, poxInfo: poxInfo2 });
      const firstBondCycle = (0, cycles_1.bondPeriodToRewardCycle)({ bondIndex: 0, poxInfo: poxInfo2 });
      const latest = calcCycle <= firstBondCycle ? 0 : Math.floor((calcCycle - firstBondCycle) / constants_1.BOND_GAP_CYCLES);
      const windowStart = Math.max(0, latest - (cycles_1.BOND_END_OFFSET_PERIODS - 1));
      const candidates = [];
      for (let i = windowStart; i <= latest; i++)
        candidates.push(i);
      const idsToFetch = [.../* @__PURE__ */ new Set([...candidates, ...opts.bondIndices])];
      const [lastComputeHeight, ...fetchedBonds] = await Promise.all([
        (0, fetch_1.fetchLastRewardComputeHeight)(networkClient),
        ...idsToFetch.map((bondIndex) => (0, fetch_1.fetchProtocolBond)({ bondIndex, ...networkClient }))
      ]);
      const bondById = new Map(idsToFetch.map((id, i) => [id, fetchedBonds[i]]));
      const isActive = (bondIndex) => bondById.get(bondIndex) !== void 0 && (0, cycles_1.isBondActiveAtHeight)({ bondIndex, burnHeight: calcHeight, poxInfo: poxInfo2 });
      const reasons = [];
      if (calcHeight <= lastComputeHeight)
        reasons.push(errors_1.Pox5ErrorCode.DistributionAlreadyComputed);
      if (candidates.some((c) => isActive(c) && !opts.bondIndices.includes(c))) {
        reasons.push(errors_1.Pox5ErrorCode.ActiveBondNotIncluded);
      }
      if (opts.bondIndices.some((i) => bondById.get(i) === void 0)) {
        reasons.push(errors_1.Pox5ErrorCode.BondNotFound);
      }
      const ratios = opts.bondIndices.map((i) => bondById.get(i));
      const misordered = ratios.some((bond, k) => {
        if (k === 0 || !bond || !ratios[k - 1])
          return false;
        const prev = ratios[k - 1];
        return bond.stxValueRatio > prev.stxValueRatio ? true : bond.stxValueRatio === prev.stxValueRatio && opts.bondIndices[k] <= opts.bondIndices[k - 1];
      });
      if (misordered)
        reasons.push(errors_1.Pox5ErrorCode.InvalidBondPeriodOrdering);
      if (opts.bondIndices.some((i) => bondById.get(i) !== void 0 && !isActive(i))) {
        reasons.push(errors_1.Pox5ErrorCode.BondNotActive);
      }
      return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
    }
    async function fetchEligibleClaimRewards(opts) {
      const networkClient = { network: opts.network, client: opts.client };
      const { signerManager, rewardCycle } = opts;
      const earned = await Promise.all([
        (0, fetch_1.fetchEarned)({ signerManager, rewardCycle, ...networkClient }),
        ...opts.bondIndices.map((bondIndex) => (0, fetch_1.fetchEarned)({ signerManager, rewardCycle, bondIndex, ...networkClient }))
      ]);
      const total = earned.reduce((sum, e) => sum + e, 0n);
      return total > 0n ? { ok: true } : { ok: false, reasons: [errors_1.Pox5ErrorCode.NoClaimableRewards] };
    }
    async function fetchEligibleStake2(opts) {
      const networkClient = { network: opts.network, client: opts.client };
      const staker = { address: opts.staker };
      const [poxInfo2, stakerInfo, signerInfo, account, membership] = await Promise.all([
        opts.poxInfo ?? (0, fetch_1.fetchPoxInfo)(networkClient),
        (0, fetch_1.fetchStakerInfo)({ ...staker, ...networkClient }),
        (0, fetch_1.fetchSignerInfo)({ signerManager: opts.signerManager, ...networkClient }),
        (0, fetch_1.fetchAccountStatus)({ ...staker, ...networkClient }),
        (0, fetch_1.fetchBondMembership)({ ...staker, ...networkClient })
      ]);
      const firstRewardCycle = poxInfo2.rewardCycleId + 1;
      const [grantActive, overlaps, l1UnlockHeight] = await Promise.all([
        signerInfo ? (0, fetch_1.fetchVerifySignerKeyGrant)({
          signerKey: signerInfo.signerKey,
          signerManager: opts.signerManager,
          ...networkClient
        }) : false,
        membership ? (0, fetch_1.fetchBondOverlapsNewPosition)({ membership, newFirstRewardCycle: firstRewardCycle, ...networkClient }) : false,
        membership ? (0, fetch_1.fetchBondL1UnlockHeight)({ bondIndex: membership.bondIndex, ...networkClient }) : void 0
      ]);
      const burnHeight = poxInfo2.currentBurnchainBlockHeight;
      const reasons = [];
      if ((0, cycles_1.isInPreparePhase)({ burnHeight, poxInfo: poxInfo2 }))
        reasons.push(errors_1.Pox5ErrorCode.StakeInPreparePhase);
      if (!signerInfo)
        reasons.push(errors_1.Pox5ErrorCode.SignerNotFound);
      else if (!grantActive)
        reasons.push(errors_1.Pox5ErrorCode.SignerKeyGrantNotFound);
      if ((0, cycles_1.burnHeightToRewardCycle)({ burnHeight: opts.startBurnHt, poxInfo: poxInfo2 }) !== poxInfo2.rewardCycleId) {
        reasons.push(errors_1.Pox5ErrorCode.InvalidStartBurnHeight);
      }
      if (opts.numCycles < 1 || opts.numCycles > constants_1.MAX_NUM_CYCLES) {
        reasons.push(errors_1.Pox5ErrorCode.InvalidNumCycles);
      }
      if (stakerInfo.staked || overlaps)
        reasons.push(errors_1.Pox5ErrorCode.AlreadyStaked);
      if (membership && !overlaps && l1UnlockHeight !== void 0 && burnHeight < l1UnlockHeight) {
        reasons.push(errors_1.Pox5ErrorCode.RolloverTooEarly);
      }
      if (account.balance + account.locked < opts.amountUstx) {
        reasons.push(errors_1.Pox5ErrorCode.InsufficientStx);
      }
      return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
    }
    async function fetchEligibleGrantSignerKey(opts) {
      const networkClient = { network: opts.network, client: opts.client };
      const chainId = (0, network_1.networkFrom)(opts.network ?? "mainnet").chainId;
      const used = await (0, fetch_1.fetchSignerKeyGrantUsed)({
        signerKey: opts.signerKey,
        signerManager: opts.signerManager,
        authId: opts.authId,
        ...networkClient
      });
      const signatureValid = (0, signer_1.verifySignerGrant)({
        signerManager: opts.signerManager,
        authId: opts.authId,
        chainId,
        publicKey: opts.signerKey,
        signature: opts.signerSignature
      });
      const reasons = [];
      if (used)
        reasons.push(errors_1.Pox5ErrorCode.SignerKeyGrantUsed);
      if (!signatureValid)
        reasons.push(errors_1.Pox5ErrorCode.InvalidSignaturePubkey);
      return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
    }
    async function fetchEligibleRevokeSignerGrant(opts) {
      const expected = (0, transactions_1.getAddressFromPublicKey)(opts.signerKey, opts.network ?? "mainnet");
      return opts.caller === expected ? { ok: true } : { ok: false, reasons: [errors_1.Pox5ErrorCode.Unauthorized] };
    }
  }
});

// node_modules/@stacks/bitcoin-staking/dist/index.js
var require_dist3 = __commonJS({
  "node_modules/@stacks/bitcoin-staking/dist/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod2) {
        if (mod2 && mod2.__esModule) return mod2;
        var result = {};
        if (mod2 != null) {
          for (var k = ownKeys(mod2), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod2, k[i]);
        }
        __setModuleDefault(result, mod2);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.BtcAddress = void 0;
    __exportStar(require_types2(), exports2);
    __exportStar(require_constants2(), exports2);
    __exportStar(require_network(), exports2);
    __exportStar(require_script(), exports2);
    __exportStar(require_proof(), exports2);
    __exportStar(require_build(), exports2);
    __exportStar(require_fetch3(), exports2);
    __exportStar(require_eligibility(), exports2);
    __exportStar(require_cycles(), exports2);
    __exportStar(require_errors3(), exports2);
    __exportStar(require_signer(), exports2);
    exports2.BtcAddress = __importStar(require_btc_address());
  }
});

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ActionType: () => ActionType,
  ApiService: () => ApiService,
  BTC_ESPLORA: () => BTC_ESPLORA,
  CorruptLockStoreError: () => CorruptLockStoreError,
  DEFAULT_POX_FEE_USTX: () => DEFAULT_POX_FEE_USTX,
  DEFAULT_SCHEDULE_BOND_INDICES: () => DEFAULT_SCHEDULE_BOND_INDICES,
  EARLY_EXIT_SIGNER: () => EARLY_EXIT_SIGNER,
  FileLockRecordStore: () => FileLockRecordStore,
  InMemoryLockRecordStore: () => InMemoryLockRecordStore,
  MAX_FEE_STX: () => MAX_FEE_STX,
  POX4_ERRORS: () => POX4_ERRORS,
  POX5_BOND_ERRORS: () => POX5_BOND_ERRORS,
  PRIVATE1_HIRO_API_BASE: () => PRIVATE1_HIRO_API_BASE,
  PUBLIC_TESTNET_POX5_API: () => PUBLIC_TESTNET_POX5_API,
  RBF_MIN_FEE_MULTIPLIER: () => RBF_MIN_FEE_MULTIPLIER,
  REWARD_CALLDATA_MAX_BYTES: () => REWARD_CALLDATA_MAX_BYTES,
  SignerManagerRegistry: () => SignerManagerRegistry,
  StackingPools: () => StackingPools,
  StacksSDK: () => StacksSDK,
  TokenType: () => TokenType,
  TransactionType: () => TransactionType,
  ValidationError: () => ValidationError,
  api_constants: () => api_constants,
  config: () => config,
  derivationPath: () => derivationPath,
  diffBondSchedule: () => diffBondSchedule,
  encodeRewardAddressCalldata: () => encodeRewardAddressCalldata,
  env: () => env,
  formatBondScheduleError: () => formatBondScheduleError,
  ftInfo: () => ftInfo,
  helperConstants: () => helperConstants,
  laterStage: () => laterStage,
  pagination_defaults: () => pagination_defaults,
  parseOptionalAmount: () => parseOptionalAmount,
  parseOptionalFee: () => parseOptionalFee,
  parseOptionalNonce: () => parseOptionalNonce,
  planSbtcRollover: () => planSbtcRollover,
  poolInfo: () => poolInfo,
  poxInfo: () => poxInfo,
  stacks_info: () => stacks_info,
  validateBondScheduleAgainstChain: () => validateBondScheduleAgainstChain
});
module.exports = __toCommonJS(index_exports);

// src/services/stacks.service.ts
var import_axios = __toESM(require("axios"));

// src/services/types.ts
var TransactionType = /* @__PURE__ */ ((TransactionType2) => {
  TransactionType2["STX"] = "STX";
  TransactionType2["FungibleToken"] = "Fungible Token";
  return TransactionType2;
})(TransactionType || {});
var TokenType = /* @__PURE__ */ ((TokenType2) => {
  TokenType2["STX"] = "STX";
  TokenType2["sBTC"] = "sbtc-token";
  TokenType2["USDCx"] = "usdcx-token";
  TokenType2["CUSTOM"] = "custom-token";
  return TokenType2;
})(TokenType || {});
var StackingPools = /* @__PURE__ */ ((StackingPools2) => {
  StackingPools2["FAST_POOL"] = "fast-pool";
  return StackingPools2;
})(StackingPools || {});

// src/services/stacks.service.ts
var import_network = require("@stacks/network");
var import_transactions2 = require("@stacks/transactions");

// src/utils/errorHandling.ts
function formatErrorMessage(error) {
  if (error instanceof Error) {
    const nested = extractResponseDetail(error);
    return nested ? `${error.message} (${nested})` : error.message;
  }
  if (typeof error === "string") return error;
  if (error === null || error === void 0) return "Unknown error";
  if (typeof error === "object") {
    const detail = extractResponseDetail(error);
    if (detail) return detail;
    const record = error;
    for (const key of ["message", "error", "reason", "detail"]) {
      if (typeof record[key] === "string" && record[key]) {
        return record[key];
      }
    }
    try {
      const serialized = JSON.stringify(
        error,
        (_, v) => typeof v === "bigint" ? v.toString() : v
      );
      if (serialized && serialized !== "{}") return serialized;
    } catch {
    }
    return error.constructor?.name ?? "Unknown error object";
  }
  return String(error);
}
function extractResponseDetail(error) {
  const data = error?.response?.data;
  if (!data) return null;
  if (typeof data === "string") return data;
  if (typeof data === "object") {
    const record = data;
    const message = record.message ?? record.error ?? record.detail;
    const code = record.code ?? record.statusCode;
    if (typeof message === "string" && message) {
      return code !== void 0 ? `${message} [${String(code)}]` : message;
    }
    try {
      const serialized = JSON.stringify(data);
      if (serialized && serialized !== "{}") return serialized;
    } catch {
    }
  }
  return null;
}

// src/utils/helpers.ts
var import_c32check = require("c32check");

// src/utils/constants.ts
var derivationPath = {
  purpose: 44,
  coinTypeTestnet: 1,
  coinTypeMainnet: 0,
  change: 0,
  addressIndex: 0
};
var helperConstants = {
  vaultIdForReadOnlyActions: "0",
  // Use a dummy vault ID for read-only actions that don't require a specific vault account/blockchain address
  stacks_api_page_size: 50,
  // Hard maximum per single Stacks API request
  stacks_api_max_limit: 200
  // Maximum limit accepted from callers; service paginates internally when limit > stacks_api_page_size
};
var RBF_MIN_FEE_MULTIPLIER = 1.25;
var MAX_FEE_STX = 10;
var DEFAULT_POX_FEE_USTX = BigInt(1e4);
var api_constants = {
  stacks_mainnet_rpc: "https://api.hiro.so",
  stacks_testnet_rpc: "https://api.testnet.hiro.so"
};
var stacks_info = {
  stxDecimals: 6,
  stxSymbol: "STX",
  stacking: {
    pool: {
      minLockCycles: 1,
      maxLockCycles: 12
    },
    solo: {
      safetyBlocks: 10
    }
  }
};
var pagination_defaults = {
  page: 0,
  limit: 50
};
var ftInfo = {
  ["sbtc-token" /* sBTC */]: {
    mainnet: {
      contractAddress: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4",
      contractName: "sbtc-token",
      assetName: "sbtc-token",
      decimals: 8
    },
    testnet: {
      contractAddress: "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT",
      contractName: "sbtc-token",
      assetName: "sbtc-token",
      decimals: 8
    }
  },
  ["usdcx-token" /* USDCx */]: {
    mainnet: {
      contractAddress: "SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE",
      contractName: "usdcx",
      assetName: "usdcx-token",
      decimals: 6
    },
    testnet: {
      contractAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
      contractName: "usdcx",
      assetName: "usdcx-token",
      decimals: 6
    }
  }
};
var poolInfo = {
  ["fast-pool" /* FAST_POOL */]: {
    poolAddress: "SP21YTSM60CAY6D011EZVEVNKXVW8FVZE198XEFFP",
    poolContractName: "pox4-fast-pool-v3"
  }
};
var poxInfo = {
  testnet: {
    contractAddress: "ST000000000000000000002AMW42H",
    contractName: "pox-4"
  },
  mainnet: {
    contractAddress: "SP000000000000000000002Q6VF78",
    contractName: "pox-4"
  }
};
var POX4_ERRORS = {
  1: {
    name: "ERR_STACKING_INSUFFICIENT_FUNDS",
    message: "Insufficient STX balance to stack the requested amount."
  },
  2: {
    name: "ERR_STACKING_INVALID_LOCK_PERIOD",
    message: "Invalid lock period. Must be between 1 and 12 cycles."
  },
  3: {
    name: "ERR_STACKING_ALREADY_STACKED",
    message: "This address is already stacking. Use stack-increase or stack-extend to modify your existing stake, or wait until your current lock period ends."
  },
  4: {
    name: "ERR_STACKING_NO_SUCH_PRINCIPAL",
    message: "No stacking record found for this address."
  },
  5: {
    name: "ERR_STACKING_EXPIRED",
    message: "The stacking authorization has expired."
  },
  6: {
    name: "ERR_STACKING_STX_LOCKED",
    message: "STX are already locked and cannot be re-locked."
  },
  9: {
    name: "ERR_STACKING_PERMISSION_DENIED",
    message: "Permission denied. You don't have authorization to perform this stacking operation."
  },
  11: {
    name: "ERR_STACKING_THRESHOLD_NOT_MET",
    message: "The amount you're trying to stack is below the minimum threshold for this cycle."
  },
  12: {
    name: "ERR_STACKING_POX_ADDRESS_IN_USE",
    message: "This PoX address is already in use with a different signer key."
  },
  13: {
    name: "ERR_STACKING_INVALID_POX_ADDRESS",
    message: "Invalid Bitcoin reward address format."
  },
  18: {
    name: "ERR_STACKING_INVALID_AMOUNT",
    message: "Invalid stacking amount. Amount must be greater than zero."
  },
  19: {
    name: "ERR_NOT_ALLOWED",
    message: "This operation is not allowed."
  },
  20: {
    name: "ERR_STACKING_ALREADY_DELEGATED",
    message: "This address has already delegated to a pool."
  },
  21: {
    name: "ERR_DELEGATION_EXPIRES_DURING_LOCK",
    message: "The delegation would expire before the lock period ends."
  },
  22: {
    name: "ERR_DELEGATION_TOO_MUCH_LOCKED",
    message: "Trying to lock more STX than the delegator has authorized."
  },
  23: {
    name: "ERR_DELEGATION_POX_ADDR_REQUIRED",
    message: "A PoX address must be specified for this delegation operation."
  },
  24: {
    name: "ERR_INVALID_START_BURN_HEIGHT",
    message: "Invalid start burn height. The cycle may have already started or the timing is incorrect."
  },
  25: {
    name: "ERR_NOT_CURRENT_STACKER",
    message: "You are not currently stacking."
  },
  26: {
    name: "ERR_STACK_EXTEND_NOT_LOCKED",
    message: "Cannot extend: your STX are not currently locked."
  },
  27: {
    name: "ERR_STACK_INCREASE_NOT_LOCKED",
    message: "Cannot increase: your STX are not currently locked."
  },
  28: {
    name: "ERR_DELEGATION_NO_REWARD_SLOT",
    message: "No reward slot available for this delegation."
  },
  29: {
    name: "ERR_DELEGATION_WRONG_REWARD_SLOT",
    message: "Wrong reward slot specified for this delegation."
  },
  30: {
    name: "ERR_STACKING_IS_DELEGATED",
    message: "This address has delegated its stacking rights and cannot perform direct stacking operations."
  },
  31: {
    name: "ERR_STACKING_NOT_DELEGATED",
    message: "This address is not delegated to any pool operator."
  },
  32: {
    name: "ERR_INVALID_SIGNER_KEY",
    message: "Invalid signer key provided."
  },
  33: {
    name: "ERR_REUSED_SIGNER_KEY",
    message: "This signer key has already been used."
  },
  34: {
    name: "ERR_DELEGATION_ALREADY_REVOKED",
    message: "The delegation has already been revoked."
  },
  35: {
    name: "ERR_INVALID_SIGNATURE_PUBKEY",
    message: "The signer signature does not match the provided public key, or signature parameters don't match the transaction."
  },
  36: {
    name: "ERR_INVALID_SIGNATURE_RECOVER",
    message: "Failed to recover the public key from the signature. The signature format may be incorrect."
  },
  37: {
    name: "ERR_INVALID_REWARD_CYCLE",
    message: "Invalid reward cycle specified."
  },
  38: {
    name: "ERR_SIGNER_AUTH_AMOUNT_TOO_HIGH",
    message: "The stacking amount exceeds the maximum amount authorized by the signer signature."
  },
  39: {
    name: "ERR_SIGNER_AUTH_USED",
    message: "This signer authorization has already been used and cannot be reused."
  },
  40: {
    name: "ERR_INVALID_INCREASE",
    message: "Invalid stack increase operation."
  },
  254: {
    name: "ERR_STACKING_CORRUPTED_STATE",
    message: "The stacking state is corrupted (internal error)."
  },
  255: {
    name: "ERR_STACKING_UNREACHABLE",
    message: "An unreachable code path was hit (internal error)."
  }
};
var BTC_ESPLORA = {
  mainnet: "https://mempool.space/api",
  testnet: "https://mempool.bitcoin.private-1.hiro.so/api",
  // Public Bitcoin testnet3 Esplora (used by the public-testnet profile).
  public_testnet: "https://blockstream.info/testnet/api"
};
var PRIVATE1_HIRO_API_BASE = "https://api.private-1.hiro.so";
var PUBLIC_TESTNET_POX5_API = "https://api.testnet-pox5.hiro.so";
var EARLY_EXIT_SIGNER = {
  mainnet: "",
  testnet: "https://r25rniyw12.execute-api.eu-west-1.amazonaws.com/api/v1",
  public_testnet: ""
};
var POX5_BOND_ERRORS = {
  7: { name: "ERR_BOND_NOT_FOUND", message: "Bond index not found \u2014 verify bondIndex." },
  8: { name: "ERR_INSUFFICIENT_STX", message: "amountUstx below the required STX/BTC ratio minimum." },
  9: { name: "ERR_ALREADY_REGISTERED", message: "Overlapping bond membership already exists for this address." },
  10: { name: "ERR_TOO_MUCH_SATS", message: "BTC amount exceeds the allowlist cap for this address." },
  11: { name: "ERR_NOT_ALLOWLISTED", message: "Address has no allowance entry for this bond \u2014 contact the bond operator." },
  19: { name: "ERR_ALREADY_STAKED", message: "Address has an overlapping STX-only stake \u2014 unstake first." },
  23: { name: "ERR_SIGNER_NOT_FOUND", message: "Signer-manager not registered \u2014 run grantSignerKey first." },
  26: { name: "ERR_UNAUTHORIZED_SIGNER_REGISTRATION", message: "Called pox-5 grant directly \u2014 use the signer-manager register-self path." },
  39: { name: "ERR_READ_TX_OUT_OF_BOUNDS", message: "Raw BTC tx bytes malformed or truncated." },
  40: { name: "ERR_INVALID_BTC_HEADER", message: "Block header doesn't hash to the expected burn-chain header at that height." },
  41: { name: "ERR_INVALID_MERKLE_PROOF", message: "Merkle proof is wrong \u2014 check block hash and endianness." },
  42: { name: "ERR_INVALID_LOCKUP_SCRIPT", message: "scriptPubKey \u2260 expected P2WSH \u2014 script mismatch between SDK and contract." },
  43: { name: "ERR_BOND_ALREADY_STARTED", message: "Registered after bond-start-height \u2014 no grace period." },
  45: { name: "ERR_INVALID_LOCKUP_AMOUNT", message: "Proof amount \u2260 decoded output value." },
  46: { name: "ERR_DUPLICATE_LOCKUP_OUTPOINT", message: "Same (txid, vout) submitted twice." },
  47: { name: "ERR_STAKE_IN_PREPARE_PHASE", message: "Landed in prepare phase \u2014 broadcast earlier in the cycle." },
  48: { name: "ERR_ROLLOVER_TOO_EARLY", message: "Rollover attempted before prior bond L1 unlock window." },
  50: { name: "ERR_L1_EARLY_EXIT_ALREADY_ANNOUNCED", message: "announceEarlyExit already called for this membership." }
};

// src/utils/helpers.ts
var import_stacking = require("@stacks/stacking");
var import_transactions = require("@stacks/transactions");
var import_sha256 = require("@noble/hashes/sha256");
var import_secp256k1 = require("@noble/secp256k1");
function getTokenInfo(token, network) {
  return ftInfo[token]?.[network];
}
function validateAmount(amount) {
  try {
    const num2 = typeof amount === "number" ? amount : Number(amount);
    if (isNaN(num2) || num2 <= 0) {
      console.log("Invalid Amount: amount must be a positive number");
      return false;
    }
    return true;
  } catch (err) {
    console.error("Could not validate amount:", formatErrorMessage(err));
    throw new Error("validateAmount Failed : Error validating amounts");
  }
}
function validateAddress(addr, testnet) {
  if (testnet) {
    if (!/^S[TN][A-Z0-9]+$/.test(addr)) return false;
  } else {
    if (!/^S[PM][A-Z0-9]+$/.test(addr)) return false;
  }
  try {
    const [version, data] = (0, import_c32check.c32addressDecode)(addr);
    const validVersions = testnet ? [26, 21] : [22, 20];
    if (!validVersions.includes(version)) return false;
    return /^[0-9a-fA-F]{40}$/.test(data);
  } catch (error) {
    console.error(
      "validateAddress : Error validating address:",
      formatErrorMessage(error)
    );
    return false;
  }
}
function isCompressedSecp256k1PubKeyHex(hex4) {
  return /^(02|03)[0-9a-fA-F]{64}$/.test(hex4);
}
function stxToMicro(amountStx) {
  if (!validateAmount(amountStx)) {
    throw new Error("Invalid amount for stxToMicro conversion");
  }
  const s = String(amountStx);
  const [w = "0", fRaw = ""] = s.split(".");
  const f = (fRaw + "000000").slice(0, stacks_info.stxDecimals);
  return BigInt(w) * BigInt(10 ** stacks_info.stxDecimals) + BigInt(f);
}
function microToStx(micro) {
  const microBigInt = typeof micro === "bigint" ? micro : BigInt(micro);
  return Number(microBigInt) / 10 ** stacks_info.stxDecimals;
}
async function tokenToMicro(amount, token, stacksService, customTokenContractAddress, customTokenContractName) {
  if (token === "custom-token" /* CUSTOM */) {
    if (!customTokenContractAddress || !customTokenContractName) {
      throw new Error(
        `Custom token contract address and name must be provided for CUSTOM token type`
      );
    }
  }
  let decimals;
  const info = getTokenInfo(token, "mainnet");
  if (!info) {
    decimals = await stacksService.fetchFtDecimals(
      customTokenContractAddress,
      customTokenContractName
    );
  } else {
    decimals = info.decimals;
  }
  const [w = "0", fRaw = ""] = String(amount).split(".");
  const frac = (fRaw + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(w) * BigInt(10) ** BigInt(decimals) + BigInt(frac || "0");
}
function microToToken(micro, decimals) {
  const microBigInt = typeof micro === "bigint" ? micro : BigInt(micro);
  const after = Number(microBigInt) / 10 ** decimals;
  return after;
}
function concatSignature(fullSig, v) {
  if (v !== 0 && v !== 1) {
    throw new Error(`Invalid recovery id: expected 0 or 1, got ${v}`);
  }
  if (!/^[0-9a-fA-F]{128}$/.test(fullSig)) {
    throw new Error(`Invalid signature: expected 128 hex chars, got ${fullSig.length}`);
  }
  let normalizedSig = fullSig;
  let normalizedV = v;
  try {
    const parsed = import_secp256k1.Signature.fromCompact(fullSig);
    if (parsed.hasHighS()) {
      normalizedSig = parsed.normalizeS().toCompactHex();
      normalizedV = v ^ 1;
    }
  } catch (error) {
    throw new Error(`Invalid signature: failed to parse as secp256k1 signature - ${error instanceof Error ? error.message : error}`);
  }
  const vHex = normalizedV === 0 ? "00" : "01";
  return vHex + normalizedSig;
}
var getDecimalsFromFtInfo = (contractId) => {
  const [addr, contractAndToken] = contractId.split(".");
  const [contractName] = contractAndToken.split("::");
  const allNetworkInfos = Object.values(ftInfo).filter((t) => t !== void 0 && t !== null).flatMap((t) => [t.mainnet, t.testnet]);
  const hit = allNetworkInfos.find(
    (t) => t.contractName === contractName && t.contractAddress.toLowerCase() === addr.toLowerCase()
  );
  if (hit) {
    return hit.decimals;
  }
  return 0;
};
function parseAssetId(assetId) {
  const [contractPrincipal, tokenName] = assetId.split("::");
  const dot = contractPrincipal.lastIndexOf(".");
  const contractAddress = contractPrincipal.slice(0, dot);
  const contractName = contractPrincipal.slice(dot + 1);
  return { contractAddress, contractName, tokenName };
}
function untilBurnHeightForCycles(cycles, poxInput) {
  if (!Number.isInteger(cycles) || cycles < 1 || cycles > 12) {
    throw new Error("cycles must be an integer between 1 and 12");
  }
  const pox = poxInput.data ?? poxInput;
  const P = Number(pox.next_cycle.prepare_phase_start_block_height);
  const Q = Number(pox.prepare_phase_block_length);
  const R = Number(pox.reward_phase_block_length);
  const cycleLen = Q + R;
  return P + cycles * cycleLen - 1;
}
function assertResultSuccess(result) {
  if (!result || result.error || !result.txid || result.reason) {
    const errorAndReason = result.error && result.reason ? `${result.error} - ${result.reason}` : result.error || result.reason || "unknown error";
    console.error(
      `Transaction broadcast failed: ${formatErrorMessage(errorAndReason)}`
    );
    return {
      success: false,
      error: formatErrorMessage(errorAndReason)
    };
  }
  return { success: true };
}
function isSafeToSubmit(poxInput, safetyBuffer = stacks_info.stacking.solo.safetyBlocks) {
  const raw = poxInput.data ?? poxInput;
  const current = Number(raw.current_burnchain_block_height ?? raw.currentBurnchainBlockHeight);
  const first = Number(raw.first_burnchain_block_height ?? raw.firstBurnchainBlockHeight);
  const prepLen = Number(raw.prepare_phase_block_length ?? raw.prepareCycleLength);
  const rewardLen = raw.reward_phase_block_length !== void 0 ? Number(raw.reward_phase_block_length) : Number(raw.rewardCycleLength) - prepLen;
  const cycleLen = rewardLen + prepLen;
  const rewardIndex = (current - first) % cycleLen;
  const safeEnd = cycleLen - prepLen;
  const blocksUntilBoundary = safeEnd - rewardIndex;
  const safe = blocksUntilBoundary > safetyBuffer;
  return { safe, blocksUntilBoundary, rewardIndex };
}
function btcAddressToPoxTuple(btcAddr) {
  const addr = btcAddr.trim();
  const { version, data } = (0, import_stacking.decodeBtcAddressBytes)(addr);
  return {
    version: Number(version),
    hashbytes: data
  };
}
function parseClarityErrCode(txResult) {
  const repr = txResult?.repr;
  if (typeof repr !== "string") return null;
  const m = repr.match(/^\(err\s+u?(\d+)\)$/);
  if (!m) return null;
  return Number(m[1]);
}

// src/services/stacks.service.ts
var StacksService = class {
  /**
   * @param testnet - Whether this is a testnet-class network (address versioning).
   * @param profile - Optional explicit network settings. When provided (by
   *   StacksSDK, the single owner of network resolution), the base URL,
   *   chain id, and magic bytes come from the resolved profile so this service and
   *   the PoX-5 client always describe the same chain. When omitted, falls back to
   *   env/default resolution for standalone use.
   */
  constructor(testnet = false, profile, hiroApiKey) {
    /**
     * Fetches the current PoX contract address and name.
     * @returns An object containing the PoX contract address and name
     */
    this.getPoxContractInfo = async () => {
      const poxResponse = await this.fetchPoxInfo();
      if (poxResponse?.data?.contract_id) {
        const [contractAddress, contractName] = poxResponse.data.contract_id.split(".");
        return { contractAddress, contractName };
      }
      return this.testnet ? poxInfo.testnet : poxInfo.mainnet;
    };
    /**
     * Formats a compressed secp256k1 public key hex into a Stacks address.
     * @param pubKey - The compressed secp256k1 public key in hex format.
     * @returns - The corresponding Stacks address.
     */
    this.formatAddress = (pubKey) => {
      try {
        if (!pubKey || typeof pubKey !== "string") {
          throw new Error("Public key must be a non-empty string");
        }
        if (!isCompressedSecp256k1PubKeyHex(pubKey)) {
          throw new Error("Invalid compressed secp256k1 public key hex format");
        }
        const address = (0, import_transactions2.publicKeyToAddress)(pubKey, this.network);
        return address;
      } catch (error) {
        console.error(
          "formatAddress : Error formatting address:",
          formatErrorMessage(error)
        );
        throw new Error(`Failed to format address: ${error}`);
      }
    };
    /**
     * Returns nonce information for the given address, accounting for pending mempool transactions.
     *
     * - confirmedNonce: the next nonce per on-chain confirmed state.
     * - pendingTxCount: number of this address's transactions currently in the mempool.
     * - nextAvailable: the first nonce not already taken by a pending tx (gap-aware).
     *   Use this when submitting a new transaction that should confirm as soon as possible.
     *
     * Note: if a pending tx is evicted from the mempool (e.g. fee too low), its nonce is freed
     * but nextAvailable will remain elevated until the confirmed nonce catches up.
     *
     * @param address - The Stacks address to query.
     */
    /**
     * Returns only the confirmed on-chain nonce, skipping the mempool scan.
     * @param address - The Stacks address to query.
     */
    this.getConfirmedNonce = async (address) => {
      try {
        const response = await this.axiosClient.get(`${this.stackBaseUrl}/v2/accounts/${address}?proof=0`);
        if (!response?.data || response.status !== 200) {
          throw new Error(`HTTP ${response.status}`);
        }
        return BigInt(response.data.nonce);
      } catch (error) {
        console.error(`Error fetching confirmed nonce: ${formatErrorMessage(error)}`);
        throw new Error(
          `Failed to fetch confirmed nonce for address ${address}: ${formatErrorMessage(error)}`
        );
      }
    };
    this.getAccountNonce = async (address) => {
      try {
        const pageSize = helperConstants.stacks_api_page_size;
        const nonceRequest = this.axiosClient.get(`${this.stackBaseUrl}/v2/accounts/${address}?proof=0`);
        const pendingNonces = /* @__PURE__ */ new Set();
        let pendingTxCount = 0;
        let offset = 0;
        while (true) {
          const mempoolResponse = await this.axiosClient.get(
            `${this.stackBaseUrl}/extended/v1/tx/mempool`,
            { params: { sender_address: address, limit: pageSize, offset } }
          );
          if (!mempoolResponse?.data || mempoolResponse.status !== 200) {
            throw new Error(`HTTP ${mempoolResponse.status}`);
          }
          const pending = mempoolResponse.data?.results ?? [];
          pendingTxCount += pending.length;
          for (const tx of pending) pendingNonces.add(BigInt(tx.nonce));
          if (pending.length < pageSize) break;
          offset += pageSize;
        }
        const nonceResponse = await nonceRequest;
        if (!nonceResponse?.data || nonceResponse.status !== 200) {
          throw new Error(`HTTP ${nonceResponse.status}`);
        }
        const confirmedNonce = BigInt(nonceResponse.data.nonce);
        let nextAvailable = confirmedNonce;
        while (pendingNonces.has(nextAvailable)) {
          nextAvailable++;
        }
        return { confirmedNonce, pendingTxCount, nextAvailable };
      } catch (error) {
        console.error(`Error fetching account nonce: ${formatErrorMessage(error)}`);
        throw new Error(
          `Failed to fetch account nonce for address ${address}: ${formatErrorMessage(error)}`
        );
      }
    };
    /**
     * Makes a call to the Stacks balances endpoint for a given address.
     * @param address - The Stacks address to query balances for.
     * @returns - The response from the balances endpoint.
     */
    this.makeBalanceCalls = async (address) => {
      try {
        const response = await this.axiosClient.get(
          `${this.stackBaseUrl}/extended/v2/addresses/${address}/balances/stx`
        );
        if (!response || !response.data || response.status !== 200) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response;
      } catch (error) {
        console.error(
          `Error calling Stacks balances endpoint: ${formatErrorMessage(error)}`
        );
        throw new Error(
          `Failed to call Stacks balances endpoint for address ${address}: ${formatErrorMessage(
            error
          )}`
        );
      }
    };
    /**
     * Retrieves the native STX balance for a given address from makeBalanceCalls response.
     * @param address - The Stacks address to query balance for.
     * @returns - The native STX balance.
     */
    this.getNativeBalance = async (address) => {
      try {
        const response = await this.makeBalanceCalls(address);
        const balance = Number(response.data.balance) / 10 ** stacks_info.stxDecimals;
        return balance;
      } catch (error) {
        console.error(
          "getNativeBalance : Error fetching native balance:",
          formatErrorMessage(error)
        );
        throw new Error(
          `Failed to fetch native balance for address ${address}: ${formatErrorMessage(
            error
          )}`
        );
      }
    };
    /**
     * Retrieves the fungible token balances for a given address from makeBalanceCalls response.
     * @param address - The Stacks address to query balances for.
     * @returns - The fungible token balances.
     */
    this.getFTBalancesForAddress = async (address) => {
      try {
        const result = {};
        let offset = 0;
        const limit = 100;
        while (true) {
          const response = await this.axiosClient.get(
            `${this.stackBaseUrl}/extended/v2/addresses/${address}/balances/ft`,
            { params: { limit, offset } }
          );
          if (!response || !response.data || response.status !== 200) {
            throw new Error(`HTTP ${response.status}`);
          }
          for (const item of response.data.results) {
            result[item.token] = { balance: item.balance };
          }
          if (offset + limit >= response.data.total) break;
          offset += limit;
        }
        return result;
      } catch (error) {
        console.error(
          "getFTBalancesForAddress : Error fetching fungible token balances:",
          formatErrorMessage(error)
        );
        throw new Error(
          `Failed to fetch FT balances for address ${address}: ${formatErrorMessage(
            error
          )}`
        );
      }
    };
    /**
     * Fetches the decimals for a given fungible token contract.
     * @param contractAddress - The address of the fungible token contract.
     * @param contractName - The name of the fungible token contract.
     * @returns - The number of decimals for the fungible token.
     */
    this.fetchFtDecimals = async (contractAddress, contractName) => {
      try {
        const network = this.network;
        const res = await (0, import_transactions2.fetchCallReadOnlyFunction)({
          contractName,
          contractAddress,
          functionName: "get-decimals",
          functionArgs: [],
          network,
          senderAddress: contractAddress
        });
        const val = res.value.value;
        return Number(val);
      } catch (error) {
        console.error("Error fetching FT decimals:", formatErrorMessage(error));
        throw new Error(
          `Failed to fetch FT decimals: ${formatErrorMessage(error)}`
        );
      }
    };
    /**
     * Estimates the transaction fee for STX transfer.
     * @param recipientAddress - The recipient's Stacks address.
     * @param amountUstx - The amount to transfer in microSTX (ustx).
     * @returns - The estimated transaction fee in microSTX (ustx).
     */
    this.estimateTxFee = async (recipientAddress, amountUstx) => {
      try {
        const payload = (0, import_transactions2.createTokenTransferPayload)(recipientAddress, amountUstx);
        const payloadHex = (0, import_transactions2.serializePayload)(payload);
        const [, medium] = await (0, import_transactions2.fetchFeeEstimateTransaction)({
          payload: payloadHex,
          network: this.network
        });
        return medium.fee;
      } catch (error) {
        console.error(
          "Error estimating transaction fee:",
          formatErrorMessage(error)
        );
        throw new Error(
          `Failed to estimate transaction fee: ${formatErrorMessage(error)}`
        );
      }
    };
    /**
     * Estimates the transaction fee for a contract call.
     * @param contractAddress - The address of the contract.
     * @param contractName - The name of the contract.
     * @param functionName - The name of the function to call.
     * @param functionArgs - The arguments to pass to the function.
     * @returns - The estimated transaction fee in microSTX (ustx).
     */
    this.estimateContractCallFee = async (contractAddress, contractName, functionName, functionArgs) => {
      try {
        const payload = (0, import_transactions2.createContractCallPayload)(
          contractAddress,
          contractName,
          functionName,
          functionArgs
        );
        const payloadHex = (0, import_transactions2.serializePayload)(payload);
        const [, medium] = await (0, import_transactions2.fetchFeeEstimateTransaction)({
          payload: payloadHex,
          network: this.network
        });
        return medium.fee;
      } catch (error) {
        console.error(
          "Error estimating contract call fee:",
          formatErrorMessage(error)
        );
        throw new Error(
          `Failed to estimate contract call fee: ${formatErrorMessage(error)}`
        );
      }
    };
    /**
     * Checks the delegation status of a given address.
     * @param address
     * @returns
     */
    this.checkDelegationStatus = async (address) => {
      try {
        if (!validateAddress(address, this.testnet)) {
          throw new Error("Invalid Stacks address");
        }
        const { contractAddress: poxAddr, contractName: poxName } = await this.getPoxContractInfo();
        const cv = await (0, import_transactions2.fetchCallReadOnlyFunction)({
          contractAddress: poxAddr,
          contractName: poxName,
          functionName: "get-delegation-info",
          functionArgs: [(0, import_transactions2.principalCV)(address)],
          network: this.network,
          senderAddress: address
        });
        if (!cv) {
          throw new Error("No response from get-delegation-info");
        }
        return (0, import_transactions2.cvToValue)(cv);
      } catch (error) {
        console.error(
          "Error checking delegation status:",
          formatErrorMessage(error)
        );
        throw new Error(
          `Failed to check delegation status: ${formatErrorMessage(error)}`
        );
      }
    };
    /**
     * Builds an unsigned transaction for STX transfer or fungible token transfer.
     * @param sender - The sender's Stacks address.
     * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
     * @param recipient - The recipient's Stacks address.
     * @param amount - The amount to transfer (in STX or token units).
     * @param type - The type of transaction (STX or FungibleToken).
     * @param token - The type of fungible token (required if type is FungibleToken).
     * @returns - The unsigned Stacks transaction.
     */
    this.buildUnsignedTransaction = async (sender, senderPublicKey, recipient, amount, type = "STX" /* STX */, token, customTokenContractAddress, customTokenContractName, customTokenAssetName, nonce, fee, memo) => {
      try {
        if (!validateAddress(recipient, this.testnet)) {
          throw new Error("Invalid recipient address");
        }
        if (!isCompressedSecp256k1PubKeyHex(senderPublicKey)) {
          throw new Error("Invalid compressed secp256k1 public key hex format");
        }
        if (type == "Fungible Token" /* FungibleToken */ && !token) {
          throw new Error(
            `Token type must be provided for fungible token transfers`
          );
        }
        if (token === "custom-token" /* CUSTOM */) {
          if (!customTokenContractAddress || !customTokenContractName || !customTokenAssetName) {
            throw new Error(
              `Custom token contract address, name, and asset name must be provided for CUSTOM token type`
            );
          }
        }
        const tokenInfo = getTokenInfo(token, this.testnet ? "testnet" : "mainnet");
        if (type === "Fungible Token" /* FungibleToken */ && token !== "custom-token" /* CUSTOM */ && !tokenInfo) {
          throw new Error(`Token ${token} is not supported on ${this.network}`);
        }
        let unsignedTx;
        if (type === "Fungible Token" /* FungibleToken */) {
          const ftContractAddress = token === "custom-token" /* CUSTOM */ ? customTokenContractAddress : tokenInfo.contractAddress;
          const ftContractName = token === "custom-token" /* CUSTOM */ ? customTokenContractName : tokenInfo.contractName;
          const ftAssetName = token === "custom-token" /* CUSTOM */ ? customTokenAssetName : tokenInfo.assetName;
          const postCondition = import_transactions2.Pc.principal(sender).willSendEq(amount).ft(`${ftContractAddress}.${ftContractName}`, ftAssetName);
          unsignedTx = await (0, import_transactions2.makeUnsignedContractCall)({
            contractAddress: ftContractAddress,
            contractName: ftContractName,
            functionName: "transfer",
            functionArgs: [
              (0, import_transactions2.uintCV)(amount),
              (0, import_transactions2.principalCV)(sender),
              (0, import_transactions2.principalCV)(recipient),
              (0, import_transactions2.noneCV)()
            ],
            publicKey: senderPublicKey,
            network: this.network,
            postConditionMode: import_transactions2.PostConditionMode.Deny,
            postConditions: [postCondition],
            ...nonce !== void 0 ? { nonce } : {},
            ...fee !== void 0 ? { fee } : {}
          });
        } else {
          unsignedTx = await (0, import_transactions2.makeUnsignedSTXTokenTransfer)({
            recipient,
            amount,
            publicKey: senderPublicKey,
            network: this.network,
            ...nonce !== void 0 ? { nonce } : {},
            ...fee !== void 0 ? { fee } : {},
            ...memo !== void 0 ? { memo } : {}
          });
        }
        return unsignedTx;
      } catch (error) {
        console.error(
          "Error building unsigned transaction:",
          formatErrorMessage(error)
        );
        throw new Error(
          `Failed to build unsigned transaction: ${formatErrorMessage(error)}`
        );
      }
    };
    /**
     *  Builds an unsigned contract call transaction.
     * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
     * @param contractAddress - The address of the contract.
     * @param contractName - The name of the contract.
     * @param functionName - The name of the function to call.
     * @param functionArgs - The arguments to pass to the function.
     * @returns - The unsigned Stacks contract call transaction.
     */
    this.buildUnsignedContractCall = async (senderPublicKey, contractAddress, contractName, functionName, functionArgs, nonce, postConditionMode, postConditions) => {
      try {
        if (!validateAddress(contractAddress, this.testnet)) {
          throw new Error("Invalid recipient address");
        }
        if (!isCompressedSecp256k1PubKeyHex(senderPublicKey)) {
          throw new Error("Invalid compressed secp256k1 public key hex format");
        }
        if (!contractName || !functionName) {
          throw new Error("Contract name and function name must be provided");
        }
        const unsignedContractCall = await (0, import_transactions2.makeUnsignedContractCall)({
          contractAddress,
          contractName,
          functionName,
          functionArgs,
          publicKey: senderPublicKey,
          network: this.network,
          postConditionMode: postConditionMode ?? import_transactions2.PostConditionMode.Deny,
          ...nonce !== void 0 ? { nonce } : {},
          ...postConditions !== void 0 ? { postConditions } : {}
        });
        return unsignedContractCall;
      } catch (error) {
        console.error(
          "Error building unsigned transaction:",
          formatErrorMessage(error)
        );
        throw new Error(
          `Failed to build unsigned transaction: ${formatErrorMessage(error)}`
        );
      }
    };
    /**
     * Serializes a transaction for STX transfer or fungible token transfer.
     * @param sender - The sender's Stacks address.
     * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
     * @param recipient - The recipient's Stacks address.
     * @param amount - The amount to transfer.
     * @param type - The type of transaction (STX or FungibleToken).
     * @param token - The type of fungible token (required if type is FungibleToken).
     * @returns - The serialized unsigned Stacks transaction and pre-signature hash.
     */
    this.serializeTransaction = async (sender, senderPublicKey, recipient, amount, type = "STX" /* STX */, token, customTokenContractAddress, customTokenContractName, customTokenAssetName, nonce, fee, memo) => {
      try {
        if (type == "Fungible Token" /* FungibleToken */ && !token) {
          throw new Error(
            "Token type must be provided for FungibleToken transactions"
          );
        }
        if (token === "custom-token" /* CUSTOM */) {
          if (!customTokenContractAddress || !customTokenContractName || !customTokenAssetName) {
            throw new Error(
              "Custom token contract address, name, and asset name must be provided for CUSTOM token type"
            );
          }
        }
        const unsignedTx = await this.buildUnsignedTransaction(
          sender,
          senderPublicKey,
          recipient,
          amount,
          type,
          token,
          customTokenContractAddress,
          customTokenContractName,
          customTokenAssetName,
          nonce,
          fee,
          memo
        );
        const sigHash = unsignedTx.signBegin();
        const preSignSigHash = (0, import_transactions2.sigHashPreSign)(
          sigHash,
          unsignedTx.auth.authType,
          unsignedTx.auth.spendingCondition.fee,
          unsignedTx.auth.spendingCondition.nonce
        );
        return { unsignedTx, preSignSigHash };
      } catch (error) {
        console.error(
          "Error serializing transaction:",
          formatErrorMessage(error)
        );
        throw new Error(
          `Failed to serialize transaction: ${formatErrorMessage(error)}`
        );
      }
    };
    /**
     *  Serializes a contract call transaction.
     * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
     * @param contractAddress - The address of the contract.
     * @param contractName - The name of the contract.
     * @param functionName - The name of the function to call.
     * @param functionArgs - The arguments to pass to the function.
     * @returns - The serialized unsigned Stacks contract call transaction and pre-signature hash.
     */
    this.serializeContractCall = async (senderPublicKey, contractAddress, contractName, functionName, functionArgs, nonce, fee, postConditions, postConditionMode) => {
      try {
        const unsignedContractCall = await this.buildUnsignedContractCall(
          senderPublicKey,
          contractAddress,
          contractName,
          functionName,
          functionArgs,
          nonce,
          postConditionMode,
          postConditions
        );
        if (fee !== void 0) {
          unsignedContractCall.auth.spendingCondition.fee = fee;
        }
        const sigHash = unsignedContractCall.signBegin();
        const preSignSigHash = (0, import_transactions2.sigHashPreSign)(
          sigHash,
          unsignedContractCall.auth.authType,
          unsignedContractCall.auth.spendingCondition.fee,
          unsignedContractCall.auth.spendingCondition.nonce
        );
        return { unsignedContractCall, preSignSigHash };
      } catch (error) {
        console.error(
          "Error serializing transaction:",
          formatErrorMessage(error)
        );
        throw new Error(
          `Failed to serialize transaction: ${formatErrorMessage(error)}`
        );
      }
    };
    /**
     *  Broadcasts a signed transaction to the Stacks network.
     * @param signedTransaction - The signed Stacks transaction to broadcast.
     * @returns - The result of the broadcast operation.
     */
    this.broadcastTransaction = async (signedTransaction, network) => {
      try {
        const result = await (0, import_transactions2.broadcastTransaction)({
          transaction: signedTransaction,
          network: network ?? this.network
        });
        return result;
      } catch (error) {
        console.error(
          "Error broadcasting transaction:",
          formatErrorMessage(error)
        );
        throw new Error(
          `Failed to broadcast transaction: ${formatErrorMessage(error)}`
        );
      }
    };
    /**
     *  Retrieves the status of a transaction from the Stacks network.
     * @param txid - The transaction ID to check the status for.
     * @returns - Json object containing transaction details.
     */
    this.getTxStatusById = async (txid) => {
      try {
        const response = await this.axiosClient.get(
          `${this.stackBaseUrl}/extended/v1/tx/${txid}`
        );
        if (!response || !response.data || response.status !== 200) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.data;
      } catch (error) {
        console.error(
          `Error getting transaction status: ${formatErrorMessage(error)}`
        );
        throw new Error(
          `Failed to get transaction status for txid ${txid}: ${formatErrorMessage(
            error
          )}`
        );
      }
    };
    /**
     * Parses a raw list of Stacks API transaction items into typed Transaction objects.
     */
    this.parseTransactionItems = async (items, address, isPending = false) => {
      const txs = [];
      for (const tx of items) {
        const base = {
          transaction_hash: tx.tx_id,
          timestamp: tx.block_time_iso,
          success: tx.tx_status === "success",
          ...isPending ? { pending: true } : {}
        };
        if (tx.tx_type === "token_transfer" && tx.token_transfer) {
          const amountMicro = BigInt(tx.token_transfer.amount || "0");
          const amount = Number(amountMicro) / 1e6;
          txs.push({
            type: "STX" /* STX */,
            sender: tx.sender_address,
            recipient: tx.token_transfer.recipient_address,
            amount,
            tokenName: void 0,
            tokenContractAddress: void 0,
            ...base
          });
          continue;
        }
        if (tx.tx_type === "contract_call" && tx.contract_call && tx.contract_call.function_name === "transfer" && Array.isArray(tx.contract_call.function_args) && tx.contract_call.function_args.length >= 3) {
          const [amountArg, senderArg, recipientArg] = tx.contract_call.function_args;
          const amountRepr = amountArg?.repr;
          const senderRepr = senderArg?.repr;
          const recipientRepr = recipientArg?.repr;
          const rawAmount = amountRepr && amountRepr.startsWith("u") ? amountRepr.slice(1) : "0";
          const sender = senderRepr && senderRepr.startsWith("'") ? senderRepr.slice(1) : tx.sender_address;
          const recipient = recipientRepr && recipientRepr.startsWith("'") ? recipientRepr.slice(1) : address;
          const contractId = tx.contract_call.contract_id;
          const contractName = contractId.split(".").slice(-1)[0];
          const contractAddress = contractId.split(".")[0];
          let decimals = getDecimalsFromFtInfo(contractId);
          if (decimals == 0) {
            decimals = await this.fetchFtDecimals(contractAddress, contractName);
          }
          const amountInt = BigInt(rawAmount);
          const amount = decimals > 0 ? Number(amountInt) / 10 ** decimals : Number(amountInt);
          txs.push({
            type: "Fungible Token" /* FungibleToken */,
            tokenName: contractName,
            tokenContractAddress: contractId,
            sender,
            recipient,
            amount,
            ...base
          });
          continue;
        }
      }
      return txs;
    };
    /**
     * Fetches one page of confirmed transactions for a given address.
     * Pagination is handled by the caller.
     * @param address - The Stacks address.
     * @param limit - Page size (max 50).
     * @param offset - Page offset.
     * @returns An array of parsed transactions for this page.
     */
    this.getTransactionHistory = async (address, limit = helperConstants.stacks_api_page_size, offset = pagination_defaults.page) => {
      if (!validateAddress(address, this.testnet)) {
        throw new Error("Invalid Stacks address");
      }
      try {
        const pageSize = Math.min(limit, helperConstants.stacks_api_page_size);
        const response = await this.axiosClient.get(
          `${this.stackBaseUrl}/extended/v1/address/${address}/transactions?limit=${pageSize}&offset=${offset}`
        );
        if (!response || !response.data || response.status !== 200) {
          throw new Error(`HTTP ${response.status}`);
        }
        const items = response.data.results || [];
        return await this.parseTransactionItems(items, address);
      } catch (error) {
        throw new Error(
          `Failed to fetch transaction history: ${formatErrorMessage(error)}`
        );
      }
    };
    /**
     * Fetches one page of pending (mempool) transactions for a given address.
     * Pagination is handled by the caller.
     * @param address - The Stacks address.
     * @param limit - Page size (max 50).
     * @param offset - Page offset.
     * @returns An array of parsed pending transactions for this page.
     */
    this.getMempoolTransactions = async (address, limit = helperConstants.stacks_api_page_size, offset = pagination_defaults.page) => {
      if (!validateAddress(address, this.testnet)) {
        throw new Error("Invalid Stacks address");
      }
      try {
        const pageSize = Math.min(limit, helperConstants.stacks_api_page_size);
        const response = await this.axiosClient.get(
          `${this.stackBaseUrl}/extended/v1/tx/mempool?sender_address=${address}&limit=${pageSize}&offset=${offset}`
        );
        if (!response || !response.data || response.status !== 200) {
          throw new Error(`HTTP ${response.status}`);
        }
        const items = response.data.results || [];
        return await this.parseTransactionItems(items, address, true);
      } catch (error) {
        throw new Error(
          `Failed to fetch mempool transactions: ${formatErrorMessage(error)}`
        );
      }
    };
    /**
     *  Fetches PoX contract information from the Stacks network.
     * @returns - The PoX contract information.
     */
    this.fetchPoxInfo = async () => {
      try {
        const response = await this.axiosClient.get(
          `${this.stackBaseUrl}/v2/pox`
        );
        if (!response || !response.data || response.status !== 200) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response;
      } catch (error) {
        console.error(`Error fetching pox info: ${formatErrorMessage(error)}`);
        throw new Error(`Failed to fetch PoX info from network: ${formatErrorMessage(error)}`);
      }
    };
    /**
     * Delegates STX to a specified address for a given lock period.
     * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
     * @param delegateTo - The address to delegate STX to.
     * @param amount - The amount of STX to delegate (in microSTX).
     * @param lockPeriod - Number of cycles to lock the delegation for.
     * @returns - The unsigned delegate STX transaction.
     */
    this.delegateStx = async (senderPublicKey, delegateTo, amount, lockPeriod, nonce, poolContractName) => {
      try {
        if (!validateAddress(delegateTo, this.testnet)) {
          throw new Error("Invalid delegateTo address");
        }
        if (!isCompressedSecp256k1PubKeyHex(senderPublicKey)) {
          throw new Error("Invalid compressed secp256k1 public key hex format");
        }
        const poxResponse = await this.fetchPoxInfo();
        const { contractAddress: poxAddr, contractName: poxName } = await this.getPoxContractInfo();
        if (!poxResponse || !poxResponse.data || poxResponse.status !== 200) {
          throw new Error("Failed to fetch PoX contract info from the network");
        }
        const until_burn_ht = await untilBurnHeightForCycles(
          lockPeriod,
          poxResponse
        );
        const serializedContractCall = await this.serializeContractCall(
          senderPublicKey,
          poxAddr,
          poxName,
          "delegate-stx",
          [
            (0, import_transactions2.uintCV)(amount),
            poolContractName ? (0, import_transactions2.contractPrincipalCV)(delegateTo, poolContractName) : (0, import_transactions2.standardPrincipalCV)(delegateTo),
            (0, import_transactions2.someCV)((0, import_transactions2.uintCV)(until_burn_ht)),
            (0, import_transactions2.noneCV)()
          ],
          nonce
        );
        return serializedContractCall;
      } catch (error) {
        console.error(
          "Error building delegate STX transaction:",
          formatErrorMessage(error)
        );
        throw new Error(
          `Failed to build delegate STX transaction: ${formatErrorMessage(error)}`
        );
      }
    };
    /**
     * Revokes STX delegation.
     * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
     * @returns - The unsigned revoke delegation transaction.
     */
    this.revokeStxDelegation = async (senderPublicKey, nonce) => {
      try {
        if (!isCompressedSecp256k1PubKeyHex(senderPublicKey)) {
          throw new Error("Invalid compressed secp256k1 public key hex format");
        }
        const { contractAddress: poxAddr, contractName: poxName } = await this.getPoxContractInfo();
        const serializedContractCall = await this.serializeContractCall(
          senderPublicKey,
          poxAddr,
          poxName,
          "revoke-delegate-stx",
          [],
          nonce
        );
        return serializedContractCall;
      } catch (error) {
        console.error(
          "Error building revoke STX delegation transaction:",
          formatErrorMessage(error)
        );
        throw new Error(
          `Failed to build revoke STX delegation transaction: ${formatErrorMessage(error)}`
        );
      }
    };
    /**
     * Allows the delegatee to call pox contract to lock delegated STX on the delegater's behalf.
     * @param senderPublicKey - The sender's compressed secp256k1 public key in hex format.
     * @param delegateTo - The address to delegate STX to.
     * @param amount - The amount of STX to delegate (in microSTX).
     * @param lockPeriod - Number of cycles to lock the delegation for.
     * @returns - The unsigned delegate STX transaction.
     */
    this.allowPoxContractCaller = async (senderPublicKey, poolAddress, poolContractName, nonce) => {
      try {
        if (!validateAddress(poolAddress, this.testnet)) {
          throw new Error("Invalid pool address");
        }
        if (!isCompressedSecp256k1PubKeyHex(senderPublicKey)) {
          throw new Error("Invalid compressed secp256k1 public key hex format");
        }
        if (!poolContractName) {
          throw new Error("Pool contract name must be provided");
        }
        const { contractAddress: poxAddr, contractName: poxName } = await this.getPoxContractInfo();
        const serializedContractCall = await this.serializeContractCall(
          senderPublicKey,
          poxAddr,
          poxName,
          "allow-contract-caller",
          [(0, import_transactions2.contractPrincipalCV)(poolAddress, poolContractName), (0, import_transactions2.noneCV)()],
          nonce
        );
        return serializedContractCall;
      } catch (error) {
        console.error(
          "Error building allow contract caller transaction:",
          formatErrorMessage(error)
        );
        throw new Error(
          `Failed to allow contract caller: ${formatErrorMessage(error)}`
        );
      }
    };
    /**
     * Solo stacks STX on Stacks PoX to earn rewards directly.
     * @param senderPublicKey
     * @param address
     * @param amountUstx
     * @param btcRewardAddress
     * @param lockPeriod
     * @param maxAmountUstx
     * @param authId
     * @returns the unsigned solo stack transaction.
     */
    this.soloStack = async (senderPublicKey, signerKey, amountUstx, btcRewardAddress, lockPeriod, maxAmountUstx, signerSig65Hex, startBurnHeight, authId, nonce) => {
      try {
        if (!isCompressedSecp256k1PubKeyHex(senderPublicKey)) {
          throw new Error("Invalid compressed secp256k1 public key hex format");
        }
        const { contractAddress: poxAddr, contractName: poxName } = await this.getPoxContractInfo();
        const { version, hashbytes } = btcAddressToPoxTuple(btcRewardAddress);
        const serializedContractCall = await this.serializeContractCall(
          senderPublicKey,
          poxAddr,
          poxName,
          "stack-stx",
          [
            (0, import_transactions2.uintCV)(amountUstx),
            (0, import_transactions2.tupleCV)({
              version: (0, import_transactions2.bufferCV)(Uint8Array.from([version])),
              hashbytes: (0, import_transactions2.bufferCV)(hashbytes)
            }),
            (0, import_transactions2.uintCV)(startBurnHeight),
            (0, import_transactions2.uintCV)(lockPeriod),
            (0, import_transactions2.someCV)((0, import_transactions2.bufferCV)(Buffer.from(signerSig65Hex, "hex"))),
            (0, import_transactions2.bufferCV)(Buffer.from(signerKey, "hex")),
            (0, import_transactions2.uintCV)(maxAmountUstx),
            (0, import_transactions2.uintCV)(authId)
          ],
          nonce
        );
        return serializedContractCall;
      } catch (error) {
        console.error(
          "Error building solo stack transaction:",
          formatErrorMessage(error)
        );
        throw new Error(`Failed to solo stack: ${formatErrorMessage(error)}`);
      }
    };
    /**
     * Increases the amount of STX in an existing solo stacking position.
     * @param senderPublicKey - Public key of the transaction sender
     * @param signerKey - Signer public key (33-byte compressed hex)
     * @param increaseBy - Amount of microSTX to add to existing stack
     * @param maxAmountUstx - Maximum total amount of microSTX to be stacked after increase 
     * @param signerSig65Hex - 65-byte signer signature (hex)
     * @param authId - Random integer for replay protection (must match signature)
     * @returns the unsigned stack-increase transaction.
     */
    this.increaseStackedStx = async (senderPublicKey, signerKey, increaseBy, maxAmountUstx, signerSig65Hex, authId, nonce) => {
      try {
        if (!isCompressedSecp256k1PubKeyHex(senderPublicKey)) {
          throw new Error("Invalid compressed secp256k1 public key hex format");
        }
        const { contractAddress: poxAddr, contractName: poxName } = await this.getPoxContractInfo();
        const serializedContractCall = await this.serializeContractCall(
          senderPublicKey,
          poxAddr,
          poxName,
          "stack-increase",
          [
            (0, import_transactions2.uintCV)(increaseBy),
            // increase-by
            (0, import_transactions2.someCV)((0, import_transactions2.bufferCV)(Buffer.from(signerSig65Hex, "hex"))),
            // signer-sig
            (0, import_transactions2.bufferCV)(Buffer.from(signerKey, "hex")),
            // signer-key
            (0, import_transactions2.uintCV)(maxAmountUstx),
            // max-amount
            (0, import_transactions2.uintCV)(authId)
            // auth-id
          ],
          nonce
        );
        return serializedContractCall;
      } catch (error) {
        console.error(
          "Error building stack-increase transaction:",
          formatErrorMessage(error)
        );
        throw new Error(
          `Failed to increase stacked STX: ${formatErrorMessage(error)}`
        );
      }
    };
    /**
    * Extends the stacking period of an existing solo stacking position.
    * @param senderPublicKey - Public key of the transaction sender
    * @param signerKey - Signer public key (33-byte compressed hex)
    * @param extendCycles - cycles to extend the stacking period by
    * @param maxAmountUstx - Maximum total amount of microSTX to be stacked
    * @param signerSig65Hex - 65-byte signer signature (hex)
    * @param authId - Random integer for replay protection (must match signature)
    * @returns the unsigned stack-extend transaction.
    */
    this.extendStackingPeriod = async (senderPublicKey, signerKey, btcRewardAddress, extendCycles, maxAmountUstx, signerSig65Hex, authId, nonce) => {
      try {
        if (!isCompressedSecp256k1PubKeyHex(senderPublicKey)) {
          throw new Error("Invalid compressed secp256k1 public key hex format");
        }
        const { contractAddress: poxAddr, contractName: poxName } = await this.getPoxContractInfo();
        const { version, hashbytes } = btcAddressToPoxTuple(btcRewardAddress);
        const serializedContractCall = await this.serializeContractCall(
          senderPublicKey,
          poxAddr,
          poxName,
          "stack-extend",
          [
            (0, import_transactions2.uintCV)(extendCycles),
            // extend-cycles
            (0, import_transactions2.tupleCV)({
              // 2. pox-addr
              version: (0, import_transactions2.bufferCV)(Uint8Array.from([version])),
              hashbytes: (0, import_transactions2.bufferCV)(hashbytes)
            }),
            (0, import_transactions2.someCV)((0, import_transactions2.bufferCV)(Buffer.from(signerSig65Hex, "hex"))),
            // signer-sig
            (0, import_transactions2.bufferCV)(Buffer.from(signerKey, "hex")),
            // signer-key
            (0, import_transactions2.uintCV)(maxAmountUstx),
            // max-amount
            (0, import_transactions2.uintCV)(authId)
            // auth-id
          ],
          nonce
        );
        return serializedContractCall;
      } catch (error) {
        console.error(
          "Error building stack-extend transaction:",
          formatErrorMessage(error)
        );
        throw new Error(
          `Failed to extend stacking period: ${formatErrorMessage(error)}`
        );
      }
    };
    /**
     * Serializes a generic contract call to a given contract address and name with specified function and arguments.
     * @param senderPublicKey - The compressed secp256k1 public key in hex format of the transaction sender.
     * @param contractAddress - The address of the contract to call.
     * @param contractName - The name of the contract to call.
     * @param functionName - The name of the function to call on the contract.
     * @param functionArgs - The arguments to pass to the contract function - must be an array of ClarityValue objects in the same order and types as the function parameters.
     * @returns the serialized unsigned contract call transaction and pre-signature hash.
     */
    this.makeContractCall = async (senderPublicKey, contractAddress, contractName, functionName, functionArgs, postConditions, postConditionMode) => {
      try {
        if (!isCompressedSecp256k1PubKeyHex(senderPublicKey)) {
          throw new Error("Invalid compressed secp256k1 public key hex format");
        }
        const serializedContractCall = await this.serializeContractCall(
          senderPublicKey,
          contractAddress,
          contractName,
          functionName,
          functionArgs,
          void 0,
          void 0,
          postConditions,
          postConditionMode
        );
        return serializedContractCall;
      } catch (error) {
        console.error(
          "Error building contract call transaction:",
          formatErrorMessage(error)
        );
        throw new Error(`Failed to make contract call: ${formatErrorMessage(error)}`);
      }
    };
    /**
     * Fetches contract call transactions for an address, excluding STX and FT transfers.
     * @param address - The Stacks address to query.
     * @param limit - The maximum number of transactions to retrieve.
     * @param offset - The offset for pagination.
     * @returns An array of contract call transactions.
     */
    this.getContractCallHistory = async (address, limit = pagination_defaults.limit, offset = pagination_defaults.page) => {
      if (!validateAddress(address, this.network === import_network.STACKS_TESTNET)) {
        throw new Error("Invalid Stacks address");
      }
      try {
        const allTxs = [];
        let currentOffset = offset;
        while (allTxs.length < limit) {
          const pageSize = helperConstants.stacks_api_page_size;
          const response = await this.axiosClient.get(
            `${this.stackBaseUrl}/extended/v1/address/${address}/transactions?limit=${pageSize}&offset=${currentOffset}`
          );
          if (!response || !response.data || response.status !== 200) {
            throw new Error(`HTTP ${response.status}`);
          }
          const items = response.data.results || [];
          if (items.length === 0) break;
          for (const tx of items) {
            if (tx.tx_type !== "contract_call" || !tx.contract_call) {
              continue;
            }
            const fn = tx.contract_call.function_name;
            const args = tx.contract_call.function_args;
            if (fn === "transfer" && Array.isArray(args) && args.length >= 3) {
              continue;
            }
            const contractId = tx.contract_call.contract_id;
            const dotIdx = contractId.indexOf(".");
            const contractAddress = dotIdx !== -1 ? contractId.substring(0, dotIdx) : contractId;
            const contractName = dotIdx !== -1 ? contractId.substring(dotIdx + 1) : "";
            allTxs.push({
              transaction_hash: tx.tx_id,
              timestamp: tx.block_time_iso,
              success: tx.tx_status === "success",
              sender: tx.sender_address,
              contractId,
              contractAddress,
              contractName,
              functionName: fn,
              functionArgs: Array.isArray(args) ? args.map((a) => ({
                name: a.name ?? "",
                type: a.type ?? "",
                repr: a.repr ?? ""
              })) : []
            });
          }
          if (items.length < pageSize) break;
          currentOffset += pageSize;
        }
        return allTxs.slice(0, limit);
      } catch (error) {
        throw new Error(
          `Failed to fetch contract call history: ${formatErrorMessage(error)}`
        );
      }
    };
    this.testnet = testnet;
    this.axiosClient = import_axios.default.create();
    if (hiroApiKey) {
      this.axiosClient.defaults.headers["x-hiro-api-key"] = hiroApiKey;
    }
    const baseUrl = profile?.baseUrl || process.env.STACKS_API_URL || (testnet ? api_constants.stacks_testnet_rpc : api_constants.stacks_mainnet_rpc);
    this.stackBaseUrl = baseUrl;
    const defaultNetwork = testnet ? import_network.STACKS_TESTNET : import_network.STACKS_MAINNET;
    this.network = {
      ...defaultNetwork,
      ...profile ? { chainId: profile.chainId, magicBytes: profile.magicBytes } : {},
      client: { baseUrl }
    };
  }
};

// src/services/fireblocks.service.ts
var import_ts_sdk3 = require("@fireblocks/ts-sdk");

// src/config.ts
var import_clientConfiguration = require("@fireblocks/ts-sdk/dist/client/clientConfiguration");
var import_dotenv = __toESM(require("dotenv"));
import_dotenv.default.config();
var config = {
  port: Number(process.env.PORT) || 3e3,
  fireblocks: {
    BASE_PATH: process.env.FIREBLOCKS_BASE_PATH || "",
    API_KEY: process.env.FIREBLOCKS_API_KEY || ""
  },
  network: process.env.NETWORK === "testnet" ? "testnet" : "mainnet"
};
var env = {
  FIREBLOCKS_API_KEY: process.env.FIREBLOCKS_API_KEY ?? "",
  FIREBLOCKS_SECRET_KEY_PATH: process.env.FIREBLOCKS_SECRET_KEY_PATH ?? "",
  FIREBLOCKS_BASE_PATH: process.env.FIREBLOCKS_BASE_PATH ?? import_clientConfiguration.BasePath.US,
  POOL_MAX_SIZE: parseInt(process.env.POOL_MAX_SIZE ?? "100", 10),
  POOL_IDLE_TIMEOUT_MS: parseInt(
    process.env.POOL_IDLE_TIMEOUT_MS ?? "1800000",
    10
  ),
  POOL_CLEANUP_INTERVAL_MS: parseInt(
    process.env.POOL_CLEANUP_INTERVAL_MS ?? "300000",
    10
  ),
  NETWORK: (process.env.NETWORK ?? "").toLowerCase(),
  TESTNET: (process.env.NETWORK ?? "").toLowerCase() === "testnet",
  EARLY_EXIT_SIGNER_URL: process.env.EARLY_EXIT_SIGNER_URL ?? ""
};

// src/services/fireblocks.service.ts
var import_fs = __toESM(require("fs"));

// src/utils/fireblocks.utils.ts
var import_ts_sdk = require("@fireblocks/ts-sdk");
var fs = __toESM(require("fs"));
var validateApiCredentials = (apiKey, secretKeyOrPem, vaultAccountId) => {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidV4Regex.test(apiKey)) {
    throw new Error("API key is not a valid UUID v4.");
  }
  const looksLikePem = secretKeyOrPem.includes("-----BEGIN") && secretKeyOrPem.includes("PRIVATE KEY");
  if (!looksLikePem) {
    if (!fs.existsSync(secretKeyOrPem) || !fs.statSync(secretKeyOrPem).isFile()) {
      throw new Error(
        `Secret key file does not exist at path: ${secretKeyOrPem}`
      );
    }
  }
  if (vaultAccountId !== void 0) {
    if (typeof vaultAccountId !== "number" && (typeof vaultAccountId !== "string" || isNaN(Number(vaultAccountId)) || vaultAccountId.trim() === "")) {
      throw new Error(
        "vaultAccountId must be a number or a string representing a number."
      );
    }
  }
};
var getPublicKeyForDerivationPath = async (fireblocksSDK, vaultAccountId, testnet) => {
  const requestParams = {
    derivationPath: `[${derivationPath.purpose}, ${testnet ? derivationPath.coinTypeTestnet : derivationPath.coinTypeMainnet}, ${vaultAccountId}, ${derivationPath.change}, ${derivationPath.addressIndex}]`,
    algorithm: import_ts_sdk.SignedMessageAlgorithmEnum.EcdsaSecp256K1,
    compressed: true
  };
  try {
    const response = await fireblocksSDK.vaults.getPublicKeyInfo(requestParams);
    const publicKey = response.data.publicKey;
    if (!publicKey) {
      throw new Error("Public key not found for the given vault account ID.");
    }
    return publicKey;
  } catch (error) {
    throw new Error(`Error fetching public key: ${formatErrorMessage(error)}`);
  }
};
var checkWalletExistsInVault = async (vaultID, assetId, fireblocksSDK) => {
  const id = typeof vaultID === "string" ? Number(vaultID) : vaultID;
  if (!Number.isInteger(id) || id < 0) {
    throw new Error("vaultID must be a valid non-negative integer.");
  }
  try {
    const response = await fireblocksSDK.vaults.getVaultAccountAsset({
      vaultAccountId: String(id),
      assetId
    });
    if (response && response.data) {
      return true;
    }
    return false;
  } catch (error) {
    if (error.message === "Not found") {
      return false;
    }
    throw error;
  }
};
var createAssetWalletInVault = async (vaultID, assetId, fireblocksSDK) => {
  const id = typeof vaultID === "string" ? Number(vaultID) : vaultID;
  if (!Number.isInteger(id) || id < 0) {
    throw new Error("vaultID must be a valid non-negative integer.");
  }
  try {
    const response = await fireblocksSDK.vaults.createVaultAccountAsset({
      vaultAccountId: String(id),
      assetId
    });
    if (!response || !response.data || response.statusCode !== 200) {
      throw new Error(
        `Create asset wallet in vault failed: No response data received.`
      );
    }
  } catch (error) {
    throw new Error(
      `Failed to create asset wallet in vault: code: $ ${error.data.code}, Message: ${error.data.message || error}`
    );
  }
};

// src/utils/FireblocksSigner.ts
var import_crypto = require("crypto");
var import_ts_sdk2 = require("@fireblocks/ts-sdk");
var POLL_INITIAL_MS = 3e3;
var POLL_CEILING_MS = 3e4;
var POLL_TIMEOUT_MS = 30 * 60 * 1e3;
var FireblocksSigner = class {
  constructor(fireblocks) {
    this.fireblocks = fireblocks;
    this.createTransactionPayload = (externalTxId) => {
      return {
        note: "raw signing for stacks-fireblocks-sdk",
        externalTxId,
        source: {
          type: import_ts_sdk2.TransferPeerPathType.VaultAccount
        },
        operation: import_ts_sdk2.TransactionOperation.Raw,
        extraParameters: {
          rawMessageData: {
            messages: [{}],
            algorithm: import_ts_sdk2.SignedMessageAlgorithmEnum.EcdsaSecp256K1
          }
        }
      };
    };
    this.getTxStatus = async (txId) => {
      let response = await this.fireblocks.transactions.getTransaction({ txId });
      let tx = response.data;
      const deadline = Date.now() + POLL_TIMEOUT_MS;
      let delay = POLL_INITIAL_MS;
      while (tx.status !== import_ts_sdk2.TransactionStateEnum.Completed) {
        switch (tx.status) {
          case import_ts_sdk2.TransactionStateEnum.Blocked:
          case import_ts_sdk2.TransactionStateEnum.Cancelled:
          case import_ts_sdk2.TransactionStateEnum.Failed:
          case import_ts_sdk2.TransactionStateEnum.Rejected:
            throw new Error(
              `Signing request failed/blocked/cancelled: Transaction: ${tx.id} status is ${tx.status}`
            );
        }
        if (Date.now() + delay > deadline) {
          throw new Error(
            `Signing request timed out after 30 minutes: Transaction ${tx.id} is still ${tx.status}`
          );
        }
        console.log(`Transaction ${tx.id} is currently at status - ${tx.status}`);
        await new Promise((resolve2) => setTimeout(resolve2, delay));
        delay = Math.min(delay * 2, POLL_CEILING_MS);
        try {
          response = await this.fireblocks.transactions.getTransaction({ txId });
          tx = response.data;
        } catch (pollError) {
          console.warn(`Transient error polling transaction ${txId}, will retry:`, pollError);
        }
      }
      return tx;
    };
    this.rawSign = async (content, vaultAccountId, txNote, testnet = false, externalId) => {
      try {
        if (typeof content !== "string") {
          throw new Error("Content for raw signing must be a hex string");
        }
        const hexContent = content.startsWith("0x") ? content.slice(2) : content;
        const transactionPayload = this.createTransactionPayload(externalId ?? (0, import_crypto.randomUUID)());
        if (txNote) {
          transactionPayload.note = txNote;
        }
        transactionPayload.extraParameters.rawMessageData = {
          messages: [
            {
              content: hexContent,
              derivationPath: [
                derivationPath.purpose,
                testnet ? derivationPath.coinTypeTestnet : derivationPath.coinTypeMainnet,
                Number(vaultAccountId),
                derivationPath.change,
                derivationPath.addressIndex
              ]
            }
          ],
          algorithm: import_ts_sdk2.SignedMessageAlgorithmEnum.EcdsaSecp256K1
        };
        const transactionResponse = await this.fireblocks.transactions.createTransaction({
          transactionRequest: transactionPayload
        });
        const txId = transactionResponse.data.id;
        if (!txId) {
          throw new Error("Transaction ID is undefined.");
        }
        const txInfo = await this.getTxStatus(txId);
        const signature = txInfo.signedMessages[0].signature;
        return signature;
      } catch (error) {
        console.log(`Caught error in rawSign: ${error}`);
        throw new Error(`Error in rawSign: ${formatErrorMessage(error)}`);
      }
    };
  }
};

// src/services/fireblocks.service.ts
var secretKeyPath = process.env.FIREBLOCKS_SECRET_KEY_PATH || "";
var basePath = process.env.FIREBLOCKS_BASE_PATH || import_ts_sdk3.BasePath.US;
var FireblocksService = class {
  constructor(fireblocksConfig) {
    this.testnet = false;
    /**
     * @returns The initialized Fireblocks SDK instance of this Service class.
     */
    this.getFireblocksSDK = () => {
      return this.fireblocksSDK;
    };
    /**
     * Retrieves the public key associated with a given Fireblocks vault ID.
     *
     * This method converts the provided `vaultID` to a non-negative integer, validates it,
     * and then retrieves the corresponding public key using the Fireblocks SDK.
     *
     * @param vaultID - The Fireblocks vault ID as a string or number. Must be a valid non-negative integer.
     * @returns A promise that resolves to the public key as a string.
     * @throws {Error} If the vault ID is invalid or if any error occurs during the process.
     */
    this.getPublicKeyByVaultID = async (vaultID) => {
      const id = typeof vaultID === "string" ? Number(vaultID) : vaultID;
      if (!Number.isInteger(id) || id < 0) {
        throw new Error("vaultID must be a valid non-negative integer.");
      }
      try {
        const publicKey = await getPublicKeyForDerivationPath(
          this.fireblocksSDK,
          vaultID.toString(),
          this.testnet
        );
        return publicKey;
      } catch (error) {
        throw new Error(
          `Failed to get public key by vault ID: ${formatErrorMessage(error)}`
        );
      }
    };
    /**
     * Ensures a BTC (or BTC_TEST) wallet exists in the given Fireblocks vault ID.
     * @param vaultID - The Fireblocks vault ID as a string or number. Must be a valid non-negative integer.
     * @throws {Error} If the vault ID is invalid or if any error occurs during the process.
     */
    this.ensureBtcWalletExists = async (vaultID) => {
      const id = typeof vaultID === "string" ? Number(vaultID) : vaultID;
      if (!Number.isInteger(id) || id < 0) {
        throw new Error("vaultID must be a valid non-negative integer.");
      }
      try {
        const assetId = this.testnet ? "BTC_TEST" : "BTC";
        const walletExists = await checkWalletExistsInVault(
          id,
          assetId,
          this.fireblocksSDK
        );
        if (!walletExists) {
          await createAssetWalletInVault(id, assetId, this.fireblocksSDK);
        }
      } catch (error) {
        throw new Error(
          `Failed to ensure BTC wallet exists for vault ID ${vaultID}: ${formatErrorMessage(error)}`
        );
      }
    };
    /**
     * Retrieves the public key associated with a given Fireblocks vault ID.
     *
     * This method converts the provided `vaultID` to a non-negative integer, validates it,
     * and then retrieves the corresponding public key using the Fireblocks SDK.
     *
     * @param vaultID - The Fireblocks vault ID as a string or number. Must be a valid non-negative integer.
     * @returns A promise that resolves to the public key as a string.
     * @throws {Error} If the vault ID is invalid or if any error occurs during the process.
     */
    this.getBtcSegwitAddressForVaultID = async (vaultID) => {
      const id = typeof vaultID === "string" ? Number(vaultID) : vaultID;
      if (!Number.isInteger(id) || id < 0) {
        throw new Error("vaultID must be a valid non-negative integer.");
      }
      try {
        const assetId = this.testnet ? "BTC_TEST" : "BTC";
        await this.ensureBtcWalletExists(id);
        const assetAdresses = await this.fireblocksSDK.vaults.getVaultAccountAssetAddressesPaginated({
          vaultAccountId: String(id),
          assetId
        });
        if (!assetAdresses || !assetAdresses.data || !assetAdresses.data.addresses) {
          throw new Error("No addresses found for the given vault account ID.");
        }
        for (const addrObj of assetAdresses.data.addresses) {
          if (addrObj.type === "Permanent" && addrObj.addressFormat === "SEGWIT") {
            return addrObj.address;
          }
        }
        throw new Error(
          "No Segwit address found for the given vault account ID."
        );
      } catch (error) {
        throw error instanceof Error ? error : new Error(formatErrorMessage(error));
      }
    };
    /**
     * Signs a transaction with the given vault account ID using the Fireblocks SDK and Fireblocks-signer.
     *
     * This method prepares and sends a transaction from the specified sender to the recipient
     * // descripe parameters
     * @param content - The content of the transaction to sign.
     * @param vaultAccountId - The Fireblocks vault account ID as a string or number.
     * @param txNote - An optional note for the transaction.
     * @returns A promise that resolves to the signature when the transaction is successfully signed.
     * @throws {Error} If any parameter is invalid or if the transaction fails.
     **/
    this.createBitcoinTransaction = async (destination, amountSats, vaultAccountId, note, externalId, onSubmitted) => {
      const assetId = this.testnet ? "BTC_TEST" : "BTC";
      const whole = amountSats / BigInt(1e8);
      const frac = (amountSats % BigInt(1e8)).toString().padStart(8, "0");
      const amountBtc = `${whole.toString()}.${frac}`;
      const response = await this.fireblocksSDK.transactions.createTransaction({
        transactionRequest: {
          operation: import_ts_sdk3.TransactionOperation.Transfer,
          assetId,
          source: { type: import_ts_sdk3.TransferPeerPathType.VaultAccount, id: String(vaultAccountId) },
          destination: { type: import_ts_sdk3.TransferPeerPathType.OneTimeAddress, oneTimeAddress: { address: destination } },
          amount: amountBtc,
          note: note || "BTC bond lock",
          externalTxId: externalId
        }
      });
      const fireblocksId = response.data.id;
      if (!fireblocksId) throw new Error("Fireblocks BTC transaction creation returned no ID");
      await onSubmitted?.(fireblocksId);
      const btcTxid = await this.awaitBitcoinTransaction(fireblocksId);
      return { fireblocksId, btcTxid };
    };
    /**
     * Polls an already-submitted Fireblocks BTC transfer (by its Fireblocks id) to
     * completion and returns its Bitcoin txid. Used to resume a funding attempt whose
     * confirmation poll timed out or crashed after the transfer was accepted.
     */
    this.awaitBitcoinTransaction = async (fireblocksId) => {
      const completedTx = await this.fireblocksSigner.getTxStatus(fireblocksId);
      const btcTxid = completedTx.txHash;
      if (!btcTxid) throw new Error(`BTC transaction ${fireblocksId} completed but has no txHash`);
      return btcTxid;
    };
    /**
     * Looks up a prior BTC transfer by its external id (the deterministic funding id) and
     * awaits its Bitcoin txid. Used when a retry's re-submit is rejected as a duplicate
     * external id (Fireblocks error 1438): the transfer already exists, so resolve it
     * rather than failing. Returns null when Fireblocks has no transaction for the id.
     */
    this.resolveBitcoinTransactionByExternalId = async (externalId) => {
      let existing;
      try {
        existing = await this.fireblocksSDK.transactions.getTransactionByExternalId({ externalTxId: externalId });
      } catch (e) {
        const status = e?.response?.status ?? e?.status;
        if (status === 404) return null;
        throw e;
      }
      const fireblocksId = existing?.data?.id;
      if (!fireblocksId) return null;
      const btcTxid = await this.awaitBitcoinTransaction(fireblocksId);
      return { fireblocksId, btcTxid };
    };
    this.signTransaction = async (content, vaultAccountId, txNote, externalId) => {
      try {
        const signature = await this.fireblocksSigner.rawSign(
          content,
          vaultAccountId,
          txNote || "",
          this.testnet,
          externalId
        );
        return signature;
      } catch (error) {
        console.error("Error in signTransaction:", formatErrorMessage(error));
        throw new Error(
          `Failed to sign transaction: ${formatErrorMessage(error)}`
        );
      }
    };
    this.testnet = fireblocksConfig?.testnet || false;
    let privateKey;
    if (fireblocksConfig && fireblocksConfig.apiSecret) {
      privateKey = fireblocksConfig.apiSecret.endsWith(".pem") || fireblocksConfig.apiSecret.endsWith(".key") ? (0, import_fs.readFileSync)(fireblocksConfig.apiSecret, "utf8") : fireblocksConfig.apiSecret;
    } else {
      privateKey = import_fs.default.readFileSync(secretKeyPath, "utf8");
    }
    this.fireblocksSDK = new import_ts_sdk3.Fireblocks({
      apiKey: fireblocksConfig ? fireblocksConfig.apiKey : config.fireblocks.API_KEY,
      secretKey: privateKey,
      basePath: fireblocksConfig && fireblocksConfig.basePath ? fireblocksConfig.basePath : basePath
    });
    this.fireblocksSigner = new FireblocksSigner(this.fireblocksSDK);
  }
  static {
    /**
     * True when an error is Fireblocks' duplicate-external-id rejection (code 1438). The
     * message match requires 1438 as a standalone token AND a duplicate/external cue, so an
     * unrelated error that merely contains "1438" in an amount/id/timestamp is not misread.
     */
    this.isDuplicateExternalIdError = (error) => {
      const anyErr = error;
      if (anyErr?.response?.data?.code === 1438 || anyErr?.code === 1438) return true;
      const msg = typeof anyErr?.message === "string" ? anyErr.message : "";
      return /\b1438\b/.test(msg) && /duplicat|external/i.test(msg);
    };
  }
  static {
    /**
     * True when a transfer error means the Fireblocks transaction reached a TERMINAL
     * failure state (Blocked/Cancelled/Failed/Rejected) — as opposed to a timeout or a
     * transient read error. Matches the message raised by FireblocksSigner.getTxStatus.
     */
    this.isTerminalTransferFailure = (error) => {
      const msg = typeof error?.message === "string" ? error.message : "";
      return /status is (BLOCKED|CANCELLED|FAILED|REJECTED)/i.test(msg) || msg.includes("failed/blocked/cancelled");
    };
  }
};

// src/services/cosigner.service.ts
var import_common = __toESM(require_dist());
var import_secp256k12 = require("@noble/secp256k1");
var import_bip32 = require("@scure/bip32");
var DEFAULT_REQUEST_TIMEOUT_MS = 15e3;
var COSIGNER_BIP32_DERIVATION = "m/48'/1'/0'/2'/0/0";
var BIP32_VERSIONS = {
  mainnet: { private: 76066276, public: 76067358 },
  // xprv / xpub
  testnet: { private: 70615956, public: 70617039 }
  // tprv / tpub (testnet + regtest)
};
var versionsForExtendedKey = (key) => key.startsWith("tpub") || key.startsWith("tprv") ? BIP32_VERSIONS.testnet : BIP32_VERSIONS.mainnet;
var resolveCosignerUrl = (testnet) => {
  const url = env.EARLY_EXIT_SIGNER_URL || EARLY_EXIT_SIGNER[testnet ? "testnet" : "mainnet"];
  if (!url) {
    throw new Error(
      "Early-exit cosigner URL not configured (set EARLY_EXIT_SIGNER_URL)"
    );
  }
  return url;
};
var CosignerService = class {
  constructor(baseUrl, requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
    this.baseUrl = baseUrl;
    this.requestTimeoutMs = requestTimeoutMs;
    this.fetchWithTimeout = async (url, init) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.requestTimeoutMs);
      try {
        return await fetch(url, { ...init, signal: controller.signal });
      } catch (error) {
        if (error.name === "AbortError") {
          throw new Error(`Cosigner request to ${url} timed out after ${this.requestTimeoutMs}ms`);
        }
        throw error;
      } finally {
        clearTimeout(timer);
      }
    };
    this.getPublicKey = async () => {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/public-key`);
      if (!res.ok) {
        throw new Error(`Cosigner public-key request failed (${res.status})`);
      }
      return res.json();
    };
    /**
     * Derives the leaf public key (0/0 below the service's advertised account xpub —
     * the key committed into a bond's early-unlock-bytes) straight from `/public-key`.
     * Reaching the service also proves it is online and pins its advertised identity.
     */
    this.getLeafPublicKey = async () => {
      const info = await this.getPublicKey();
      const account = import_bip32.HDKey.fromExtendedKey(info.xpub, versionsForExtendedKey(info.xpub));
      const leaf = account.deriveChild(0).deriveChild(0);
      if (!leaf.publicKey) {
        throw new Error("Cosigner xpub did not yield a leaf public key");
      }
      return leaf.publicKey;
    };
    /**
     * Verifies BEFORE Bitcoin is funded that the cosigner service actually holds the
     * key committed into the proposed lock script. The lock script's early-exit branch
     * is `0x21 <P> 0xac` (buildUnlockScript(P)); if the service's derived leaf key does
     * not reproduce the bond's early-unlock-bytes, early exit would be impossible, so
     * funding must be refused. A 403 / unreachable service throws here as well, so the
     * check fails closed and names the failing service.
     */
    this.verifyCommittedKey = async (expectedUnlockBytes) => {
      const pubkey = await this.getLeafPublicKey();
      const unlockScript = new Uint8Array([33, ...pubkey, 172]);
      if ((0, import_common.bytesToHex)(unlockScript) !== (0, import_common.bytesToHex)(expectedUnlockBytes)) {
        throw new Error(
          `Early-exit cosigner key at ${this.baseUrl} does not match the bond's committed lock script \u2014 refusing to fund (early exit would be impossible for this bond).`
        );
      }
    };
    this.sign = async (req) => {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req)
      });
      if (!res.ok) {
        throw new Error(`Cosigner sign request failed (${res.status})`);
      }
      return res.json();
    };
    /**
     * Requests the cosigner leg of an early-exit reclaim and verifies it before
     * returning. The service computes its own sighash from the tx context we
     * send, so the returned `sighash` MUST match our locally computed one —
     * this comparison is the only thing preventing a substituted signature
     * over a different transaction. The returned pubkey is also bound to the
     * bond's early-unlock-bytes (`0x21 <P> 0xac`, i.e. buildUnlockScript(P)).
     *
     * Returns the DER signature with the SIGHASH_ALL byte appended, ready for
     * witness assembly.
     */
    this.cosignEarlyExit = async (args) => {
      const res = await this.sign({
        tx: args.unsignedTxHex,
        input_index: 0,
        sighash_type: "01",
        bip32_derivation: COSIGNER_BIP32_DERIVATION,
        prevout: {
          script_pub_key: args.prevoutScriptPubKeyHex,
          value: args.prevoutValueSats
        },
        witness_script: args.witnessScriptHex
      });
      if (res.sighash.toLowerCase() !== (0, import_common.bytesToHex)(args.expectedSighash)) {
        throw new Error("Cosigner sighash mismatch \u2014 refusing signature");
      }
      const pubkey = (0, import_common.hexToBytes)(res.public_key);
      const unlockScript = new Uint8Array([33, ...pubkey, 172]);
      if ((0, import_common.bytesToHex)(unlockScript) !== (0, import_common.bytesToHex)(args.expectedUnlockBytes)) {
        throw new Error(
          "Cosigner public key does not match bond early-unlock-bytes"
        );
      }
      const der = (0, import_common.hexToBytes)(res.signature);
      let parsedSig;
      try {
        parsedSig = import_secp256k12.Signature.fromDER(der);
      } catch (error) {
        throw new Error(`Cosigner returned a malformed DER signature: ${error.message}`);
      }
      if (parsedSig.hasHighS()) {
        throw new Error("Cosigner signature is not canonical (high-S) \u2014 refusing signature");
      }
      if (!(0, import_secp256k12.verify)(parsedSig, args.expectedSighash, pubkey, { strict: true })) {
        throw new Error("Cosigner signature failed local verification against the expected sighash and public key");
      }
      const sig = new Uint8Array(der.length + 1);
      sig.set(der, 0);
      sig[der.length] = 1;
      return sig;
    };
  }
};

// src/utils/network.ts
var import_network2 = require("@stacks/network");
function accountBalanceNormalizingFetch(baseFetch = fetch) {
  const stripHexPrefix = (v) => typeof v === "string" && /^0x/i.test(v) ? v.slice(2) : v;
  return (async (input, init) => {
    const res = await baseFetch(input, init);
    const url = typeof input === "string" ? input : input?.url ?? String(input);
    if (!res.ok || !/\/v2\/accounts\//.test(url)) return res;
    const data = await res.clone().json().catch(() => null);
    if (!data || typeof data !== "object") return res;
    const normalized = {
      ...data,
      balance: stripHexPrefix(data.balance),
      locked: stripHexPrefix(data.locked)
    };
    return new Response(JSON.stringify(normalized), {
      status: res.status,
      statusText: res.statusText,
      headers: { "content-type": "application/json" }
    });
  });
}
function resolveNetworkProfile(opts) {
  const envUrl = process.env.STACKS_API_URL || void 0;
  const name = opts.network ?? (opts.testnet ? "private-devnet" : "mainnet");
  switch (name) {
    case "private-devnet":
      return {
        name: "private-devnet",
        stacksApiUrl: opts.stacksApiUrl || envUrl || PRIVATE1_HIRO_API_BASE,
        chainId: 256,
        magicBytes: "id",
        esploraBaseUrl: BTC_ESPLORA.testnet,
        bech32Prefix: "bcrt",
        cosignerUrl: EARLY_EXIT_SIGNER.testnet,
        expectedPoxContractName: "pox-5"
      };
    case "public-testnet":
      return {
        name: "public-testnet",
        stacksApiUrl: opts.stacksApiUrl || envUrl || PUBLIC_TESTNET_POX5_API,
        chainId: import_network2.STACKS_TESTNET.chainId,
        magicBytes: import_network2.STACKS_TESTNET.magicBytes,
        esploraBaseUrl: BTC_ESPLORA.public_testnet,
        bech32Prefix: "tb",
        cosignerUrl: EARLY_EXIT_SIGNER.public_testnet,
        expectedPoxContractName: "pox-5",
        requirePox5Active: true
      };
    case "mainnet":
    default:
      return {
        name: "mainnet",
        stacksApiUrl: opts.stacksApiUrl || envUrl || api_constants.stacks_mainnet_rpc,
        chainId: import_network2.STACKS_MAINNET.chainId,
        magicBytes: import_network2.STACKS_MAINNET.magicBytes,
        esploraBaseUrl: BTC_ESPLORA.mainnet,
        bech32Prefix: void 0,
        cosignerUrl: EARLY_EXIT_SIGNER.mainnet,
        expectedPoxContractName: "pox-5"
      };
  }
}
function stacksNetworkFromProfile(profile) {
  const base = profile.name === "mainnet" ? import_network2.STACKS_MAINNET : import_network2.STACKS_TESTNET;
  return {
    ...base,
    chainId: profile.chainId,
    magicBytes: profile.magicBytes,
    client: {
      baseUrl: profile.stacksApiUrl,
      fetch: accountBalanceNormalizingFetch()
    }
  };
}
async function validateNetworkProfile(profile) {
  let info;
  try {
    const res = await fetch(`${profile.stacksApiUrl}/v2/info`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    info = await res.json();
  } catch (error) {
    console.warn(
      `Network profile validation skipped \u2014 could not read ${profile.stacksApiUrl}/v2/info: ${formatErrorMessage(error)}`
    );
    return;
  }
  if (typeof info?.network_id === "number" && info.network_id !== profile.chainId) {
    throw new Error(
      `Network mismatch: profile "${profile.name}" expects chain id ${profile.chainId} but ${profile.stacksApiUrl} reports ${info.network_id}. Set STACKS_API_URL / testnet to a node that matches the intended network.`
    );
  }
  try {
    const poxRes = await fetch(`${profile.stacksApiUrl}/v2/pox`);
    if (poxRes.ok) {
      const pox = await poxRes.json();
      const contractId = pox?.contract_id;
      const pox5Active = typeof contractId === "string" && contractId.endsWith(`.${profile.expectedPoxContractName}`);
      if (!pox5Active) {
        if (profile.requirePox5Active) {
          throw new Error(
            `Network profile "${profile.name}" requires an active ${profile.expectedPoxContractName} contract, but ${profile.stacksApiUrl} reports "${contractId ?? "unknown"}". This network is not yet supported.`
          );
        }
        console.warn(
          `Active PoX contract "${contractId}" is not ".${profile.expectedPoxContractName}"; PoX-5 bond operations may be unavailable on this network.`
        );
      }
    } else if (profile.requirePox5Active) {
      throw new Error(
        `Network profile "${profile.name}" could not confirm an active ${profile.expectedPoxContractName} contract (GET /v2/pox returned HTTP ${poxRes.status}). This network is not yet supported.`
      );
    }
  } catch (error) {
    if (profile.requirePox5Active) throw error;
    console.warn(`PoX contract check skipped: ${formatErrorMessage(error)}`);
  }
}

// src/staking/bonds/unlock-bytes-store.ts
var ENROLLMENT_STAGE_ORDER = [
  "lock-fixed",
  "funding-requested",
  "btc-broadcast",
  "btc-confirmed",
  "proof-built",
  "registration-submitted",
  "registration-confirmed"
];
function laterStage(a, b) {
  if (a === void 0) return b;
  return ENROLLMENT_STAGE_ORDER.indexOf(a) >= ENROLLMENT_STAGE_ORDER.indexOf(b) ? a : b;
}
var InMemoryLockRecordStore = class {
  constructor() {
    this.store = /* @__PURE__ */ new Map();
  }
  key(stxAddress, bondIndex) {
    return `${stxAddress}:${bondIndex}`;
  }
  async saveRecord(stxAddress, bondIndex, record) {
    this.store.set(this.key(stxAddress, bondIndex), record);
  }
  async loadRecord(stxAddress, bondIndex) {
    return this.store.get(this.key(stxAddress, bondIndex)) ?? null;
  }
};

// src/staking/signer-manager-adapter.ts
var SignerManagerRegistry = class {
  constructor(adapters = []) {
    this.byPrincipal = new Map(adapters.map((a) => [a.contractPrincipal, a]));
  }
  get(principal) {
    return this.byPrincipal.get(principal);
  }
  has(principal) {
    return this.byPrincipal.has(principal);
  }
  /** Number of registered adapters. 0 = no allowlist configured (all managers allowed). */
  get size() {
    return this.byPrincipal.size;
  }
};

// src/StacksSDK.ts
var import_crypto2 = require("crypto");

// src/utils/validation.ts
var ValidationError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
};
function parseOptionalNonce(value) {
  if (value === void 0 || value === "") return void 0;
  if (typeof value === "bigint") {
    if (value < BigInt(0))
      throw new ValidationError("nonce must be a non-negative integer");
    return value;
  }
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    return BigInt(value);
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    return BigInt(value);
  }
  throw new ValidationError("nonce must be a non-negative integer");
}
function parseOptionalAmount(value) {
  if (value === void 0 || value === "") return void 0;
  if (typeof value !== "number" && typeof value !== "string") {
    throw new ValidationError("amount must be a positive number (STX)");
  }
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ValidationError("amount must be a positive number (STX)");
  }
  return amount;
}
function parseOptionalFee(value) {
  if (value === void 0 || value === "") return void 0;
  if (typeof value !== "number" && typeof value !== "string") {
    throw new ValidationError("fee must be a positive number (STX)");
  }
  const fee = Number(value);
  if (!Number.isFinite(fee) || fee <= 0) {
    throw new ValidationError("fee must be a positive number (STX)");
  }
  if (fee > MAX_FEE_STX) {
    throw new ValidationError(
      `fee ${fee} STX exceeds the safety limit of ${MAX_FEE_STX} STX`
    );
  }
  return fee;
}

// src/utils/rbf.ts
function checkFeeReplacement(orig, newFeeSats, lockAddress, recordedOutpoint) {
  if (orig.confirmed) {
    return { ok: false, error: `Original tx is already confirmed (block ${orig.blockHeight}) \u2014 nothing to replace.` };
  }
  if (orig.outputCount !== 1) {
    return { ok: false, error: `Original tx has ${orig.outputCount} outputs; only a single-output recovery spend can be fee-replaced by this method.` };
  }
  if (!orig.destination) {
    return { ok: false, error: "Original tx destination address could not be decoded." };
  }
  if (!orig.lockOutpoint?.txid || orig.lockOutpoint.vout === void 0) {
    return { ok: false, error: "Original tx lock input outpoint could not be decoded." };
  }
  if (orig.prevoutAddress && orig.prevoutAddress !== lockAddress) {
    return { ok: false, error: `Original tx does not spend this bond's lock address (${lockAddress}); refusing to replace an unrelated transaction.` };
  }
  const outpointCheckable = recordedOutpoint?.txid !== void 0 && recordedOutpoint.vout !== void 0;
  if (outpointCheckable && (orig.lockOutpoint.txid !== recordedOutpoint.txid || orig.lockOutpoint.vout !== recordedOutpoint.vout)) {
    return { ok: false, error: `Original tx input ${orig.lockOutpoint.txid}:${orig.lockOutpoint.vout} does not match the recorded lock outpoint ${recordedOutpoint.txid}:${recordedOutpoint.vout}.` };
  }
  if (!orig.prevoutAddress && !outpointCheckable) {
    return { ok: false, error: `Cannot verify the original transaction spends this bond's lock (no prevout address from Esplora and no recorded outpoint) \u2014 refusing to replace an unverified transaction.` };
  }
  const oldFeeSats = orig.feeSats;
  if (newFeeSats <= oldFeeSats) {
    return { ok: false, error: `New fee ${newFeeSats} sats must exceed the original ${oldFeeSats} sats (BIP-125 requires a higher absolute fee).` };
  }
  const vsize = orig.vsize > 0 ? orig.vsize : 1;
  if (newFeeSats - oldFeeSats < BigInt(vsize)) {
    return { ok: false, error: `Fee increase ${newFeeSats - oldFeeSats} sats is below the BIP-125 rule-4 minimum of ${vsize} sats (1 sat/vB over a ${vsize} vB tx); raise newFeeSats to at least ${oldFeeSats + BigInt(vsize)}.` };
  }
  const newDestinationSats = orig.destinationSats + oldFeeSats - newFeeSats;
  const rate = (fee) => (Number(fee) / vsize).toFixed(2);
  return {
    ok: true,
    oldFeeSats,
    newFeeSats,
    oldDestinationSats: orig.destinationSats,
    newDestinationSats,
    feeRateOldSatVb: rate(oldFeeSats),
    feeRateNewSatVb: rate(newFeeSats),
    destination: orig.destination,
    lockOutpoint: orig.lockOutpoint
  };
}

// src/utils/rewardCalldata.ts
var import_stacking2 = require("@stacks/stacking");
var import_transactions3 = require("@stacks/transactions");
var REWARD_CALLDATA_MAX_BYTES = 500;
function encodeRewardAddressCalldata(rewardBtcAddress, maxFeeSats) {
  if (maxFeeSats < BigInt(0)) {
    throw new Error(`rewardMaxFeeSats must be non-negative, got ${maxFeeSats}`);
  }
  const poxAddr = (0, import_stacking2.poxAddressToTuple)(rewardBtcAddress);
  const tuple2 = import_transactions3.Cl.tuple({ "pox-addr": poxAddr, "max-fee": import_transactions3.Cl.uint(maxFeeSats) });
  const bytes2 = (0, import_transactions3.serializeCVBytes)(tuple2);
  if (bytes2.length > REWARD_CALLDATA_MAX_BYTES) {
    throw new Error(
      `Encoded reward calldata is ${bytes2.length} bytes, exceeding the ${REWARD_CALLDATA_MAX_BYTES}-byte contract limit.`
    );
  }
  return bytes2;
}

// src/utils/bondScheduleChain.ts
var import_bitcoin_staking = __toESM(require_dist3());
var BitcoinStaking = __toESM(require_dist3());

// src/utils/bondSchedule.ts
function diffBondSchedule(pairs) {
  const checks = pairs.map((p) => ({
    ...p,
    match: p.localUnlockHeight === p.onchainUnlockHeight
  }));
  const mismatches = checks.filter((c) => !c.match);
  return { ok: mismatches.length === 0, checks, mismatches };
}
function formatBondScheduleError(diff, schedule) {
  const detail = diff.mismatches.map((m) => `bond ${m.bondIndex}: local ${m.localUnlockHeight} != chain ${m.onchainUnlockHeight}`).join("; ");
  return `Bond schedule does not match the chain (local BOND_GAP_CYCLES=${schedule.gapCycles}, BOND_LENGTH_CYCLES=${schedule.lengthCycles}). Refusing to operate against a schedule the deployed PoX-5 contract does not enforce. Mismatches: ${detail}`;
}

// src/utils/bondScheduleChain.ts
var BOND_GAP_CYCLES2 = BitcoinStaking.BOND_GAP_CYCLES ?? 2;
var BOND_LENGTH_CYCLES2 = BitcoinStaking.BOND_LENGTH_CYCLES ?? 12;
var DEFAULT_SCHEDULE_BOND_INDICES = [0, 1, 2, 3, 4, 5, 6];
async function validateBondScheduleAgainstChain(opts) {
  const network = stacksNetworkFromProfile(opts.profile);
  const indices = opts.bondIndices ?? DEFAULT_SCHEDULE_BOND_INDICES;
  try {
    const poxInfo2 = await (0, import_bitcoin_staking.fetchPoxInfo)({ network });
    const pairs = await Promise.all(
      indices.map(async (bondIndex) => ({
        bondIndex,
        localUnlockHeight: Number((0, import_bitcoin_staking.computeBondUnlockHeight)({ bondIndex, poxInfo: poxInfo2 })),
        onchainUnlockHeight: Number(await (0, import_bitcoin_staking.fetchBondL1UnlockHeight)({ bondIndex, network }))
      }))
    );
    const diff = diffBondSchedule(pairs);
    return {
      ok: diff.ok,
      diff,
      gapCycles: BOND_GAP_CYCLES2,
      lengthCycles: BOND_LENGTH_CYCLES2,
      error: diff.ok ? void 0 : formatBondScheduleError(diff, { gapCycles: BOND_GAP_CYCLES2, lengthCycles: BOND_LENGTH_CYCLES2 })
    };
  } catch (error) {
    return {
      ok: false,
      gapCycles: BOND_GAP_CYCLES2,
      lengthCycles: BOND_LENGTH_CYCLES2,
      error: `Could not validate the bond schedule against chain (UNKNOWN, not "matches"): ${formatErrorMessage(error)}`
    };
  }
}

// src/staking/bonds/sbtc-rollover.ts
function planSbtcRollover(oldCustodiedSats, newSats) {
  if (oldCustodiedSats < BigInt(0) || newSats < BigInt(0)) {
    throw new Error(`Invalid sBTC amounts for rollover: old=${oldCustodiedSats}, new=${newSats}`);
  }
  if (newSats > oldCustodiedSats) {
    return { direction: "origin-sends", amountSats: newSats - oldCustodiedSats };
  }
  if (newSats < oldCustodiedSats) {
    return { direction: "boot-sends", amountSats: oldCustodiedSats - newSats };
  }
  return { direction: "none", amountSats: BigInt(0) };
}

// src/StacksSDK.ts
var import_transactions4 = require("@stacks/transactions");
var import_bitcoin_staking2 = __toESM(require_dist3());
init_btc_signer();
var import_encryption = require("@stacks/encryption");
var import_sha23 = require("@noble/hashes/sha2");
var import_secp256k14 = require("@noble/secp256k1");
var import_common2 = __toESM(require_dist());

// src/utils/der.ts
function encodeDerScalar(bytes2) {
  let start = 0;
  while (start < bytes2.length - 1 && bytes2[start] === 0) start++;
  const trimmed = bytes2.slice(start);
  return trimmed[0] >= 128 ? new Uint8Array([0, ...trimmed]) : trimmed;
}
function toDerSignature(r, s, sighashType = 1) {
  const rEnc = encodeDerScalar(r);
  const sEnc = encodeDerScalar(s);
  const total = 4 + rEnc.length + sEnc.length;
  const der = new Uint8Array(total + 3);
  let i = 0;
  der[i++] = 48;
  der[i++] = total;
  der[i++] = 2;
  der[i++] = rEnc.length;
  der.set(rEnc, i);
  i += rEnc.length;
  der[i++] = 2;
  der[i++] = sEnc.length;
  der.set(sEnc, i);
  i += sEnc.length;
  der[i] = sighashType;
  return der;
}

// src/StacksSDK.ts
var StacksSDK = class _StacksSDK {
  constructor(vaultAccountId, fireblocksConfig, hiroApiKey) {
    this.cachedTransactions = [];
    this.testnet = false;
    this.btcRecoveryAllowlist = [];
    this.signerManagerRegistry = new SignerManagerRegistry();
    this.verifyEarlyExitCosignerAtFunding = false;
    // A recovery/rollover spend is ~1 P2WSH input + 1 output; conservative vsize used
    // for Esplora fee estimation.
    this.RECOVERY_SPEND_VBYTES = 150;
    // Never create a Bitcoin output at or below this (P2WPKH dust threshold, sats).
    this.BTC_DUST_LIMIT_SATS = BigInt(330);
    this.lockRecordStore = new InMemoryLockRecordStore();
    this.lockRecordStoreIsDurable = false;
    /**
     * Sets the durable bond lock-record backend (default: in-memory, non-durable).
     *
     * The record captures the immutable recovery state of a native BTC bond
     * (unlock bytes, lock address, unlock height, locked amount, funding outpoint).
     * A durable, shared backend is required for any deployment that creates native
     * BTC bonds — losing a record for an unspent lock can strand BTC.
     */
    this.setLockRecordStore = (store) => {
      this.lockRecordStore = store;
      this.lockRecordStoreIsDurable = true;
    };
    /**
     * Native-BTC funding is refused unless a durable, healthy lock-record store is
     * configured. Losing a record for an unspent BTC lock can strand funds, so the
     * default in-memory store (not durable across restarts / pool eviction) is not
     * allowed to fund, and a configured durable store must pass its health check
     * immediately before funding. Returns an error message when funding must be
     * refused, or undefined when the store is safe to use.
     */
    this.assertDurableLockStore = async () => {
      if (!this.lockRecordStoreIsDurable) {
        return "Native-BTC funding requires a durable lock-record store (the default in-memory store is not durable across restarts/pool eviction and can STRAND BTC on recovery). Configure one via setLockRecordStore()/the pool lockRecordStore option before creating a bond.";
      }
      if (this.lockRecordStore.checkHealth) {
        try {
          await this.lockRecordStore.checkHealth();
        } catch (error) {
          return `Lock-record store failed its health check \u2014 refusing to fund: ${formatErrorMessage(error)}`;
        }
      }
      return void 0;
    };
    /**
     * Deterministic Fireblocks external id for a bond's BTC funding transfer, derived
     * from the vault, network, bond index, and lock address. Because it is stable for a
     * given enrollment, a retry reuses the same id and Fireblocks de-duplicates the
     * transfer — a second funding transaction is never created for the same lock, even
     * across a process crash. A genuine replacement (e.g. fee bump) must use a new id.
     */
    this.deriveFundingExternalId = (bondIndex, lockAddress) => {
      const material = `${this.vaultAccountId}:${this.networkProfile.name}:bond:${bondIndex}:${lockAddress}`;
      const digest = (0, import_crypto2.createHash)("sha256").update(material).digest("hex").slice(0, 40);
      return `bond-fund-${digest}`;
    };
    /**
     * Retrieves the Stacks account public key associated with the Fireblocks vault account.
     * @returns The Stacks account public key or empty string if not set.
     */
    this.getPublicKey = () => {
      return this.publicKey || "";
    };
    /**
     * Retrieves the Stacks account address associated with the Fireblocks vault account.
     * @returns The Stacks account address or empty string if not set.
     */
    this.getAddress = () => {
      return this.address || "";
    };
    /**
     * Retrieves the BTC rewards address associated with the Fireblocks vault account (derived from the same public key).
     * @returns The BTC rewards address or empty string if not set.
     */
    this.getBtcRewardsAddress = () => {
      return this.btcRewardsAddress || "";
    };
    /**
     * Returns the P2WPKH address for the vault's public key on the active Bitcoin network.
     * On testnet this is a bcrt1… regtest address (for use as unlock destination on private-1).
     * On mainnet this is a bc1… address.
     */
    this.getBtcVaultAddress = () => {
      if (!this.publicKey) return "";
      const pub = (0, import_common2.hexToBytes)(this.publicKey);
      return p2wpkh(pub, this.btcNetwork).address;
    };
    /**
     * Retrieves the native coin balance for the current address.
     *
     * @returns A promise that resolves to a {GetNativeBalanceResponse} containing the native balance information.
     * @throws {Error} If the address is not set or if the balance retrieval fails.
     */
    this.getBalance = async () => {
      if (!this.address) {
        console.log("StacksSDK.getBalance() error: address is not set.");
        throw new Error("Stacks address is not set.");
      }
      try {
        const balance = await this.chainService.getNativeBalance(this.address);
        return {
          success: true,
          balance
        };
      } catch (error) {
        console.log(`Failed to get balance: ${formatErrorMessage(error)}`);
        return {
          success: false,
          error: formatErrorMessage(error)
        };
      }
    };
    /**
     * Returns nonce information for this vault's Stacks address, accounting for
     * pending mempool transactions.
     *
     * - confirmedNonce: next nonce per confirmed on-chain state.
     * - pendingTxCount: number of this address's transactions in the mempool.
     * - nextAvailable: first nonce not already taken by a pending tx (gap-aware).
     *   Use this value when submitting a new transaction.
     *
     * @returns A promise that resolves to a {GetAccountNonceResponse}.
     */
    this.getAccountNonce = async () => {
      if (!this.address) {
        throw new Error("Stacks address is not set.");
      }
      try {
        const result = await this.chainService.getAccountNonce(this.address);
        return { success: true, ...result };
      } catch (error) {
        return { success: false, error: formatErrorMessage(error) };
      }
    };
    /**
     * Retrieves the status of a transaction by its ID.
     * @param txId - The transaction ID.
     * @returns A promise that resolves to a {GetTransactionStatusResponse} containing the transaction status information.
     * @throws {Error} If the transaction ID is invalid or if the status retrieval fails.
     */
    this.getTxStatusById = async (txId) => {
      if (!txId || typeof txId !== "string") {
        console.log("StacksSDK.getTxStatusById() error: invalid transaction ID.");
        throw new Error("Transaction ID is invalid.");
      }
      try {
        const transaction = await this.chainService.getTxStatusById(txId);
        if (!transaction) {
          return { success: false, error: "Transaction not found." };
        }
        const txDetails = {
          tx_id: transaction.tx_id,
          tx_status: transaction.tx_status,
          tx_result: transaction.tx_result,
          full_tx_details: transaction
        };
        const status = String(transaction.tx_status);
        const isTerminalFailure = status === "abort_by_response" || status === "abort_by_post_condition" || status.startsWith("dropped");
        if (isTerminalFailure) {
          const vmError = transaction.vm_error;
          if (status === "abort_by_post_condition") {
            txDetails.tx_error = vmError || "Post-condition check failure";
          } else {
            const errorNumber = parseClarityErrCode(transaction.tx_result);
            const isPoX4Transaction = transaction.tx_type === "contract_call" && transaction.contract_call?.contract_id?.includes("pox-4");
            if (isPoX4Transaction && errorNumber !== null && POX4_ERRORS[errorNumber]) {
              txDetails.tx_error = POX4_ERRORS[errorNumber].name;
            } else if (errorNumber !== null) {
              txDetails.tx_error = `Contract error code: ${errorNumber}`;
            } else {
              txDetails.tx_error = vmError || transaction.tx_result?.repr || "Transaction failed";
            }
          }
        }
        return {
          success: true,
          chain: "stacks",
          data: txDetails
        };
      } catch (error) {
        console.log(
          `Failed to get transaction status: ${formatErrorMessage(error)}`
        );
        return {
          success: false,
          chain: "stacks",
          error: formatErrorMessage(error)
        };
      }
    };
    /**
     * Retrieves the status of a BITCOIN transaction from the selected Esplora API.
     *
     * A Bitcoin txid (returned as `btcTxid` by createBond, renewBond, unlockMaturedBond,
     * spendEarlyExitUtxo, and replaceBtcRecoveryFee) MUST be polled here, never through
     * getTxStatusById — that endpoint queries the Stacks API and a BTC txid would never be
     * found there. The response is tagged `chain: 'bitcoin'`. A txid Esplora does not know
     * yet returns `found: false` (not an error); a transport failure returns `success:false`
     * (UNKNOWN, never silently "not confirmed").
     */
    this.getBtcTxStatus = async (btcTxid) => {
      if (!/^[0-9a-fA-F]{64}$/.test(btcTxid)) {
        return { success: false, chain: "bitcoin", error: `Invalid BTC txid: ${btcTxid}` };
      }
      try {
        const res = await fetch(`${this.esploraBase()}/tx/${btcTxid}`);
        if (res.status === 404) {
          return { success: true, chain: "bitcoin", data: { txid: btcTxid, found: false, confirmed: false, confirmations: 0 } };
        }
        if (!res.ok) throw new Error(`Esplora HTTP ${res.status}`);
        const tx = await res.json();
        const confirmed = !!tx?.status?.confirmed;
        const blockHeight = tx?.status?.block_height ?? null;
        let confirmations = 0;
        if (confirmed) {
          confirmations = null;
          if (typeof blockHeight === "number") {
            const tip = await this.readBtcTipHeight();
            if (tip !== null) confirmations = Math.max(0, tip - blockHeight + 1);
          }
        }
        return {
          success: true,
          chain: "bitcoin",
          data: {
            txid: btcTxid,
            found: true,
            confirmed,
            block_height: blockHeight,
            block_hash: tx?.status?.block_hash ?? null,
            confirmations
          }
        };
      } catch (error) {
        return { success: false, chain: "bitcoin", error: `Could not read BTC tx ${btcTxid} status (UNKNOWN, not "unconfirmed"): ${formatErrorMessage(error)}` };
      }
    };
    /**
     * Waits for a transaction to be settled (either success or failure) by polling its status.
     * @param txId - The transaction ID.
     * @param intervalMs - The interval in milliseconds between status checks (default is 3000ms).
     * @param maxAttempts - The maximum number of attempts to check the status (default is 20).
     * @returns A promise that resolves to a {GetTransactionStatusResponse} containing the final transaction status.
     */
    this.waitForTxSettlement = async (txId, timeoutMs = 30 * 60 * 1e3, intervalMs = 15e3) => {
      const deadline = Date.now() + timeoutMs;
      let lastTransientError;
      while (Date.now() < deadline) {
        const status = await this.getTxStatusById(txId);
        if (status.success) {
          const txStatus = status.data?.tx_status;
          if (txStatus !== "submitted" && txStatus !== "pending") {
            return status;
          }
        } else {
          lastTransientError = status.error;
        }
        const remaining = deadline - Date.now();
        if (remaining <= 0) break;
        await new Promise((res) => setTimeout(res, Math.min(intervalMs, remaining)));
      }
      return {
        success: false,
        error: `Transaction ${txId} timed out waiting for confirmation after ${timeoutMs / 6e4} minutes${lastTransientError ? ` (last read error: ${lastTransientError})` : ""}.`
      };
    };
    /**
     * Retrieves the fungible tokens balances for the current address.
     *
     * @returns A promise that resolves to a {GetFtBalancesResponse} containing the fungible tokens balances.
     * @throws {Error} If the address is not set or if the balance retrieval fails.
     */
    this.getFtBalances = async () => {
      if (!this.address) {
        console.log(
          "StacksSDK.getTransactionsHistory() error: address is not set."
        );
        throw new Error("Stacks address is not set.");
      }
      try {
        const data = [];
        const balances = await this.chainService.getFTBalancesForAddress(
          this.address
        );
        for (const [assetId, info] of Object.entries(balances)) {
          const { contractAddress, contractName, tokenName } = parseAssetId(assetId);
          let decimals = getDecimalsFromFtInfo(assetId);
          if (decimals == 0) {
            decimals = await this.chainService.fetchFtDecimals(
              contractAddress,
              contractName
            );
          }
          const balance = {
            token: tokenName,
            tokenContractName: contractName,
            tokenContractAddress: contractAddress,
            balance: microToToken(info.balance, decimals)
          };
          data.push(balance);
        }
        return {
          success: true,
          data
        };
      } catch (error) {
        console.error(
          `Error fetching fungible tokens balances: ${formatErrorMessage(error)}`
        );
        return {
          success: false,
          error: formatErrorMessage(error)
        };
      }
    };
    /**
     * Retrieves the transaction history for the current address.
     *
     * @param getCachedTransactions - Whether to return cached transactions (default is true).
     * @param limit - The maximum number of transactions to return (default is 50).
     * @param offset - The offset for pagination (default is 0).
     * @returns A promise that resolves to an array of {Transaction} containing transaction history.
     * @throws {Error} If the address is not set or if the transaction history retrieval fails.
     */
    this.getTransactionHistory = async (getCachedTransactions = true, limit = pagination_defaults.limit, offset = pagination_defaults.page, fetchAll = false, fetchPending = false) => {
      if (getCachedTransactions) {
        console.log("Using cached transactions");
        return { success: true, data: this.cachedTransactions };
      }
      if (!this.address) {
        console.log(
          "StacksSDK.getTransactionsHistory() error: address is not set."
        );
        throw new Error("Stacks address is not set.");
      }
      try {
        const pageSize = helperConstants.stacks_api_page_size;
        const fetchPages = async (fetcher) => {
          const all = [];
          let currentOffset = offset;
          while (true) {
            const page = await fetcher(currentOffset);
            all.push(...page);
            if (page.length < pageSize) break;
            if (!fetchAll && all.length >= limit) break;
            currentOffset += pageSize;
          }
          return fetchAll ? all : all.slice(0, limit);
        };
        const confirmedTxs = await fetchPages(
          (o) => this.chainService.getTransactionHistory(this.address, pageSize, o)
        );
        const pendingTxs = fetchPending ? await fetchPages(
          (o) => this.chainService.getMempoolTransactions(this.address, pageSize, o)
        ) : [];
        const txs = [...pendingTxs, ...confirmedTxs];
        const existingHashes = new Set(
          this.cachedTransactions.map((tx) => tx.transaction_hash)
        );
        const newConfirmed = confirmedTxs.filter(
          (tx) => !existingHashes.has(tx.transaction_hash)
        );
        this.cachedTransactions = [...this.cachedTransactions, ...newConfirmed];
        return { success: true, data: txs };
      } catch (error) {
        return {
          success: false,
          error: formatErrorMessage(error)
        };
      }
    };
    /**
     * Checks and validates transaction parameters, adjusting the amount if necessary.
     *
     * @param recipientAddress - The address of the recipient.
     * @param amount - The amount to transfer in native coin.
     * @param grossTransaction - Optional flag indicating if the transaction is gross, if so fee will be deducted from recipient (default is false).
     * @param type - The type of transaction (default is native coin).
     * @param token - The type of fungible token to transfer (required if type is FungibleToken).
     * @returns A promise that resolves to an object indicating if parameters are valid, the final amount, and reason if invalid.
     * @throws {Error} If parameter validation fails.
     */
    this.checkParamsAndAdjustAmount = async (recipientAddress, amount, grossTransaction = false, type = "STX" /* STX */, token, customTokenContractAddress, customTokenContractName) => {
      try {
        if (!validateAddress(recipientAddress, this.testnet)) {
          return {
            validParams: false,
            reason: `Not a valid recipient address`
          };
        }
        if (this.address && recipientAddress.toUpperCase() === this.address.toUpperCase()) {
          return {
            validParams: false,
            reason: `Recipient address cannot equal the sender's own address`
          };
        }
        if (amount <= 0) {
          return {
            validParams: false,
            reason: `Transfer amount must be greater than zero`
          };
        }
        if (type == "Fungible Token" /* FungibleToken */ && !token) {
          return {
            validParams: false,
            reason: `Token type must be provided for fungible token transfers`
          };
        }
        if (token === "custom-token" /* CUSTOM */) {
          if (!customTokenContractAddress || !customTokenContractName) {
            return {
              validParams: false,
              reason: `Custom token contract address and name must be provided for CUSTOM token type`
            };
          }
        }
        let microAmount = type == "Fungible Token" /* FungibleToken */ ? await tokenToMicro(
          amount,
          token,
          this.chainService,
          customTokenContractAddress,
          customTokenContractName
        ) : stxToMicro(amount);
        let microfee = 0;
        let fee = 0;
        if (type == "STX" /* STX */) {
          microfee = await this.chainService.estimateTxFee(
            recipientAddress,
            microAmount
          );
          fee = microToStx(microfee);
        } else if (type == "Fungible Token" /* FungibleToken */) {
          const tokenInfo = token !== "custom-token" /* CUSTOM */ ? getTokenInfo(token, this.testnet ? "testnet" : "mainnet") : void 0;
          const ftContractAddress = tokenInfo?.contractAddress ?? customTokenContractAddress;
          const ftContractName = tokenInfo?.contractName ?? customTokenContractName;
          const functionArgs = [
            (0, import_transactions4.uintCV)(microAmount),
            (0, import_transactions4.principalCV)(this.address),
            (0, import_transactions4.principalCV)(recipientAddress),
            (0, import_transactions4.noneCV)()
          ];
          microfee = await this.chainService.estimateContractCallFee(
            ftContractAddress,
            ftContractName,
            "transfer",
            functionArgs
          );
          fee = microToStx(microfee);
        }
        if (type == "Fungible Token" /* FungibleToken */) {
          const stxBalanceResponse = await this.getBalance();
          if (!stxBalanceResponse.success) {
            throw new Error("Could not fetch STX balance to check gas funds");
          }
          if (stxBalanceResponse.balance < fee) {
            return {
              validParams: false,
              reason: `Insufficient STX for gas fee. Available: ${stxBalanceResponse.balance} STX, required: ${fee} STX`
            };
          }
        }
        const balanceResponse = type == "Fungible Token" /* FungibleToken */ ? await this.getFtBalances() : await this.getBalance();
        if (!balanceResponse.success) {
          throw new Error(
            `Could not fetch account balance to check funds sufficiency`
          );
        }
        if (type == "STX" /* STX */ && grossTransaction) {
          console.log(
            `Gross transaction: deducting fee ${fee} STX from amount ${amount} STX`
          );
          amount -= fee;
          if (amount <= 0) {
            return {
              validParams: false,
              reason: `Amount after fee deduction is zero or negative`
            };
          }
        }
        let balance;
        if (type == "Fungible Token" /* FungibleToken */) {
          const tokenInfo = token !== "custom-token" /* CUSTOM */ ? getTokenInfo(token, this.testnet ? "testnet" : "mainnet") : void 0;
          balance = balanceResponse.data?.find(
            (b) => tokenInfo && b.tokenContractName === tokenInfo.contractName || customTokenContractAddress && b.tokenContractAddress === customTokenContractAddress
          )?.balance;
        } else {
          balance = balanceResponse.balance;
        }
        if ((type === "Fungible Token" /* FungibleToken */ ? amount : amount + fee) > balance) {
          return {
            validParams: false,
            reason: `Insufficient funds. Available balance: ${balance}, required: ${amount}`
          };
        }
        microAmount = type == "Fungible Token" /* FungibleToken */ ? await tokenToMicro(
          amount,
          token,
          this.chainService,
          customTokenContractAddress,
          customTokenContractName
        ) : stxToMicro(amount);
        console.log(
          `Converted amount to micro: ${microAmount} (from ${amount} ${token ? token : "STX"})`
        );
        return {
          validParams: true,
          finalAmount: microAmount
        };
      } catch (error) {
        throw new Error(
          `Parameter validation failed: ${formatErrorMessage(error)}`
        );
      }
    };
    /**
     * Resolves the nonce to use for a transaction. If an explicit nonce is
     * provided it is returned as-is. Otherwise the gap-aware nextAvailable
     * value from getAccountNonce() is used, keeping our auto-nonce consistent
     * with what GET /:vaultId/nonce reports.
     */
    // Serializes the nonce-resolution → sign → broadcast critical section per SDK
    // instance (one instance per vault/principal in the pool). Without this, two
    // concurrent operations for the same principal read the same auto-nonce and one
    // replaces or invalidates the other after both consumed a Fireblocks signature.
    // Only the short critical section is serialized — chain-confirmation waits run
    // outside it, so a slow bond enrollment does not block unrelated recovery ops.
    this.txChain = Promise.resolve();
    this.runNonceExclusive = (fn) => {
      const run = this.txChain.then(fn, fn);
      this.txChain = run.then(
        () => void 0,
        () => void 0
      );
      return run;
    };
    this.resolveNonce = async (nonce) => {
      if (nonce !== void 0) {
        const confirmedNonce = await this.chainService.getConfirmedNonce(this.address);
        if (nonce < confirmedNonce) {
          throw new ValidationError(
            `Nonce ${nonce} is below the confirmed nonce (${confirmedNonce}). This transaction would be rejected.`
          );
        }
        return nonce;
      }
      const { nextAvailable } = await this.chainService.getAccountNonce(this.address);
      return nextAvailable;
    };
    /**
     *  Builds, signs, and sends an STX or fungible token transfer transaction.
     * @param recipientAddress - The address of the recipient.
     * @param microAmount - The amount to transfer in micro units.
     * @param type - The type of transaction (default is native coin).
     * @param token - The token type for fungible token transfers.
     * @param note - Optional note to be attached to the transaction in raw signing.
     * @returns - A promise that resolves to the transaction broadcast result.
     */
    this.buildSignSendTransfer = async (recipientAddress, microAmount, type = "STX" /* STX */, token, customTokenContractAddress, customTokenContractName, customTokenAssetName, note, nonce, feeUstx, memo, externalId) => {
      try {
        return await this.runNonceExclusive(async () => {
          const resolvedNonce = await this.resolveNonce(nonce);
          const transactionToSign = await this.chainService.serializeTransaction(
            this.address,
            this.publicKey,
            recipientAddress,
            microAmount,
            type,
            token,
            customTokenContractAddress,
            customTokenContractName,
            customTokenAssetName,
            resolvedNonce,
            feeUstx,
            memo
          );
          const defaultNote = type === "Fungible Token" /* FungibleToken */ ? `Transferring ${microToStx(microAmount)} ${customTokenContractName ?? token ?? "token"} to ${recipientAddress}` : `Transferring ${microToStx(microAmount)} STX to ${recipientAddress}`;
          const rawSignature = await this.fireblocksService.signTransaction(
            transactionToSign.preSignSigHash,
            this.vaultAccountId.toString(),
            note || defaultNote,
            externalId
          );
          const signature = concatSignature(rawSignature.fullSig, rawSignature.v);
          transactionToSign.unsignedTx.auth.spendingCondition.signature = (0, import_transactions4.createMessageSignature)(signature);
          return await this.chainService.broadcastTransaction(
            transactionToSign.unsignedTx
          );
        });
      } catch (error) {
        if (error instanceof ValidationError) return { success: false, error: error.message };
        throw new Error(
          `Failed to build, sign or send transaction: ${formatErrorMessage(
            error
          )}`
        );
      }
    };
    this.buildSignSendContractCall = async (options) => {
      const {
        functionName,
        poolAddress,
        poolContractName,
        amount,
        maxAmount,
        lockPeriod,
        extendCycles,
        signerKey,
        signerSig65Hex,
        startBurnHeight,
        authId,
        contractCallParams,
        note,
        nonce,
        externalId
      } = options;
      if (functionName === "generic-contract-call" && !contractCallParams) {
        throw new Error("Contract call parameters must be provided for generic-contract-call");
      }
      try {
        if (functionName === "allow-contract-caller" && (!poolContractName || !poolAddress)) {
          throw new Error("Pool contract name and address must be provided for allow-contract-caller");
        }
        if (functionName === "delegate-stx" && (!amount || !lockPeriod || !poolAddress)) {
          throw new Error("Amount, lock period, and pool address must be provided for delegate-stx");
        }
        if (functionName === "solo-stack" && (!amount || !lockPeriod || !signerSig65Hex || !startBurnHeight || !signerKey || maxAmount == null || authId == null)) {
          throw new Error("Amount, lock period, signer signature, start burn height, signer key, max amount, and auth ID must be provided for solo-stack");
        }
        if (functionName === "increase-stack-amount" && (!amount || !signerSig65Hex || !signerKey || authId == null || maxAmount == null)) {
          throw new Error("Amount, signer signature, signer key, auth ID and max amount must be provided for increase-stack-amount");
        }
        if (functionName === "extend-stack-period" && (!extendCycles || !signerSig65Hex || !signerKey || authId == null || maxAmount == null)) {
          throw new Error("Extend cycles, signer signature, signer key, auth ID and max amount must be provided for extend-stack-period");
        }
        return await this.runNonceExclusive(async () => {
          const resolvedNonce = await this.resolveNonce(nonce);
          let transactionToSign;
          switch (functionName) {
            case "allow-contract-caller":
              transactionToSign = await this.chainService.allowPoxContractCaller(
                this.publicKey,
                poolAddress,
                poolContractName,
                resolvedNonce
              );
              break;
            case "delegate-stx":
              transactionToSign = await this.chainService.delegateStx(
                this.publicKey,
                poolAddress,
                amount,
                lockPeriod,
                resolvedNonce,
                poolContractName
              );
              break;
            case "revoke-delegate-stx":
              transactionToSign = await this.chainService.revokeStxDelegation(
                this.publicKey,
                resolvedNonce
              );
              break;
            case "solo-stack":
              transactionToSign = await this.chainService.soloStack(
                this.publicKey,
                signerKey,
                amount,
                this.btcRewardsAddress,
                lockPeriod,
                maxAmount,
                signerSig65Hex,
                startBurnHeight,
                authId,
                resolvedNonce
              );
              break;
            case "increase-stack-amount":
              transactionToSign = await this.chainService.increaseStackedStx(
                this.publicKey,
                signerKey,
                amount,
                maxAmount,
                signerSig65Hex,
                authId,
                resolvedNonce
              );
              break;
            case "extend-stack-period":
              transactionToSign = await this.chainService.extendStackingPeriod(
                this.publicKey,
                signerKey,
                this.btcRewardsAddress,
                extendCycles,
                maxAmount,
                signerSig65Hex,
                authId,
                resolvedNonce
              );
              break;
            case "generic-contract-call":
              transactionToSign = await this.chainService.makeContractCall(
                this.publicKey,
                contractCallParams.contractAddress,
                contractCallParams.contractName,
                contractCallParams.functionName,
                contractCallParams.functionArgs,
                contractCallParams.postConditions,
                contractCallParams.postConditionMode
              );
              break;
            default:
              throw new Error(`Unknown contract call function: ${functionName}`);
          }
          const defaultNote = poolAddress && poolContractName ? `Calling ${functionName} on ${poolAddress}.${poolContractName}` : `Calling ${functionName}`;
          const rawSignature = await this.fireblocksService.signTransaction(
            transactionToSign.preSignSigHash,
            this.vaultAccountId.toString(),
            note || defaultNote,
            externalId
          );
          const signature = concatSignature(rawSignature.fullSig, rawSignature.v);
          transactionToSign.unsignedContractCall.auth.spendingCondition.signature = (0, import_transactions4.createMessageSignature)(signature);
          return await this.chainService.broadcastTransaction(transactionToSign.unsignedContractCall);
        });
      } catch (error) {
        if (error instanceof ValidationError) return { success: false, error: error.message };
        throw new Error(
          `Failed to build, sign or send contract call transaction: ${formatErrorMessage(error)}`
        );
      }
    };
    this.pox5SignAndBroadcast = async (tx, note, externalId, revalidate) => {
      const sigHash = tx.signBegin();
      const preSignSigHash = (0, import_transactions4.sigHashPreSign)(
        sigHash,
        tx.auth.authType,
        tx.auth.spendingCondition.fee,
        tx.auth.spendingCondition.nonce
      );
      const rawSignature = await this.fireblocksService.signTransaction(
        preSignSigHash,
        this.vaultAccountId.toString(),
        note,
        externalId
      );
      const signature = concatSignature(rawSignature.fullSig, rawSignature.v);
      tx.auth.spendingCondition.signature = (0, import_transactions4.createMessageSignature)(signature);
      if (revalidate) {
        const changed = await revalidate();
        if (changed) {
          return { error: `Transaction discarded after signing \u2014 ${changed}. No transaction was submitted; retry to sign against current state.` };
        }
      }
      return this.chainService.broadcastTransaction(tx, this.pox5Network);
    };
    /**
     * Encodes optional signer-manager calldata as a Clarity `(optional (buff 500))`. Some
     * signer managers require calldata; when none is supplied this is `none`, preserving
     * the prior hardcoded behavior. A supplied value is validated to be hex-parseable and
     * within the contract's 500-byte limit — an over-long or non-hex buffer would abort the
     * transaction after signing, and (on the bond paths) after the BTC is committed.
     */
    this.encodeSignerCalldata = (calldata) => {
      if (calldata === void 0) return import_transactions4.Cl.none();
      let bytes2;
      if (typeof calldata === "string") {
        if (!/^(0x)?([0-9a-fA-F]{2})*$/.test(calldata)) {
          throw new Error("signerCalldata must be a hex string (even length).");
        }
        bytes2 = (0, import_common2.hexToBytes)(calldata.replace(/^0x/, ""));
      } else {
        bytes2 = calldata;
      }
      if (bytes2.length > REWARD_CALLDATA_MAX_BYTES) {
        throw new Error(`signerCalldata is ${bytes2.length} bytes, exceeding the ${REWARD_CALLDATA_MAX_BYTES}-byte contract limit.`);
      }
      return import_transactions4.Cl.some(import_transactions4.Cl.buffer(bytes2));
    };
    /**
     * Resolves the signer-calldata for a register/renew/rotate call from an explicit
     * caller-supplied value OR a reward destination (Bitcoin address + max-fee) that the
     * SDK encodes into the signer-manager's pox-addr calldata tuple. Enforces network +
     * checksum on the reward address before it is used. Returns the raw bytes to thread
     * through builders (and to persist for re-supply), or undefined for `none`.
     */
    this.resolveSignerCalldata = (opts) => {
      if (opts?.signerCalldata !== void 0) {
        if (opts.rewardBtcAddress !== void 0) {
          throw new Error(
            "Pass either signerCalldata OR rewardBtcAddress, not both: the reward destination is encoded into the signer calldata, so supplying both is ambiguous."
          );
        }
        this.encodeSignerCalldata(opts.signerCalldata);
        return opts.signerCalldata;
      }
      if (opts?.rewardBtcAddress === void 0) return void 0;
      if (opts.rewardMaxFeeSats === void 0) {
        throw new Error(
          "rewardMaxFeeSats is required with rewardBtcAddress: it is the BTC-withdrawal fee budget (sats) reserved from each cycle's rewards, and a cycle whose earned rewards fall below it is unclaimable until re-staked \u2014 so the SDK will not guess it."
        );
      }
      if (!this.isValidBtcAddressForNetwork(opts.rewardBtcAddress)) {
        throw new Error(`Reward BTC address ${opts.rewardBtcAddress} is not a valid address for this network.`);
      }
      return encodeRewardAddressCalldata(opts.rewardBtcAddress, opts.rewardMaxFeeSats);
    };
    // ─── PoX-5 Solo STX ──────────────────────────────────────────────────────────
    /**
     * Stakes STX through a signer-manager (PoX-5). Replaces pox-4 stackSolo.
     * @param amountStx - Amount of STX to stake (number). Converted to microSTX internally.
     * @param numCycles - Number of cycles to lock (1–96).
     * @param signerManager - The signer-manager contract principal (must have an on-chain grant).
     * @param note - Optional Fireblocks transaction note.
     * @param nonce - Optional nonce override.
     * @param externalId - Optional Fireblocks external ID for idempotency.
     */
    this.stake = async (amountStx, numCycles, signerManager, note, nonce, externalId, signerCalldata) => {
      try {
        if (!this.address || !this.publicKey || !this.vaultAccountId) {
          throw new Error("Address, Public Key or Vault ID are not set");
        }
        const smAllowError = this.signerManagerAllowedError(signerManager);
        if (smAllowError) return { success: false, error: smAllowError };
        const pox = await (0, import_bitcoin_staking2.fetchPoxInfo)({ network: this.pox5Network });
        const eligibilityCheck = await this.checkEligibility(pox, amountStx);
        if (!eligibilityCheck.eligible) {
          return { success: false, error: `Account not eligible for staking: ${eligibilityCheck.reason}` };
        }
        const amountUstx = stxToMicro(amountStx);
        const preflight = await (0, import_bitcoin_staking2.fetchEligibleStake)({
          staker: this.address,
          signerManager,
          amountUstx,
          numCycles,
          startBurnHt: pox.currentBurnchainBlockHeight,
          poxInfo: pox,
          network: this.pox5Network
        });
        if (!preflight.ok) {
          const reasons = preflight.reasons ?? [];
          return { success: false, error: `Account not eligible for staking: ${this.describeBondReasons(reasons)}` };
        }
        const result = await this.runNonceExclusive(async () => {
          const custodyRefund = await this.custodyRefundPostConditions();
          const resolvedNonce = await this.resolveNonce(nonce);
          const tx = await this.buildPox5Call(
            "stake",
            [
              import_transactions4.Cl.address(signerManager),
              import_transactions4.Cl.uint(amountUstx),
              import_transactions4.Cl.uint(numCycles),
              import_transactions4.Cl.uint(pox.currentBurnchainBlockHeight),
              this.encodeSignerCalldata(signerCalldata)
            ],
            {
              nonce: resolvedNonce,
              postConditionMode: import_transactions4.PostConditionMode.Deny,
              postConditions: [
                // Deny mode bounding the STX lock to exactly the staked amount.
                import_transactions4.Pc.origin().willSendEq(amountUstx).ustxToLock(),
                // An sBTC-bond holder rolling into a solo STX stake is refunded their
                // entire custodied sBTC from pox-5 during this call — cover it or abort.
                ...custodyRefund.conditions
              ]
            }
          );
          return this.pox5SignAndBroadcast(tx, note || `stake ${amountStx} STX for ${numCycles} cycles`, externalId, async () => {
            const [recheck, nowCustodied] = await Promise.all([
              (0, import_bitcoin_staking2.fetchEligibleStake)({
                staker: this.address,
                signerManager,
                amountUstx,
                numCycles,
                startBurnHt: pox.currentBurnchainBlockHeight,
                poxInfo: await (0, import_bitcoin_staking2.fetchPoxInfo)({ network: this.pox5Network }),
                network: this.pox5Network
              }),
              (0, import_bitcoin_staking2.fetchStakerCustodiedSbtc)({ staker: this.address, network: this.pox5Network })
            ]);
            if (nowCustodied !== custodyRefund.custodiedSats) {
              return `custodied sBTC changed during approval (${custodyRefund.custodiedSats} \u2192 ${nowCustodied} sats) \u2014 retry to rebuild against current custody`;
            }
            if (!recheck.ok) {
              const reasons = recheck.reasons ?? [];
              return `staking eligibility changed during approval: ${this.describeBondReasons(reasons)}`;
            }
            return void 0;
          });
        });
        if (!result || result.error || !result.txid || result.reason) {
          console.error("stake broadcast rejected:", JSON.stringify(result));
          const parts = [result?.error, result?.reason, result?.reason_data ? JSON.stringify(result.reason_data) : void 0].filter(Boolean);
          return { success: false, error: parts.join(" \u2014 ") || "Failed to broadcast stake transaction" };
        }
        const txStatus = await this.waitForTxSettlement(result.txid);
        if (!txStatus.success || txStatus.data?.tx_status !== "success") {
          return {
            success: false,
            unsettled: !txStatus.success,
            error: txStatus.error || txStatus.data?.tx_error || "Stake transaction failed at the contract level.",
            txHash: result.txid
          };
        }
        return { success: true, txHash: result.txid };
      } catch (error) {
        return { success: false, error: `Failed to stake: ${formatErrorMessage(error)}` };
      }
    };
    /**
     * Updates an existing PoX-5 staking position — extend cycles, increase amount, or rotate
     * signer-manager. All fields are optional; omit any to leave that dimension unchanged.
     * @param signerManager - Rotate to a new signer-manager principal, or omit to keep current.
     * @param cyclesToExtend - Additional cycles to add (0 = no extension).
     * @param increaseByStx - Additional STX to add (0 = no increase). Converted to microSTX internally.
     * @param note - Optional Fireblocks transaction note.
     * @param nonce - Optional nonce override.
     * @param externalId - Optional Fireblocks external ID for idempotency.
     */
    this.updateStake = async (signerManager, oldSignerManager, cyclesToExtend, increaseByStx, note, nonce, externalId, signerCalldata) => {
      try {
        if (!this.address || !this.publicKey || !this.vaultAccountId) {
          throw new Error("Address, Public Key or Vault ID are not set");
        }
        const smAllowError = this.signerManagerAllowedError(signerManager);
        if (smAllowError) return { success: false, error: smAllowError };
        const amountIncrease = increaseByStx ? stxToMicro(increaseByStx) : BigInt(0);
        const preflight = await (0, import_bitcoin_staking2.fetchEligibleStakeUpdate)({
          staker: this.address,
          signerManager,
          oldSignerManager,
          cyclesToExtend: cyclesToExtend ?? 0,
          amountIncrease,
          network: this.pox5Network
        });
        if (!preflight.ok) {
          const reasons = preflight.reasons ?? [];
          return { success: false, error: `Cannot update stake: ${this.describeBondReasons(reasons)}` };
        }
        const result = await this.runNonceExclusive(async () => {
          const current = await (0, import_bitcoin_staking2.fetchStakerInfo)({ address: this.address, network: this.pox5Network });
          if (!current?.staked) {
            return { error: "Cannot update stake: no active staking position found for this account." };
          }
          const currentAmountUstx = BigInt(current.details.amountUstx);
          const postCondition = import_transactions4.Pc.origin().willSendEq(currentAmountUstx + amountIncrease).ustxToLock();
          const resolvedNonce = await this.resolveNonce(nonce);
          const tx = await this.buildPox5Call(
            "stake-update",
            [
              import_transactions4.Cl.address(signerManager),
              import_transactions4.Cl.address(oldSignerManager),
              import_transactions4.Cl.uint(cyclesToExtend ?? 0),
              import_transactions4.Cl.uint(amountIncrease),
              this.encodeSignerCalldata(signerCalldata)
            ],
            {
              nonce: resolvedNonce,
              postConditionMode: import_transactions4.PostConditionMode.Deny,
              postConditions: [postCondition]
            }
          );
          return this.pox5SignAndBroadcast(tx, note || "update stake position", externalId, async () => {
            const [recheck, nowInfo] = await Promise.all([
              (0, import_bitcoin_staking2.fetchEligibleStakeUpdate)({
                staker: this.address,
                signerManager,
                oldSignerManager,
                cyclesToExtend: cyclesToExtend ?? 0,
                amountIncrease,
                network: this.pox5Network
              }),
              (0, import_bitcoin_staking2.fetchStakerInfo)({ address: this.address, network: this.pox5Network })
            ]);
            const nowAmountUstx = nowInfo?.staked ? BigInt(nowInfo.details.amountUstx) : null;
            if (nowAmountUstx !== currentAmountUstx) {
              return `staked amount changed during approval (${currentAmountUstx} \u2192 ${nowAmountUstx ?? "not staked"} \xB5STX) \u2014 retry to rebuild against the current position`;
            }
            if (!recheck.ok) {
              const reasons = recheck.reasons ?? [];
              return `stake-update eligibility changed during approval: ${this.describeBondReasons(reasons)}`;
            }
            return void 0;
          });
        });
        if (!result || result.error || !result.txid || result.reason) {
          return { success: false, error: result?.error || result?.reason || "Failed to broadcast update-stake transaction" };
        }
        const txStatus = await this.waitForTxSettlement(result.txid);
        if (!txStatus.success || txStatus.data?.tx_status !== "success") {
          return {
            success: false,
            unsettled: !txStatus.success,
            error: txStatus.error || txStatus.data?.tx_error || "Update-stake transaction failed at the contract level.",
            txHash: result.txid
          };
        }
        return { success: true, txHash: result.txid };
      } catch (error) {
        return { success: false, error: `Failed to update stake: ${formatErrorMessage(error)}` };
      }
    };
    /**
     * Unlocks a PoX-5 staking position early (sets unlock to end of current cycle).
     * Reverts if called during the prepare phase — the SDK checks this before submitting.
     * @param note - Optional Fireblocks transaction note.
     * @param nonce - Optional nonce override.
     * @param externalId - Optional Fireblocks external ID for idempotency.
     */
    this.unstake = async (oldSignerManager, note, nonce, externalId) => {
      try {
        if (!this.address || !this.publicKey || !this.vaultAccountId) {
          throw new Error("Address, Public Key or Vault ID are not set");
        }
        const pox = await (0, import_bitcoin_staking2.fetchPoxInfo)({ network: this.pox5Network });
        if ((0, import_bitcoin_staking2.isInPreparePhase)({ burnHeight: pox.currentBurnchainBlockHeight, poxInfo: pox })) {
          return { success: false, error: "Cannot unstake during the prepare phase \u2014 wait for the reward phase to begin." };
        }
        const preflight = await (0, import_bitcoin_staking2.fetchEligibleUnstake)({
          staker: this.address,
          oldSignerManager,
          poxInfo: pox,
          network: this.pox5Network
        });
        if (!preflight.ok) {
          const reasons = preflight.reasons ?? [];
          return { success: false, error: `Cannot unstake: ${this.describeBondReasons(reasons)}` };
        }
        const result = await this.runNonceExclusive(async () => {
          const resolvedNonce = await this.resolveNonce(nonce);
          const tx = await this.buildPox5Call(
            "unstake",
            [import_transactions4.Cl.address(oldSignerManager)],
            {
              nonce: resolvedNonce,
              // Deny mode; unstake performs a PoX unlock with no fixed transfer.
              postConditionMode: import_transactions4.PostConditionMode.Deny,
              postConditions: [import_transactions4.Pc.origin().willPerformPox()]
            }
          );
          return this.pox5SignAndBroadcast(tx, note || "unstake STX", externalId, async () => {
            const nowPox = await (0, import_bitcoin_staking2.fetchPoxInfo)({ network: this.pox5Network });
            return (0, import_bitcoin_staking2.isInPreparePhase)({ burnHeight: nowPox.currentBurnchainBlockHeight, poxInfo: nowPox }) ? "the chain entered the prepare phase during approval" : void 0;
          });
        });
        if (!result || result.error || !result.txid || result.reason) {
          return { success: false, error: result?.error || result?.reason || "Failed to broadcast unstake transaction" };
        }
        const txStatus = await this.waitForTxSettlement(result.txid);
        if (!txStatus.success || txStatus.data?.tx_status !== "success") {
          return {
            success: false,
            unsettled: !txStatus.success,
            error: txStatus.error || txStatus.data?.tx_error || "Unstake transaction failed at the contract level.",
            txHash: result.txid
          };
        }
        return { success: true, txHash: result.txid };
      } catch (error) {
        return { success: false, error: `Failed to unstake: ${formatErrorMessage(error)}` };
      }
    };
    /**
     * Registers the vault's signer key with a signer-manager contract (PoX-5).
     * Calls the signer-manager's `register-self`, which performs BOTH legs atomically:
     *   1. pox-5.grant-signer-key (signer-sig over the signer-manager contract + authId)
     *   2. pox-5.register-signer
     * Must be called once before any stake() calls through that signer-manager.
     *
     * IMPORTANT: `register-self` is admin-gated (authorize-admin). The vault address
     * MUST be an admin on the signer-manager contract, or this reverts with
     * ERR_UNAUTHORIZED_ADMIN (u1002). Calling pox-5.grant-signer-key directly from an
     * EOA fails with ERR_UNAUTHORIZED_SIGNER_REGISTRATION (u26) — hence this path.
     *
     * The grant signature is generated internally via Fireblocks raw signing and is
     * computed over the signer-manager CONTRACT (current-contract), not the caller.
     *
     * @param signerManager - The signer-manager contract principal (ST….signer-manager).
     * @param authId - Monotonically increasing unique uint for replay protection. Never reuse.
     * @param note - Optional Fireblocks transaction note.
     * @param nonce - Optional nonce override.
     * @param externalId - Optional Fireblocks external ID for idempotency.
     */
    this.grantSignerKey = async (signerManager, authId, note, nonce, externalId) => {
      try {
        if (!this.address || !this.publicKey || !this.vaultAccountId) {
          throw new Error("Address, Public Key or Vault ID are not set");
        }
        const smAllowError = this.signerManagerAllowedError(signerManager);
        if (smAllowError) return { success: false, error: smAllowError };
        const [smAddress, smName] = signerManager.split(".");
        if (!smAddress || !smName) {
          throw new Error(`Invalid signer-manager principal: ${signerManager}. Expected ST\u2026.contract-name`);
        }
        const grantExternalId = externalId ? `${externalId}-grant` : void 0;
        const registerExternalId = externalId ? `${externalId}-register` : void 0;
        const result = await this.runNonceExclusive(async () => {
          const resolvedNonce = await this.resolveNonce(nonce);
          const grantMsgHash = await (0, import_bitcoin_staking2.fetchSignerGrantMessageHash)({
            signerManager,
            authId,
            network: this.pox5Network
          });
          const rawGrantSig = await this.fireblocksService.signTransaction(
            grantMsgHash,
            this.vaultAccountId.toString(),
            note || "sign grant signer key message",
            grantExternalId
          );
          const signerSignature = (0, import_common2.signatureVrsToRsv)(concatSignature(rawGrantSig.fullSig, rawGrantSig.v));
          const tx = await (0, import_transactions4.makeUnsignedContractCall)({
            contractAddress: smAddress,
            contractName: smName,
            functionName: "register-self",
            functionArgs: [
              (0, import_transactions4.contractPrincipalCV)(smAddress, smName),
              // signer-manager trait = the contract itself
              (0, import_transactions4.bufferCV)((0, import_common2.hexToBytes)(this.publicKey)),
              // signer-key (buff 33)
              (0, import_transactions4.uintCV)(authId),
              // auth-id
              (0, import_transactions4.bufferCV)((0, import_common2.hexToBytes)(signerSignature))
              // signer-sig (buff 65)
            ],
            publicKey: this.publicKey,
            fee: DEFAULT_POX_FEE_USTX,
            nonce: resolvedNonce,
            network: this.pox5Network,
            postConditionMode: import_transactions4.PostConditionMode.Deny,
            postConditions: []
          });
          return this.pox5SignAndBroadcast(tx, note || "register signer (register-self)", registerExternalId);
        });
        if (!result || result.error || !result.txid || result.reason) {
          return { success: false, error: result?.error || result?.reason || "Failed to broadcast register-self transaction" };
        }
        const txStatus = await this.waitForTxSettlement(result.txid);
        if (!txStatus.success || txStatus.data?.tx_status !== "success") {
          return {
            success: false,
            unsettled: !txStatus.success,
            error: txStatus.error || txStatus.data?.tx_error || "register-self transaction failed at the contract level.",
            txHash: result.txid
          };
        }
        return { success: true, txHash: result.txid };
      } catch (error) {
        return { success: false, error: `Failed to register signer key: ${formatErrorMessage(error)}` };
      }
    };
    /**
     * Revokes an existing signer key grant from a signer-manager (PoX-5).
     * @param signerManager - The signer-manager contract principal.
     * @param signerKey - 33-byte compressed secp256k1 public key (hex) to revoke.
     * @param note - Optional Fireblocks transaction note.
     * @param nonce - Optional nonce override.
     * @param externalId - Optional Fireblocks external ID for idempotency.
     */
    this.revokeSignerGrant = async (signerManager, signerKey, note, nonce, externalId) => {
      try {
        if (!this.address || !this.publicKey || !this.vaultAccountId) {
          throw new Error("Address, Public Key or Vault ID are not set");
        }
        const result = await this.runNonceExclusive(async () => {
          const resolvedNonce = await this.resolveNonce(nonce);
          const tx = await this.buildPox5Call(
            "revoke-signer-grant",
            [import_transactions4.Cl.address(signerManager), import_transactions4.Cl.buffer((0, import_common2.hexToBytes)(signerKey))],
            {
              nonce: resolvedNonce,
              // Deny mode with no post-conditions: revoking a signer grant records no
              // PoX/Stacking action and moves no assets, so there is nothing for the
              // node's action gate to cover. A will-perform-PoX condition here would be
              // uncovered and the node would reject the transaction after signing.
              postConditionMode: import_transactions4.PostConditionMode.Deny,
              postConditions: []
            }
          );
          return this.pox5SignAndBroadcast(tx, note || "revoke signer grant", externalId);
        });
        if (!result || result.error || !result.txid || result.reason) {
          return { success: false, error: result?.error || result?.reason || "Failed to broadcast revoke-signer-grant transaction" };
        }
        const txStatus = await this.waitForTxSettlement(result.txid);
        if (!txStatus.success || txStatus.data?.tx_status !== "success") {
          return {
            success: false,
            unsettled: !txStatus.success,
            error: txStatus.error || txStatus.data?.tx_error || "Revoke signer grant transaction failed at the contract level.",
            txHash: result.txid
          };
        }
        return { success: true, txHash: result.txid };
      } catch (error) {
        return { success: false, error: `Failed to revoke signer grant: ${formatErrorMessage(error)}` };
      }
    };
    /**
     * Fetches the current PoX-5 staking position for this vault account.
     */
    this.getStakerInfo = async () => {
      try {
        if (!this.address) {
          throw new Error("Address is not set");
        }
        const info = await (0, import_bitcoin_staking2.fetchStakerInfo)({ address: this.address, network: this.pox5Network });
        if (!info.staked) {
          return { success: true, staked: false };
        }
        return {
          success: true,
          staked: true,
          details: {
            amount_stx: microToStx(info.details.amountUstx),
            firstRewardCycle: info.details.firstRewardCycle,
            numCycles: info.details.numCycles,
            signerManager: info.details.signer
          }
        };
      } catch (error) {
        return { success: false, error: `Failed to fetch staker info: ${formatErrorMessage(error)}` };
      }
    };
    /**
     * Verifies the full signer-key grant state for a (signerManager, signerKey) pair.
     *
     * Two distinct checks are performed:
     * 1. grant_exists  — the on-chain grant exists and has NOT been consumed yet
     *                    (fetchVerifySignerKeyGrant). A consumed or missing grant → false.
     * 2. signer_registered — the signer-manager contract has a registered signer key
     *                    (fetchSignerInfo). The grant alone does not mean the signer is
     *                    active; registration is a separate step (register-self / admin path).
     *
     * ready_to_stake is true only when both checks pass.
     *
     * If txid is supplied, the transaction is polled first and its status is included.
     * A non-success tx status causes ready_to_stake to be false regardless of on-chain state.
     */
    this.verifySignerGrant = async (signerManager, txid) => {
      try {
        if (!this.publicKey) throw new Error("Public key is not set");
        const notes = [];
        let txStatus = null;
        if (txid) {
          const poll = await this.waitForTxSettlement(txid);
          txStatus = poll.data?.tx_status ?? null;
          if (txStatus !== "success") {
            notes.push(`Transaction ${txid} did not succeed (status: ${txStatus ?? "unknown"}). A broadcast txid does not guarantee contract success \u2014 Stacks mines aborted transactions.`);
            return { success: true, grant_exists: false, signer_registered: false, ready_to_stake: false, tx_status: txStatus, notes };
          }
        }
        const signerKey = this.publicKey;
        const [grantExists, signerInfo] = await Promise.all([
          (0, import_bitcoin_staking2.fetchVerifySignerKeyGrant)({ signerKey, signerManager, network: this.pox5Network }),
          (0, import_bitcoin_staking2.fetchSignerInfo)({ signerManager, network: this.pox5Network })
        ]);
        const signerRegistered = !!signerInfo?.signerKey;
        const registeredKey = signerInfo?.signerKey ?? null;
        if (!grantExists) {
          notes.push("No unconsumed grant found for this (signerKey, signerManager) pair. Either the grant was never created, has already been consumed (authId reuse), or was revoked.");
        }
        if (!signerRegistered) {
          notes.push("The signer-manager has no registered signer key. The grant alone is not sufficient \u2014 registration (register-self or admin path) must also complete before stakes are accepted.");
        }
        if (grantExists && signerRegistered && registeredKey !== signerKey) {
          notes.push(`The registered key (${registeredKey}) does not match the expected signerKey. The signer-manager may be registered to a different signer.`);
        }
        const readyToStake = grantExists && signerRegistered && registeredKey === signerKey;
        return {
          success: true,
          grant_exists: grantExists,
          signer_registered: signerRegistered,
          registered_key: registeredKey,
          ready_to_stake: readyToStake,
          tx_status: txStatus,
          notes: notes.length ? notes : void 0
        };
      } catch (error) {
        return { success: false, error: `Failed to verify signer grant: ${formatErrorMessage(error)}` };
      }
    };
    this.getPox5Info = async () => {
      try {
        const info = await (0, import_bitcoin_staking2.fetchPoxInfo)({ network: this.pox5Network });
        const data = JSON.parse(JSON.stringify(info, (_, v) => typeof v === "bigint" ? v.toString() : v));
        return { success: true, data };
      } catch (error) {
        return { success: false, error: `Failed to fetch PoX-5 info: ${formatErrorMessage(error)}` };
      }
    };
    /**
     * Validates the SDK's local bond-schedule constants (BOND_GAP_CYCLES / BOND_LENGTH_CYCLES)
     * against the deployed PoX-5 contract's get-bond-l1-unlock-height accessor. Returns the
     * per-index comparison plus a mismatch list; `success:false` means either a definite
     * schedule mismatch or an UNKNOWN chain read failure (see error). The REST server also
     * runs this at boot and refuses to start on a definite mismatch.
     */
    this.validateBondSchedule = async (opts) => {
      const result = await validateBondScheduleAgainstChain({ profile: this.networkProfile, bondIndices: opts?.bondIndices });
      return result.ok ? { success: true, data: result } : { success: false, data: result, error: result.error };
    };
    /**
     * Creates a native coin transaction to transfer funds to a recipient address.
     * @param recipientAddress - The address of the recipient.
     * @param amount - Amount to transfer in STX (number, e.g. 1.5 for 1.5 STX). Converted to microSTX internally.
     * @param grossTransaction - Optional flag indicating if the transaction is gross, if so fee will be deducted from recipient (default is false).
     * @param note - Optional note to be attached to the transaction in raw signing.
     * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
     * @param fee - Optional fee in STX (number). Defaults to network estimate.
     * @returns A promise that resolves to a {CreateTransactionResponse}.
     * @throws {Error} If the address, public key, or vault ID are not set, or if the transaction creation fails.
     */
    this.createNativeTransaction = async (recipientAddress, amount, grossTransaction = false, note, nonce, fee, memo, externalId) => {
      if (!this.address || !this.publicKey || !this.vaultAccountId) {
        throw new Error("Address, Public Key or Vault ID are not set");
      }
      try {
        const paramsValidationResponse = await this.checkParamsAndAdjustAmount(
          recipientAddress,
          amount,
          grossTransaction,
          "STX" /* STX */
        );
        if (!paramsValidationResponse.validParams) {
          return {
            success: false,
            error: `Invalid transaction parameters: ${paramsValidationResponse.reason}`
          };
        }
        const microAmount = paramsValidationResponse.finalAmount;
        const result = await this.buildSignSendTransfer(
          recipientAddress,
          microAmount,
          "STX" /* STX */,
          void 0,
          // token
          void 0,
          // customTokenContractAddress
          void 0,
          // customTokenContractName
          void 0,
          // customTokenAssetName
          note,
          nonce,
          fee !== void 0 ? stxToMicro(fee) : void 0,
          memo,
          externalId
        );
        if (!result || result.error || !result.txid || result.reason) {
          const errorAndReason = result.error && result.reason ? `${result.error} - ${result.reason}` : result.error || result.reason || "unknown error";
          console.error(
            `Transaction broadcast failed: ${formatErrorMessage(errorAndReason)}`
          );
          return {
            success: false,
            error: result?.error ? formatErrorMessage(errorAndReason) : "unknown error"
          };
        }
        return {
          success: true,
          txHash: result.txid
        };
      } catch (error) {
        throw new Error(
          `Failed to create transaction: ${formatErrorMessage(error)}`
        );
      }
    };
    /**
     * Creates a fungible token transaction to transfer funds to a recipient address.
     * @param recipientAddress - The address of the recipient.
     * @param amount - Amount to transfer in STX (number). Converted to microSTX internally.
     * @param token - The type of fungible token to transfer.
     * @param note - Optional note to be attached to the transaction in raw signing.
     * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
     * @returns A promise that resolves to a {CreateTransactionResponse}.
     * @throws {Error} If the address, public key, or vault ID are not set, or if the transaction creation fails.
     */
    this.createFTTransaction = async (recipientAddress, amount, token, customTokenContractAddress, customTokenContractName, customTokenAssetName, note, nonce, externalId) => {
      if (!this.address || !this.publicKey || !this.vaultAccountId) {
        throw new Error("Address, Public Key or Vault ID are not set");
      }
      if (token === "custom-token" /* CUSTOM */) {
        if (!customTokenContractAddress || !customTokenContractName || !customTokenAssetName) {
          return {
            success: false,
            error: `Custom token contract address, name, and asset name must be provided for CUSTOM token type`
          };
        }
      }
      console.log(
        `Creating FT transaction: ${amount} ${token} to ${recipientAddress}`
      );
      try {
        const paramsValidationResponse = await this.checkParamsAndAdjustAmount(
          recipientAddress,
          amount,
          void 0,
          // Gross transaction not applicable for FT transfers
          "Fungible Token" /* FungibleToken */,
          token,
          customTokenContractAddress,
          customTokenContractName
        );
        if (!paramsValidationResponse.validParams) {
          return {
            success: false,
            error: `Invalid transaction parameters: ${paramsValidationResponse.reason}`
          };
        }
        const microAmount = paramsValidationResponse.finalAmount;
        const result = await this.buildSignSendTransfer(
          recipientAddress,
          microAmount,
          "Fungible Token" /* FungibleToken */,
          token,
          customTokenContractAddress,
          customTokenContractName,
          customTokenAssetName,
          note,
          nonce,
          void 0,
          // feeUstx
          void 0,
          // memo
          externalId
        );
        if (!result || result.error || !result.txid || result.reason) {
          const errorAndReason = result?.error && result?.reason ? `${result.error} - ${result.reason}` : result?.error || result?.reason || "unknown error";
          console.error(
            `FT transaction broadcast failed: ${formatErrorMessage(errorAndReason)}`
          );
          return {
            success: false,
            error: formatErrorMessage(errorAndReason)
          };
        }
        return {
          success: true,
          txHash: result.txid
        };
      } catch (error) {
        throw new Error(
          `Failed to create transaction: ${formatErrorMessage(error)}`
        );
      }
    };
    /**
     * Delegate STX to a stacking pool.
     * @param poolsAddress - The address of the stacking pool.
     * @param poolContractName - The contract name of the stacking pool.
     * @param amount - Amount of STX to delegate (number). Converted to microSTX internally.
     * @param lockPeriod - The lock period in cycles.
     * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
     * @returns A promise that resolves to a {CreateTransactionResponse}.
     * @throws {Error} If the address, public key, or vault ID are not set, or if the delegate process fails.
     */
    this.delegateToPool = async (poolsAddress, poolContractName, amount, lockPeriod, nonce, externalId) => {
      if (this.testnet) {
        console.log(`[WARNING] delegateToPool is not supported on testnet.`);
        return {
          success: false,
          error: `delegateToPool is not supported on testnet.`
        };
      }
      if (!this.address || !this.publicKey || !this.vaultAccountId) {
        throw new Error("Address, Public Key or Vault ID are not set");
      }
      try {
        const status = await this.checkStatus();
        if (!status.success) {
          return {
            success: false,
            error: `Failed to check account status before delegating STX: ${status.error}`
          };
        }
        if (status.data?.delegation.is_delegated) {
          return {
            success: false,
            error: `Account already has an active delegation to ${status.data.delegation.delegated_to}, if you wish to change delegation please revoke existing delegation first, run checkStatus for more info.`
          };
        }
        console.log(
          `Delegating ${amount} STX to pool: ${poolsAddress} for ${lockPeriod} cycles`
        );
        const delegateResult = await this.buildSignSendContractCall({
          functionName: "delegate-stx",
          poolAddress: poolsAddress,
          poolContractName,
          amount: stxToMicro(amount),
          lockPeriod,
          nonce,
          externalId
        });
        const assertDelegateResult = assertResultSuccess(delegateResult);
        if (assertDelegateResult.success === false) {
          return {
            success: false,
            error: `Failed to delegate STX: ${assertDelegateResult.error}`
          };
        }
        console.log(
          `Successfully delegated ${amount} STX to pool ${poolsAddress}.${poolContractName}`
        );
        return {
          success: true,
          txHash: delegateResult.txid
        };
      } catch (error) {
        console.error(`Error delegating to pool: ${formatErrorMessage(error)}`);
        return {
          success: false,
          error: `Failed to delegate to pool: ${formatErrorMessage(error)}`
        };
      }
    };
    /**
     * Allows a stacking pool to lock delegated STX on behalf of the delegator.
     * @param poolsAddress - The address of the stacking pool.
     * @param poolContractName - The contract name of the stacking pool.
     * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
     * @returns A promise that resolves to a {CreateTransactionResponse}.
     * @throws {Error} If the address, public key, or vault ID are not set, or if the process fails.
     */
    this.allowContractCaller = async (poolsAddress, poolContractName, nonce, externalId) => {
      if (this.testnet) {
        console.log(`[WARNING] allowContractCaller is not supported on testnet.`);
        return {
          success: false,
          error: `allowContractCaller is not supported on testnet.`
        };
      }
      if (!this.address || !this.publicKey || !this.vaultAccountId) {
        throw new Error("Address, Public Key or Vault ID are not set");
      }
      console.log(
        `Allowing ${poolsAddress}.${poolContractName} as PoX contract caller on behalf of ${this.address}`
      );
      try {
        const allowCallerResult = await this.buildSignSendContractCall({
          functionName: "allow-contract-caller",
          poolAddress: poolsAddress,
          poolContractName,
          nonce,
          externalId
        });
        const assertAllowCallerResult = assertResultSuccess(allowCallerResult);
        if (assertAllowCallerResult.success === false) {
          return {
            success: false,
            error: `Failed to allow contract caller: ${assertAllowCallerResult.error}`
          };
        }
        console.log(
          `Successfully allowed contract caller for pool ${poolsAddress}.${poolContractName}`
        );
        return {
          success: true,
          txHash: allowCallerResult.txid
        };
      } catch (error) {
        console.error(
          `Error allowing contract caller: ${formatErrorMessage(error)}`
        );
        return {
          success: false,
          error: `Failed to allow contract caller: ${formatErrorMessage(error)}`
        };
      }
    };
    /**
     * Revoke any STX delegation to any address for this account.
     * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
     * @returns A promise that resolves to a {CreateTransactionResponse}.
     * @throws {Error} If the address, public key, or vault ID are not set, or if the process fails.
     */
    this.revokeDelegation = async (nonce, externalId) => {
      if (this.testnet) {
        console.log(`[WARNING] revokeDelegation is not supported on testnet.`);
        return {
          success: false,
          error: `revokeDelegation is not supported on testnet.`
        };
      }
      if (!this.address || !this.publicKey || !this.vaultAccountId) {
        throw new Error("Address, Public Key or Vault ID are not set");
      }
      console.log(`Revoking STX delegations from address: ${this.address}`);
      try {
        const revokeResult = await this.buildSignSendContractCall({
          functionName: "revoke-delegate-stx",
          nonce,
          externalId
        });
        const assertDelegateResult = assertResultSuccess(revokeResult);
        if (assertDelegateResult.success === false) {
          return {
            success: false,
            error: `Failed to delegate STX: ${assertDelegateResult.error}`
          };
        }
        console.log(
          `Successfully revoked STX delegations from address ${this.address}`
        );
        return {
          success: true,
          txHash: revokeResult.txid
        };
      } catch (error) {
        console.error(`Error revoking delegation: ${formatErrorMessage(error)}`);
        return {
          success: false,
          error: `Failed to revoke delegation: ${formatErrorMessage(error)}`
        };
      }
    };
    /**
     * Effective sats amount for a bond position: announce-l1-early-exit permanently
     * zeroes the mutable membership amount while the BTC stays locked in a live UTXO, so
     * a zeroed L1 amount falls back to the durable record's immutable funded amount.
     * Single source of truth for every position-reporting surface (getBondPosition,
     * checkStatus) so views cannot disagree about the same bond.
     */
    this.effectiveL1AmountSats = (membership, record) => membership.isL1Lock && membership.amountSats <= BigInt(0) && record?.amountSats ? record.amountSats : membership.amountSats;
    /**
     * Reads the Bitcoin tip height from Esplora, failing CLOSED: a non-2xx response or a
     * non-numeric body (e.g. an HTML error page, where `Number(text)` is NaN and any
     * `NaN < x` guard silently passes) returns null — UNKNOWN — so maturity gates refuse
     * rather than sign a premature CLTV spend on garbage data.
     */
    this.readBtcTipHeight = async () => {
      try {
        const res = await fetch(`${this.esploraBase()}/blocks/tip/height`);
        if (!res.ok) return null;
        const body = (await res.text()).trim();
        if (!/^\d+$/.test(body)) return null;
        return Number(body);
      } catch {
        return null;
      }
    };
    /**
     * Estimates a Bitcoin fee (sats) for a spend of ~`vbytes` from Esplora's
     * `/fee-estimates`, so recovery/rollover spends are broadcast with an adequate fee
     * rather than a fixed guess that can strand a transaction unconfirmed. Falls back to
     * a conservative floor if the estimate is unavailable, so recovery is never blocked.
     */
    this.estimateBtcFeeSats = async (vbytes, confTarget = 6) => {
      try {
        const res = await fetch(`${this.esploraBase()}/fee-estimates`);
        if (!res.ok) throw new Error(`Esplora HTTP ${res.status}`);
        const rates = await res.json();
        const rate = rates[String(confTarget)] ?? rates["6"] ?? rates["1"];
        if (typeof rate !== "number" || !(rate > 0)) throw new Error("no usable fee rate");
        return BigInt(Math.ceil(rate * vbytes));
      } catch {
        return BigInt(Math.max(500, vbytes * 2));
      }
    };
    this.waitForBtcConfirmations = async (btcTxid, required = 3, pollMs = 3e4, timeoutMs = 90 * 6e4) => {
      if (!/^[0-9a-fA-F]{64}$/.test(btcTxid)) {
        throw new Error(`Cannot wait for confirmations on a malformed BTC txid: ${btcTxid}`);
      }
      const deadline = Date.now() + timeoutMs;
      let unknownDepthPolls = 0;
      while (Date.now() < deadline) {
        const status = await this.getBtcTxStatus(btcTxid);
        if (status.success && status.data?.found && status.data.confirmed && status.data.block_hash) {
          if (status.data.confirmations !== null && status.data.confirmations >= required) {
            return { blockHash: status.data.block_hash };
          }
          if (status.data.confirmations === null) {
            if (++unknownDepthPolls >= 10) {
              throw new Error(
                `BTC tx ${btcTxid} is confirmed (block ${status.data.block_height ?? "?"}) but the Esplora tip height has been unreadable for ${unknownDepthPolls} consecutive polls \u2014 cannot verify ${required} confirmations.`
              );
            }
          } else {
            unknownDepthPolls = 0;
          }
        }
        await new Promise((r) => setTimeout(r, pollMs));
      }
      throw new Error(`BTC tx ${btcTxid} did not reach ${required} confirmations within ${timeoutMs / 6e4} minutes`);
    };
    /**
     * Fetches the confirmed BTC transaction, its block header, and its Merkle proof from
     * Esplora, and builds the SPV lockup proof for `register-for-bond` / `renew-bond`.
     * @param outputScript - Expected P2WSH output script the lock transaction must pay to.
     * @param unlockHeight - Burn height at which the lock becomes spendable.
     */
    this.assembleLockupProof = async (btcTxid, blockHash, outputScript, unlockHeight) => {
      const [txHex, headerHex, merkleProof, blockMeta] = await Promise.all([
        fetch(`${this.esploraBase()}/tx/${btcTxid}/hex`).then((r) => r.text()),
        fetch(`${this.esploraBase()}/block/${blockHash}/header`).then((r) => r.text()),
        fetch(`${this.esploraBase()}/tx/${btcTxid}/merkle-proof`).then((r) => r.json()),
        fetch(`${this.esploraBase()}/block/${blockHash}`).then((r) => r.json())
      ]);
      return {
        ...(0, import_bitcoin_staking2.buildLockProof)({
          txHex,
          header: headerHex,
          merkleProof,
          txCount: blockMeta.tx_count,
          expectedScript: outputScript
        }),
        unlockBurnHeight: unlockHeight
      };
    };
    /**
     * Builds an unsigned `register-for-bond` contract call with the corrected output
     * tuple. The pinned `@stacks/bitcoin-staking` `lockupToCV` omits the
     * `unlock-burn-height` field that the pox-5 contract requires per output, so the
     * node rejects every native enrollment/renewal with a `BadFunctionArgument`
     * tuple-type mismatch — and only after the Bitcoin has already been committed.
     * We construct the arguments locally against the current ABI instead of
     * delegating to the dependency builder.
     */
    this.buildRegisterForBondTx = async (args) => {
      const buf = (v) => typeof v === "string" ? import_transactions4.Cl.bufferFromHex(v) : import_transactions4.Cl.buffer(v);
      const bootAddr = this.pox5Network.bootAddress;
      const lockupCV = args.sbtcSats !== void 0 ? import_transactions4.Cl.error(import_transactions4.Cl.uint(args.sbtcSats)) : import_transactions4.Cl.ok(
        import_transactions4.Cl.tuple({
          outputs: import_transactions4.Cl.list(
            (args.outputs ?? []).map(
              (o) => import_transactions4.Cl.tuple({
                height: import_transactions4.Cl.uint(o.height),
                tx: buf(o.tx),
                "output-index": import_transactions4.Cl.uint(o.outputIndex),
                header: buf(o.header),
                "leaf-hashes": import_transactions4.Cl.list(o.leafHashes.map((h) => buf(h))),
                "tx-count": import_transactions4.Cl.uint(o.txCount),
                "tx-index": import_transactions4.Cl.uint(o.txIndex),
                amount: import_transactions4.Cl.uint(o.amount),
                // The field the dependency builder drops, but the contract requires.
                "unlock-burn-height": import_transactions4.Cl.uint(o.unlockBurnHeight)
              })
            )
          ),
          "staker-unlock-bytes": buf(args.unlockBytes ?? new Uint8Array())
        })
      );
      return (0, import_transactions4.makeUnsignedContractCall)({
        contractAddress: bootAddr,
        contractName: "pox-5",
        functionName: "register-for-bond",
        functionArgs: [
          import_transactions4.Cl.uint(args.bondIndex),
          import_transactions4.Cl.address(args.signerManager),
          import_transactions4.Cl.uint(args.amountUstx),
          lockupCV,
          this.encodeSignerCalldata(args.signerCalldata)
        ],
        publicKey: this.publicKey,
        fee: DEFAULT_POX_FEE_USTX,
        nonce: args.nonce,
        network: this.pox5Network,
        // Fail closed: fund-moving PoX-5 calls must opt IN to any asset movement, so
        // the default is Deny with no conditions rather than permissive Allow.
        postConditionMode: args.postConditionMode ?? import_transactions4.PostConditionMode.Deny,
        postConditions: args.postConditions ?? []
      });
    };
    /**
     * Builds an unsigned pox-5 contract call via the fork's `makeUnsignedContractCall`
     * (top-level @stacks/transactions), which — unlike the `@stacks/bitcoin-staking`
     * builders' pinned nested copy — understands the `staking`/`pox` post-condition
     * wire types. Used for the fund-moving PoX-5 calls that must carry deny-mode
     * post-conditions; the dependency builders cannot serialize those here.
     */
    this.buildPox5Call = async (functionName, functionArgs, opts) => {
      const bootAddr = this.pox5Network.bootAddress;
      return (0, import_transactions4.makeUnsignedContractCall)({
        contractAddress: bootAddr,
        contractName: "pox-5",
        functionName,
        functionArgs,
        publicKey: this.publicKey,
        fee: DEFAULT_POX_FEE_USTX,
        nonce: opts.nonce,
        network: this.pox5Network,
        // Fail closed: default to Deny with no conditions so a caller must explicitly
        // authorize any asset movement rather than inheriting permissive Allow.
        postConditionMode: opts.postConditionMode ?? import_transactions4.PostConditionMode.Deny,
        postConditions: opts.postConditions ?? []
      });
    };
    /**
     * Resolves the sBTC token asset for post-conditions from the SELECTED NETWORK's
     * pox-5 configuration — the `pox_5_sbtc_contract` field of GET /v2/pox on the same
     * node used to build and broadcast the transaction. A static mainnet asset id is
     * meaningless on another network, so there is deliberately no table fallback. The
     * asset identifier is `<pox_5_sbtc_contract>::sbtc-token`.
     *
     * Fails closed (returns undefined) when the field is absent, malformed, or its
     * contract address does not belong to the network this SDK operates on. An explicit
     * override is honored ONLY when it exactly matches the contract the node reports; it
     * cannot bypass network validation or select a different token.
     */
    this.resolveSbtcAsset = async (override) => {
      let resolved = this.sbtcAssetCache;
      if (!resolved) {
        let sbtcContractId;
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 15e3);
          try {
            const res = await fetch(`${this.networkProfile.stacksApiUrl}/v2/pox`, { signal: controller.signal });
            if (!res.ok) return void 0;
            const body = await res.json();
            if (typeof body.pox_5_sbtc_contract === "string") {
              sbtcContractId = body.pox_5_sbtc_contract;
            }
          } finally {
            clearTimeout(timer);
          }
        } catch {
          return void 0;
        }
        if (!sbtcContractId) return void 0;
        const [contractAddress, contractName] = sbtcContractId.split(".");
        if (!contractAddress || !contractName) return void 0;
        if (!validateAddress(contractAddress, this.testnet)) return void 0;
        resolved = { contractAddress, contractName, assetName: "sbtc-token" };
        this.sbtcAssetCache = resolved;
      }
      if (override && (override.contractAddress !== resolved.contractAddress || override.contractName !== resolved.contractName || override.assetName !== resolved.assetName)) {
        return void 0;
      }
      return resolved;
    };
    /**
     * Resolves the paired-STX lock amount for a bond. The amount is normally derived
     * from the bond's sats value (`contractMin`). An explicit override is an EXPERT
     * path: it is only honored when a `maxBondStxUstx` policy is configured on the SDK,
     * and only within `[contractMin, maxBondStxUstx]`. This prevents an erroneous or
     * malicious override from locking an unbounded amount of STX for the full bond
     * term. The override is intentionally NOT reachable through the REST server.
     */
    /**
     * When a signer-manager adapter allowlist is configured (registry non-empty), refuse
     * a manager that is not on it BEFORE any funds move — defense in depth over the
     * contract's own signer-grant gate. An empty registry imposes no allowlist.
     */
    this.signerManagerAllowedError = (signerManager) => {
      if (this.signerManagerRegistry.size > 0 && !this.signerManagerRegistry.has(signerManager)) {
        return `Signer manager ${signerManager} is not in the configured signerManagerAdapters allowlist \u2014 refusing to proceed.`;
      }
      return void 0;
    };
    this.resolveBondStxAmount = (contractMin, override) => {
      if (override === void 0) return { amountUstx: contractMin };
      if (this.maxBondStxUstx === void 0) {
        return { error: "A paired-STX amount override requires an explicit maxBondStxUstx policy on the SDK; none is configured." };
      }
      if (override < contractMin) {
        return { error: `Paired-STX override ${microToStx(override)} STX is below the contract minimum ${microToStx(contractMin)} STX for this bond.` };
      }
      if (override > this.maxBondStxUstx) {
        return { error: `Paired-STX override ${microToStx(override)} STX exceeds the configured maxBondStxUstx ceiling ${microToStx(this.maxBondStxUstx)} STX.` };
      }
      return { amountUstx: override };
    };
    /** Renders `fetchEligibleRegisterForBond` reason codes into a readable string. */
    this.describeBondReasons = (reasons) => reasons.map((r) => {
      const d = (0, import_bitcoin_staking2.describePox5Error)(r);
      return d ? `${d.name} (${d.description})` : `code ${r}`;
    }).join("; ");
    /**
     * Rotates a paired bond's signer manager before the bond period starts
     * (canonical `update-bond-registration`). Runs the contract eligibility preflight
     * first, then records the new manager so reward discovery routes to it.
     */
    this.updateBondRegistration = async (signerManager, oldSignerManager, opts) => {
      try {
        if (!this.address || !this.publicKey || !this.vaultAccountId) {
          throw new Error("Address, Public Key or Vault ID are not set");
        }
        const smAllowError = this.signerManagerAllowedError(signerManager);
        if (smAllowError) return { success: false, error: smAllowError };
        const membershipBefore = await (0, import_bitcoin_staking2.fetchBondMembership)({ address: this.address, network: this.pox5Network });
        if (!membershipBefore) {
          return { success: false, error: "No active bond membership to rotate the signer for." };
        }
        let rotateRecord = null;
        if (opts?.rewardBtcAddress === void 0) {
          try {
            rotateRecord = await this.lockRecordStore.loadRecord(this.address, membershipBefore.bondIndex);
          } catch (e) {
            return { success: false, error: `Cannot update bond registration: the reward-destination record for bond ${membershipBefore.bondIndex} is unreadable (${formatErrorMessage(e)}). Refusing to rotate the signer when a persisted reward address might be silently dropped \u2014 retry once the lock-record store is reachable, or pass rewardBtcAddress explicitly.` };
          }
        }
        const rewardBtcAddress = opts?.rewardBtcAddress ?? rotateRecord?.rewardBtcAddress;
        const rewardMaxFeeSats = opts?.rewardMaxFeeSats ?? rotateRecord?.rewardMaxFeeSats;
        let rotateCalldata;
        try {
          rotateCalldata = this.resolveSignerCalldata({ signerCalldata: opts?.signerCalldata, rewardBtcAddress, rewardMaxFeeSats });
        } catch (e) {
          return { success: false, error: `Invalid reward/signer calldata: ${formatErrorMessage(e)}` };
        }
        const eligible = await (0, import_bitcoin_staking2.fetchEligibleUpdateBondRegistration)({
          staker: this.address,
          signerManager,
          oldSignerManager,
          network: this.pox5Network
        });
        if (!eligible.ok) {
          const reasons = eligible.reasons ?? [];
          return { success: false, error: `Cannot update bond registration: ${this.describeBondReasons(reasons)}` };
        }
        const result = await this.runNonceExclusive(async () => {
          const resolvedNonce = await this.resolveNonce(opts?.nonce);
          const tx = await this.buildPox5Call(
            "update-bond-registration",
            [import_transactions4.Cl.address(signerManager), import_transactions4.Cl.address(oldSignerManager), this.encodeSignerCalldata(rotateCalldata)],
            {
              nonce: resolvedNonce,
              // Deny mode; a pre-start signer swap moves no assets but the contract
              // still records a PoX action, which the node's action gate requires be
              // covered by a will-perform-PoX condition.
              postConditionMode: import_transactions4.PostConditionMode.Deny,
              postConditions: [import_transactions4.Pc.origin().willPerformPox()]
            }
          );
          return this.pox5SignAndBroadcast(tx, opts?.note ?? `update-bond-registration-${membershipBefore.bondIndex}`, opts?.externalId);
        });
        if (!result?.txid || result.error || result.reason) {
          return { success: false, error: result?.error ?? result?.reason ?? "broadcast failed" };
        }
        const settled = await this.waitForTxSettlement(result.txid);
        if (!settled.success || settled.data?.tx_status !== "success") {
          return { success: false, unsettled: !settled.success, error: settled.data?.tx_error ?? "update-bond-registration failed on-chain", txHash: result.txid };
        }
        const membershipAfter = await (0, import_bitcoin_staking2.fetchBondMembership)({ address: this.address, network: this.pox5Network }).catch(() => null);
        if (membershipAfter && membershipAfter.bondIndex !== membershipBefore.bondIndex) {
          return {
            success: true,
            txHash: result.txid,
            warning: `Signer rotation confirmed, but the active bond changed from ${membershipBefore.bondIndex} to ${membershipAfter.bondIndex} during the operation; local record not updated \u2014 re-run reward discovery to reconcile.`
          };
        }
        const derivedBondIndex = membershipBefore.bondIndex;
        let existing;
        try {
          existing = await this.lockRecordStore.loadRecord(this.address, derivedBondIndex);
        } catch (e) {
          return {
            success: true,
            txHash: result.txid,
            warning: `Signer rotation confirmed for bond ${derivedBondIndex}, but the lock-record store was UNREADABLE (${formatErrorMessage(e)}) \u2014 the rotated manager was NOT persisted; re-run reward discovery or retry the record update once the store recovers.`
          };
        }
        if (!existing) {
          return {
            success: true,
            txHash: result.txid,
            warning: `Signer rotation confirmed for bond ${derivedBondIndex}, but no durable lock record exists to update \u2014 reward routing for this bond may be stale until a record is present.`
          };
        }
        await this.lockRecordStore.saveRecord(this.address, derivedBondIndex, {
          ...existing,
          signerManager,
          // Keep the persisted reward destination in step with what was just re-supplied
          // (a caller override changes it; otherwise it is unchanged).
          ...rewardBtcAddress !== void 0 ? { rewardBtcAddress } : {},
          ...rewardMaxFeeSats !== void 0 ? { rewardMaxFeeSats } : {}
        });
        return { success: true, txHash: result.txid };
      } catch (error) {
        return { success: false, error: `Failed to update bond registration: ${formatErrorMessage(error)}` };
      }
    };
    // --- PoX-5 BTC Bond methods ---
    /**
     * Creates a native-BTC PoX-5 bond: locks BTC on L1 via Fireblocks and registers
     * the paired STX position on L2 with a full SPV proof.
     *
     * Steps: allowlist check → bond params → STX ratio → lock script → send BTC via
     * Fireblocks → wait for confirmations → assemble SPV proof → register-for-bond.
     *
     * NOTE: This call blocks until Bitcoin confirmations are received (~30 min typical).
     */
    this.createBond = async (bondIndex, btcAmountSats, signerManager, opts) => {
      const committedBtc = {};
      try {
        if (!this.address || !this.publicKey || !this.vaultAccountId) {
          throw new Error("Address, Public Key or Vault ID are not set");
        }
        if (opts?.btcTxid !== void 0 && !/^[0-9a-fA-F]{64}$/.test(opts.btcTxid)) {
          return { success: false, error: `Invalid btcTxid: ${opts.btcTxid} (expected 64 hex chars).` };
        }
        let signerCalldata;
        try {
          signerCalldata = this.resolveSignerCalldata(opts);
        } catch (e) {
          return { success: false, error: `Invalid reward/signer calldata (no BTC committed): ${formatErrorMessage(e)}` };
        }
        const storeError = await this.assertDurableLockStore();
        if (storeError) return { success: false, error: storeError };
        const smAllowError = this.signerManagerAllowedError(signerManager);
        if (smAllowError) return { success: false, error: smAllowError };
        const allowance = await (0, import_bitcoin_staking2.fetchBondAllowance)({ bondIndex, address: this.address, network: this.pox5Network });
        if (allowance < btcAmountSats) {
          return { success: false, error: `Not allowlisted for ${btcAmountSats} sats on bond ${bondIndex} (cap: ${allowance} sats)` };
        }
        const [pox, bond] = await Promise.all([
          (0, import_bitcoin_staking2.fetchPoxInfo)({ network: this.pox5Network }),
          (0, import_bitcoin_staking2.fetchBond)({ bondIndex, network: this.pox5Network })
        ]);
        if (!bond) return { success: false, error: `Bond ${bondIndex} not found` };
        const contractMinUstx = (0, import_bitcoin_staking2.minUstxForSatsAmount)({
          sats: btcAmountSats,
          stxValueRatio: bond.stxValueRatio,
          minUstxRatioBps: bond.minUstxRatioBps
        });
        const amountResolution = this.resolveBondStxAmount(contractMinUstx, opts?.amountUstxOverride);
        if ("error" in amountResolution) return { success: false, error: amountResolution.error };
        const amountUstx = amountResolution.amountUstx;
        const accountStatus = await (0, import_bitcoin_staking2.fetchAccountStatus)({ address: this.address, network: this.pox5Network });
        const unlockedStx = accountStatus.balance;
        const lockedStx = accountStatus.locked ?? BigInt(0);
        if (unlockedStx < DEFAULT_POX_FEE_USTX) {
          return { success: false, error: `Insufficient unlocked STX for the transaction fee: need ${microToStx(DEFAULT_POX_FEE_USTX)} STX unlocked but only ${microToStx(unlockedStx)} available` };
        }
        if (unlockedStx - DEFAULT_POX_FEE_USTX + lockedStx < amountUstx) {
          return { success: false, error: `Insufficient STX to lock ${microToStx(amountUstx)} STX: unlocked-after-fee ${microToStx(unlockedStx - DEFAULT_POX_FEE_USTX)} + locked ${microToStx(lockedStx)} is short` };
        }
        const preflight = await (0, import_bitcoin_staking2.fetchEligibleRegisterForBond)({
          bondIndex,
          staker: this.address,
          amountUstx,
          satsTotal: btcAmountSats,
          signerManager,
          poxInfo: pox,
          network: this.pox5Network
        });
        if (!preflight.ok) {
          const reasons = preflight.reasons ?? [];
          return { success: false, error: `Not eligible to register for bond ${bondIndex} (no BTC committed): ${this.describeBondReasons(reasons)}` };
        }
        const firstBondCycle = (0, import_bitcoin_staking2.firstPox5RewardCycle)(pox);
        if (firstBondCycle === void 0) return { success: false, error: "pox-5 not yet configured on this network" };
        const metadata = (0, import_bitcoin_staking2.buildRegisterMetadata)({
          bondIndex,
          poxInfo: pox,
          bitcoinPublicKey: this.publicKey,
          stxAddress: this.address,
          earlyUnlockBytes: bond.earlyUnlockBytes,
          network: this.pox5Network
        });
        {
          const bootAddr = this.pox5Network?.bootAddress ?? (this.testnet ? "ST000000000000000000002AMW42H" : "SP000000000000000000002Q6VF78");
          const buf = (v) => typeof v === "string" ? import_transactions4.Cl.bufferFromHex(v) : import_transactions4.Cl.buffer(v);
          const rawResult = await (0, import_transactions4.fetchCallReadOnlyFunction)({
            contractAddress: bootAddr,
            contractName: "pox-5",
            functionName: "construct-lockup-output-script",
            functionArgs: [
              import_transactions4.Cl.address(this.address),
              import_transactions4.Cl.uint(metadata.unlockHeight),
              buf(metadata.unlockBytes),
              buf(bond.earlyUnlockBytes)
            ],
            senderAddress: bootAddr,
            network: this.pox5Network
          });
          if (rawResult.type === import_transactions4.ClarityType.ResponseErr) {
            return { success: false, error: `construct-lockup-output-script contract error: ${import_transactions4.Cl.prettyPrint(rawResult.value)}` };
          }
          const inner = rawResult.type === import_transactions4.ClarityType.ResponseOk ? rawResult.value : rawResult;
          const onchainScriptHex = inner.value;
          if ((0, import_common2.bytesToHex)(metadata.outputScript) !== onchainScriptHex.replace(/^0x/, "")) {
            return { success: false, error: `Lockup script mismatch \u2014 SDK: ${(0, import_common2.bytesToHex)(metadata.outputScript)}, contract: ${onchainScriptHex}` };
          }
        }
        if (this.verifyEarlyExitCosignerAtFunding) {
          try {
            await this.verifyCommittedCosignerKey(bond);
          } catch (error) {
            return { success: false, error: `Early-exit cosigner preflight failed (no BTC committed): ${formatErrorMessage(error)}` };
          }
        }
        const fundingExternalId = this.deriveFundingExternalId(bondIndex, metadata.lockAddress);
        let priorRecord;
        try {
          priorRecord = await this.lockRecordStore.loadRecord(this.address, bondIndex);
        } catch (e) {
          return { success: false, error: `Lock-record store unreadable for bond ${bondIndex} (UNKNOWN, not "no prior attempt") \u2014 refusing to fund: ${formatErrorMessage(e)}` };
        }
        const priorAtThisLock = priorRecord?.lockAddress === metadata.lockAddress;
        const callerSuppliedRawCalldata = opts?.signerCalldata !== void 0;
        const effectiveRewardBtcAddress = callerSuppliedRawCalldata ? void 0 : opts?.rewardBtcAddress ?? priorRecord?.rewardBtcAddress;
        const effectiveRewardMaxFeeSats = callerSuppliedRawCalldata ? void 0 : opts?.rewardMaxFeeSats ?? priorRecord?.rewardMaxFeeSats;
        if (signerCalldata === void 0 && effectiveRewardBtcAddress !== void 0) {
          try {
            signerCalldata = this.resolveSignerCalldata({
              rewardBtcAddress: effectiveRewardBtcAddress,
              rewardMaxFeeSats: effectiveRewardMaxFeeSats
            });
          } catch (e) {
            return { success: false, error: `Persisted reward destination for bond ${bondIndex} is invalid (${formatErrorMessage(e)}); cannot resume register-for-bond without dropping reward routing.` };
          }
        }
        const hasInFlightFireblocks = priorAtThisLock && priorRecord.btcTxid === void 0 && priorRecord.fireblocksId !== void 0;
        if (opts?.btcTxid !== void 0 && priorAtThisLock) {
          if (priorRecord.btcTxid !== void 0 && opts.btcTxid !== priorRecord.btcTxid) {
            return {
              success: false,
              error: `Bond ${bondIndex} already has a recorded funding tx ${priorRecord.btcTxid} at this lock address; refusing to replace it with ${opts.btcTxid}. Omit btcTxid to resume the recorded funding, or recover it first.`,
              btcTxid: priorRecord.btcTxid,
              vout: priorRecord.vout
            };
          }
          if (hasInFlightFireblocks) {
            return {
              success: false,
              error: `Bond ${bondIndex} has an in-flight Fireblocks funding transfer (id ${priorRecord.fireblocksId}) at this lock address; refusing to also fund from a supplied btcTxid, which could double-fund the lock. Retry WITHOUT btcTxid to resolve the in-flight transfer, or recover it first.`
            };
          }
        }
        const canResumeFunding = priorRecord?.btcTxid !== void 0 && priorRecord.lockAddress === metadata.lockAddress;
        const staleLockGuard = await this.nativeRecordOverwriteGuard(bondIndex, metadata.lockAddress);
        if (staleLockGuard) return { success: false, error: staleLockGuard, btcTxid: priorRecord?.btcTxid, vout: priorRecord?.vout };
        if (canResumeFunding) {
          const recordedTx = await this.getBtcTxStatus(priorRecord.btcTxid);
          if (!recordedTx.success) {
            return { success: false, error: `Cannot verify the recorded funding tx ${priorRecord.btcTxid} (UNKNOWN) \u2014 refusing to proceed: ${recordedTx.error ?? ""}`, btcTxid: priorRecord.btcTxid, vout: priorRecord.vout };
          }
          if (!recordedTx.data.found) {
            return {
              success: false,
              error: `Recorded funding tx ${priorRecord.btcTxid} for bond ${bondIndex} is not visible on the configured Esplora \u2014 it may have been RBF-bumped by Fireblocks (new txid) or evicted. Look up the transfer by external id ${fundingExternalId} in Fireblocks and retry with opts.btcTxid set to the actual funding txid.`,
              btcTxid: priorRecord.btcTxid,
              vout: priorRecord.vout
            };
          }
        }
        if ((canResumeFunding || hasInFlightFireblocks) && priorRecord.amountSats !== BigInt(btcAmountSats)) {
          return {
            success: false,
            error: `A prior funding attempt for bond ${bondIndex} committed ${priorRecord.amountSats} sats${priorRecord.btcTxid ? ` (txid ${priorRecord.btcTxid})` : ` (Fireblocks id ${priorRecord.fireblocksId})`}; this retry requests ${btcAmountSats} sats. Retry with the funded amount, or recover the prior funding first.`,
            btcTxid: priorRecord.btcTxid,
            vout: priorRecord.vout
          };
        }
        const lockRecord = {
          bondIndex,
          unlockBytes: metadata.unlockBytes,
          lockAddress: metadata.lockAddress,
          unlockHeight: metadata.unlockHeight,
          amountSats: BigInt(btcAmountSats),
          isL1Lock: true,
          signerManager,
          firstRewardCycle: (0, import_bitcoin_staking2.bondPeriodToRewardCycle)({ bondIndex, poxInfo: pox }),
          fundingExternalId,
          // Persist the reward destination so renewBond / updateBondRegistration re-supply
          // the pox-addr calldata rather than dropping it (a `none` map-deletes it).
          ...effectiveRewardBtcAddress !== void 0 ? { rewardBtcAddress: effectiveRewardBtcAddress } : {},
          ...effectiveRewardMaxFeeSats !== void 0 ? { rewardMaxFeeSats: effectiveRewardMaxFeeSats } : {},
          stage: "lock-fixed",
          ...canResumeFunding ? {
            btcTxid: priorRecord.btcTxid,
            vout: priorRecord.vout,
            amountSats: priorRecord.amountSats,
            stage: priorRecord.stage ?? "btc-broadcast"
          } : {}
        };
        await this.lockRecordStore.saveRecord(this.address, bondIndex, lockRecord);
        let btcTxid;
        if (opts?.btcTxid) {
          btcTxid = opts.btcTxid;
          await this.lockRecordStore.saveRecord(this.address, bondIndex, { ...lockRecord, btcTxid, stage: laterStage(lockRecord.stage, "btc-broadcast") });
        } else if (canResumeFunding) {
          btcTxid = priorRecord.btcTxid;
        } else if (hasInFlightFireblocks) {
          try {
            btcTxid = await this.fireblocksService.awaitBitcoinTransaction(priorRecord.fireblocksId);
          } catch (awaitErr) {
            if (FireblocksService.isTerminalTransferFailure(awaitErr)) {
              return {
                success: false,
                error: `The prior Fireblocks funding transfer (id ${priorRecord.fireblocksId}) for bond ${bondIndex} terminally failed: ${formatErrorMessage(awaitErr)}. Its external id ${fundingExternalId} is consumed and cannot be reused, so this lock cannot be re-funded automatically \u2014 enroll under a different bond index, or resolve the transfer in Fireblocks and retry with opts.btcTxid.`
              };
            }
            throw awaitErr;
          }
          await this.lockRecordStore.saveRecord(this.address, bondIndex, { ...lockRecord, btcTxid, fireblocksId: priorRecord.fireblocksId, stage: laterStage(lockRecord.stage, "btc-broadcast") });
        } else {
          await this.lockRecordStore.saveRecord(this.address, bondIndex, { ...lockRecord, stage: laterStage(lockRecord.stage, "funding-requested") });
          let result2;
          try {
            result2 = await this.fireblocksService.createBitcoinTransaction(
              metadata.lockAddress,
              btcAmountSats,
              this.vaultAccountId.toString(),
              opts?.note || `BTC bond ${bondIndex} lock`,
              fundingExternalId,
              // Persist the Fireblocks id the instant the transfer is accepted, BEFORE the
              // confirmation poll — so a timeout/crash here still leaves a durable pointer.
              (fireblocksId) => this.lockRecordStore.saveRecord(this.address, bondIndex, { ...lockRecord, fireblocksId, stage: laterStage(lockRecord.stage, "funding-requested") })
            );
          } catch (fundErr) {
            if (FireblocksService.isDuplicateExternalIdError(fundErr)) {
              const resolved = await this.fireblocksService.resolveBitcoinTransactionByExternalId(fundingExternalId);
              if (!resolved) throw fundErr;
              result2 = resolved;
              await this.lockRecordStore.saveRecord(this.address, bondIndex, { ...lockRecord, fireblocksId: resolved.fireblocksId, stage: laterStage(lockRecord.stage, "funding-requested") });
            } else {
              throw fundErr;
            }
          }
          btcTxid = result2.btcTxid;
          await this.lockRecordStore.saveRecord(this.address, bondIndex, { ...lockRecord, btcTxid, fireblocksId: result2.fireblocksId, stage: laterStage(lockRecord.stage, "btc-broadcast") });
        }
        committedBtc.btcTxid = btcTxid;
        const { blockHash } = await this.waitForBtcConfirmations(btcTxid, opts?.confirmations ?? 3);
        await this.lockRecordStore.saveRecord(this.address, bondIndex, { ...lockRecord, btcTxid, stage: laterStage(lockRecord.stage, "btc-confirmed") });
        const lockupProof = await this.assembleLockupProof(btcTxid, blockHash, metadata.outputScript, metadata.unlockHeight);
        committedBtc.vout = lockupProof.outputIndex;
        await this.lockRecordStore.saveRecord(this.address, bondIndex, {
          ...lockRecord,
          btcTxid,
          vout: lockupProof.outputIndex,
          stage: laterStage(lockRecord.stage, "proof-built")
        });
        const proofPreflight = await (0, import_bitcoin_staking2.fetchEligibleRegisterForBond)({
          bondIndex,
          staker: this.address,
          amountUstx,
          satsTotal: btcAmountSats,
          signerManager,
          poxInfo: pox,
          outputs: [lockupProof],
          network: this.pox5Network
        });
        if (!proofPreflight.ok) {
          const reasons = proofPreflight.reasons ?? [];
          return {
            success: false,
            error: `SPV proof preflight failed for bond ${bondIndex} (BTC is locked; recover via unlockMaturedBond/spendEarlyExitUtxo): ${this.describeBondReasons(reasons)}`,
            btcTxid,
            vout: lockupProof.outputIndex
          };
        }
        const result = await this.runNonceExclusive(async () => {
          const custodyRefund = await this.custodyRefundPostConditions();
          const resolvedNonce = await this.resolveNonce(opts?.nonce);
          const tx = await this.buildRegisterForBondTx({
            bondIndex,
            signerManager,
            amountUstx,
            outputs: [lockupProof],
            unlockBytes: metadata.unlockBytes,
            nonce: resolvedNonce,
            signerCalldata,
            // Bound the paired STX lock to exactly the required amount.
            postConditionMode: import_transactions4.PostConditionMode.Deny,
            postConditions: [import_transactions4.Pc.origin().willSendEq(amountUstx).ustxToLock(), ...custodyRefund.conditions]
          });
          return this.pox5SignAndBroadcast(
            tx,
            opts?.note ?? "register-for-bond",
            opts?.externalId ? `${opts.externalId}-register` : void 0,
            // BTC is already locked at this point; the bond window / eligibility / custody
            // can still change during L2 approval (e.g. ERR_BOND_ALREADY_STARTED). Re-check
            // against the CURRENT height and discard rather than broadcast a doomed
            // register — the BTC remains recoverable and the L2 tx can be retried.
            () => this.revalidateRegisterForBond({
              bondIndex,
              amountUstx,
              satsTotal: btcAmountSats,
              signerManager,
              outputs: [lockupProof],
              expectedCustodySats: custodyRefund.custodiedSats
            })
          );
        });
        if (!result?.txid || result.error || result.reason) {
          console.error("register-for-bond broadcast failed:", JSON.stringify(result));
          const parts = [result?.error, result?.reason, result?.reason_data ? JSON.stringify(result.reason_data) : void 0].filter(Boolean);
          const errMsg = parts.join(" \u2014 ") || "broadcast failed";
          return { success: false, error: errMsg, btcTxid, vout: lockupProof.outputIndex };
        }
        await this.lockRecordStore.saveRecord(this.address, bondIndex, {
          ...lockRecord,
          btcTxid,
          vout: lockupProof.outputIndex,
          stage: "registration-submitted"
        });
        const settled = await this.waitForTxSettlement(result.txid);
        console.log("register-for-bond settlement:", JSON.stringify({ tx_status: settled.data?.tx_status, tx_result: settled.data?.tx_result }));
        if (!settled.success || settled.data?.tx_status !== "success") {
          const txRepr = settled.data?.tx_result?.repr ?? settled.data?.tx_error ?? "";
          return { success: false, unsettled: !settled.success, error: `[${settled.data?.tx_status}] ${txRepr}`.trim(), stacksTxid: result.txid, btcTxid, vout: lockupProof.outputIndex };
        }
        await this.lockRecordStore.saveRecord(this.address, bondIndex, {
          ...lockRecord,
          btcTxid,
          vout: lockupProof.outputIndex,
          stage: "registration-confirmed"
        });
        return {
          success: true,
          btcTxid,
          vout: lockupProof.outputIndex,
          stacksTxid: result.txid,
          lockingAddress: metadata.lockAddress,
          unlockHeight: metadata.unlockHeight,
          amountUstx: amountUstx.toString()
        };
      } catch (error) {
        console.error("createBond error:", error);
        return { success: false, error: `Failed to create bond: ${formatErrorMessage(error)}`, ...committedBtc };
      }
    };
    /**
     * Post-signing re-check for a register-for-bond broadcast (createBond, createSbtcBond,
     * rollSbtcBond, renewBond). Re-runs the eligibility gate at the CURRENT tip — with a
     * freshly fetched poxInfo, never a pre-broadcast snapshot — so a signature that sat in
     * Fireblocks approval is not broadcast into a now-certain contract rejection
     * (prepare-phase entry, bond start, closed rollover window). Returns a reason string to
     * discard the tx, or undefined to proceed.
     *
     * `requireZeroCustody` guards createSbtcBond specifically: its sBTC post-condition asserts
     * the GROSS amount, which is only valid with no prior custody. If custody appeared during
     * the approval window the call is now a rollover — register-for-bond would move only the
     * net difference and the gross post-condition would abort — so discard and route to
     * rollSbtcBond instead.
     *
     * `expectedCustodySats` guards every path whose post-conditions were BUILT from a custody
     * read (the net-delta rollover, and the pox-5 custody-refund condition on native paths):
     * if live custody differs from the baked value, the signed conditions no longer match
     * what the contract will transfer, so discard rather than broadcast a doomed abort.
     *
     * `outputs` threads the SPV lockup proof through for the native-BTC paths, whose
     * eligibility check covers the proof-dependent gates as well.
     */
    this.revalidateRegisterForBond = async (args) => {
      const nowPox = await (0, import_bitcoin_staking2.fetchPoxInfo)({ network: this.pox5Network });
      const needCustody = args.requireZeroCustody || args.expectedCustodySats !== void 0;
      const [recheck, custodied] = await Promise.all([
        (0, import_bitcoin_staking2.fetchEligibleRegisterForBond)({
          bondIndex: args.bondIndex,
          staker: this.address,
          amountUstx: args.amountUstx,
          satsTotal: args.satsTotal,
          signerManager: args.signerManager,
          poxInfo: nowPox,
          ...args.outputs ? { outputs: args.outputs } : {},
          network: this.pox5Network
        }),
        needCustody ? (0, import_bitcoin_staking2.fetchStakerCustodiedSbtc)({ staker: this.address, network: this.pox5Network }) : Promise.resolve(BigInt(0))
      ]);
      if (args.requireZeroCustody && custodied > BigInt(0)) {
        return `staker gained ${custodied} sats of custodied sBTC during approval \u2014 this is now a rollover; use rollSbtcBond (net-delta) instead of createSbtcBond (gross).`;
      }
      if (args.expectedCustodySats !== void 0 && custodied !== args.expectedCustodySats) {
        return `custodied sBTC changed during approval (${args.expectedCustodySats} \u2192 ${custodied} sats) \u2014 the signed post-conditions no longer match the transfer the contract will make; retry to rebuild against current custody.`;
      }
      if (!recheck.ok) {
        const reasons = recheck.reasons ?? [];
        return `bond eligibility changed during approval: ${this.describeBondReasons(reasons)}`;
      }
      return void 0;
    };
    /**
     * Guards the durable record slot at (address, bondIndex) before a write would
     * overwrite it with a record for a DIFFERENT lock. The store holds ONE record per
     * slot, and a native-BTC record may be the only in-SDK pointer to committed Bitcoin
     * (e.g. a renewal whose L2 leg failed) — clobbering it would strand the UTXO behind
     * an out-of-band address scan, and a lost fundingExternalId would drop the
     * idempotency key that prevents a second Fireblocks funding.
     *
     * Refuses when the existing native record either
     *  - has a funding in flight (stage "funding-requested", txid not yet known), or
     *  - has ANY unspent Bitcoin at its lock address — matched by the recorded outpoint
     *    when present, but falling back to any-UTXO-at-address so a stale recorded txid
     *    (e.g. an RBF replacement) with real BTC at the address still refuses.
     * A fully spent lock (already recovered) allows the overwrite. An unreadable store
     * or Bitcoin state refuses (UNKNOWN, never "safe").
     *
     * `newLockAddress` exempts a record for the SAME lock the caller is about to write —
     * those flows own their resume/conflict logic; omit it for sBTC registrations, whose
     * records never legitimately share a slot with a live native lock.
     */
    this.nativeRecordOverwriteGuard = async (bondIndex, newLockAddress) => {
      let existing;
      try {
        existing = await this.lockRecordStore.loadRecord(this.address, bondIndex);
      } catch (e) {
        return `Lock-record store unreadable for bond ${bondIndex} (UNKNOWN) \u2014 refusing to overwrite a possible native-BTC pointer: ${formatErrorMessage(e)}`;
      }
      if (!existing || existing.isL1Lock === false) return void 0;
      if (newLockAddress !== void 0 && existing.lockAddress === newLockAddress) return void 0;
      if (existing.btcTxid === void 0) {
        if (existing.stage === "funding-requested") {
          return `Bond ${bondIndex} has a native funding request in flight (external id ${existing.fundingExternalId ?? "unknown"}, lock ${existing.lockAddress}) \u2014 resolve that attempt before overwriting its record.`;
        }
        return void 0;
      }
      try {
        const res = await fetch(`${this.esploraBase()}/address/${existing.lockAddress}/utxo`);
        if (!res.ok) throw new Error(`Esplora HTTP ${res.status}`);
        const utxos = await res.json();
        const stillLocked = utxos.some((u) => u.txid === existing.btcTxid && (existing.vout === void 0 || u.vout === existing.vout)) || utxos.length > 0;
        if (stillLocked) {
          return `Bond ${bondIndex}'s record points at STILL-LOCKED native BTC (${existing.btcTxid}:${existing.vout ?? "?"} at ${existing.lockAddress}); overwriting it would lose the only pointer \u2014 recover the Bitcoin first (unlockMaturedBond / spendEarlyExitUtxo).`;
        }
        return void 0;
      } catch (e) {
        return `Could not verify bond ${bondIndex}'s recorded native-BTC lock is spent (UNKNOWN, not recovered) \u2014 refusing to overwrite its pointer: ${formatErrorMessage(e)}`;
      }
    };
    /**
     * pox-5→staker sBTC custody-refund post-condition for calls that custody NO sBTC.
     *
     * `register-for-bond` (native lockup) and the STX-only `stake` path both run the
     * contract's internal roll-sbtc with a new sBTC amount of 0, so when the staker
     * currently custodies sBTC the contract refunds the ENTIRE custodied amount from
     * pox-5 during the call. In Deny mode that transfer must be covered or the node
     * aborts the transaction after the signature is spent — on the bond paths, after
     * the Bitcoin is already committed.
     *
     * Returns the FT condition (empty when custody is 0) plus the custody amount so the
     * caller can bake it into its post-signing re-check. Throws when custody is non-zero
     * but the network sBTC asset cannot be resolved: an uncovered refund must refuse to
     * build rather than sign permissively.
     */
    this.custodyRefundPostConditions = async () => {
      const custodiedSats = await (0, import_bitcoin_staking2.fetchStakerCustodiedSbtc)({ staker: this.address, network: this.pox5Network });
      if (custodiedSats <= BigInt(0)) return { conditions: [], custodiedSats: BigInt(0) };
      const sbtcAsset = await this.resolveSbtcAsset();
      if (!sbtcAsset) {
        throw new Error(
          `Staker custodies ${custodiedSats} sats of sBTC that this call would refund from pox-5, but the network sBTC asset could not be resolved (/v2/pox pox_5_sbtc_contract) \u2014 refusing to build without covering the refund.`
        );
      }
      const bootAddr = this.pox5Network.bootAddress;
      const pox5ContractId = `${bootAddr}.pox-5`;
      const sbtcContractId = `${sbtcAsset.contractAddress}.${sbtcAsset.contractName}`;
      return {
        conditions: [import_transactions4.Pc.principal(pox5ContractId).willSendEq(custodiedSats).ft(sbtcContractId, sbtcAsset.assetName)],
        custodiedSats
      };
    };
    /**
     * Registers an sBTC-backed bond: locks the paired STX and transfers sBTC to the
     * contract in a single L2 call (no Bitcoin L1 lock / SPV proof). The sBTC asset
     * defaults to the built-in sBTC contract for this network; pass `sbtcAsset` to
     * override it. Both legs (STX lock + sBTC transfer) are bounded by post-conditions.
     *
     * NOTE: sBTC paths are not yet exercised end-to-end on a live network; validate
     * before production use.
     */
    this.createSbtcBond = async (bondIndex, sbtcSats, signerManager, opts) => {
      try {
        if (!this.address || !this.publicKey || !this.vaultAccountId) {
          throw new Error("Address, Public Key or Vault ID are not set");
        }
        const smAllowError = this.signerManagerAllowedError(signerManager);
        if (smAllowError) return { success: false, error: smAllowError };
        const overwriteError = await this.nativeRecordOverwriteGuard(bondIndex);
        if (overwriteError) return { success: false, error: overwriteError };
        const sbtcAsset = await this.resolveSbtcAsset(opts?.sbtcAsset);
        if (!sbtcAsset) {
          return { success: false, error: "Could not resolve the network sBTC asset (/v2/pox pox_5_sbtc_contract); refusing to build. Any override must exactly match the contract the node reports." };
        }
        const [pox, bond, custodiedSats] = await Promise.all([
          (0, import_bitcoin_staking2.fetchPoxInfo)({ network: this.pox5Network }),
          (0, import_bitcoin_staking2.fetchBond)({ bondIndex, network: this.pox5Network }),
          (0, import_bitcoin_staking2.fetchStakerCustodiedSbtc)({ staker: this.address, network: this.pox5Network })
        ]);
        if (!bond) return { success: false, error: `Bond ${bondIndex} not found` };
        if (custodiedSats > BigInt(0)) {
          return { success: false, error: `Staker already has ${custodiedSats} sats of custodied sBTC \u2014 use rollSbtcBond for a rollover (which moves only the net difference), not createSbtcBond.` };
        }
        const contractMinUstx = (0, import_bitcoin_staking2.minUstxForSatsAmount)({
          sats: sbtcSats,
          stxValueRatio: bond.stxValueRatio,
          minUstxRatioBps: bond.minUstxRatioBps
        });
        const amountResolution = this.resolveBondStxAmount(contractMinUstx, opts?.amountUstxOverride);
        if ("error" in amountResolution) return { success: false, error: amountResolution.error };
        const amountUstx = amountResolution.amountUstx;
        const preflight = await (0, import_bitcoin_staking2.fetchEligibleRegisterForBond)({
          bondIndex,
          staker: this.address,
          amountUstx,
          satsTotal: sbtcSats,
          signerManager,
          poxInfo: pox,
          network: this.pox5Network
        });
        if (!preflight.ok) {
          const reasons = preflight.reasons ?? [];
          return { success: false, error: `Not eligible to register sBTC bond ${bondIndex}: ${this.describeBondReasons(reasons)}` };
        }
        const sbtcContractId = `${sbtcAsset.contractAddress}.${sbtcAsset.contractName}`;
        const result = await this.runNonceExclusive(async () => {
          const resolvedNonce = await this.resolveNonce(opts?.nonce);
          const tx = await this.buildRegisterForBondTx({
            bondIndex,
            signerManager,
            amountUstx,
            sbtcSats,
            nonce: resolvedNonce,
            signerCalldata: opts?.signerCalldata,
            // Bound both legs: the paired STX lock and the exact sBTC transfer (the
            // staker is the tx origin, so origin sends both).
            postConditionMode: import_transactions4.PostConditionMode.Deny,
            postConditions: [
              import_transactions4.Pc.origin().willSendEq(amountUstx).ustxToLock(),
              import_transactions4.Pc.origin().willSendEq(sbtcSats).ft(sbtcContractId, sbtcAsset.assetName)
            ]
          });
          return this.pox5SignAndBroadcast(
            tx,
            opts?.note ?? `register-sbtc-bond-${bondIndex}`,
            opts?.externalId,
            () => this.revalidateRegisterForBond({ bondIndex, amountUstx, satsTotal: sbtcSats, signerManager, requireZeroCustody: true })
          );
        });
        if (!result?.txid || result.error || result.reason) {
          return { success: false, error: result?.error ?? result?.reason ?? "broadcast failed" };
        }
        await this.lockRecordStore.saveRecord(this.address, bondIndex, {
          bondIndex,
          unlockBytes: new Uint8Array(),
          lockAddress: "",
          unlockHeight: 0,
          amountSats: sbtcSats,
          isL1Lock: false,
          signerManager,
          firstRewardCycle: (0, import_bitcoin_staking2.bondPeriodToRewardCycle)({ bondIndex, poxInfo: pox })
        });
        const settled = await this.waitForTxSettlement(result.txid);
        if (!settled.success || settled.data?.tx_status !== "success") {
          const repr = settled.data?.tx_result?.repr ?? settled.data?.tx_error ?? "";
          return { success: false, unsettled: !settled.success, error: `[${settled.data?.tx_status}] ${repr}`.trim(), txHash: result.txid };
        }
        return { success: true, txHash: result.txid };
      } catch (error) {
        return { success: false, error: `Failed to create sBTC bond: ${formatErrorMessage(error)}` };
      }
    };
    /**
     * Rolls an existing sBTC-backed position into the next bond period at a (possibly)
     * different sBTC amount. Distinct from the native-BTC `renewBond` (which spends a
     * Bitcoin L1 UTXO); an sBTC rollover is a pure L2 `register-for-bond` that moves only
     * the NET sBTC difference (answers.md §3c):
     *   - increase (new > custodied): the staker sends `new − custodied`;
     *   - decrease (new < custodied): the PoX-5 boot contract sends `custodied − new` back;
     *   - unchanged: no sBTC moves, so no sBTC post-condition is attached.
     * The paired STX leg always asserts the FULL resulting STX lock (answers.md §2a/§2c/§4).
     * The prior custody is read from the contract via `get-staker-custodied-sbtc` so the
     * delta is bounded from chain state, never from a caller-supplied "old" amount.
     *
     * NOTE: sBTC paths are not yet exercised end-to-end on a live network (PoX-5 testnet is
     * not active — answers.md §7); the deterministic post-condition logic is unit-tested,
     * but validate the full flow against a live node before production use.
     *
     * @param nextBondIndex - The bond index to roll into.
     * @param newSbtcSats - The target sBTC amount (sats) for the new position.
     * @param signerManager - The signer-manager principal governing the new position.
     */
    this.rollSbtcBond = async (nextBondIndex, newSbtcSats, signerManager, opts) => {
      try {
        if (!this.address || !this.publicKey || !this.vaultAccountId) {
          throw new Error("Address, Public Key or Vault ID are not set");
        }
        if (newSbtcSats < BigInt(0)) {
          return { success: false, error: "newSbtcSats must be non-negative" };
        }
        const smAllowError = this.signerManagerAllowedError(signerManager);
        if (smAllowError) return { success: false, error: smAllowError };
        const overwriteError = await this.nativeRecordOverwriteGuard(nextBondIndex);
        if (overwriteError) return { success: false, error: overwriteError };
        const sbtcAsset = await this.resolveSbtcAsset(opts?.sbtcAsset);
        if (!sbtcAsset) {
          return { success: false, error: "Could not resolve the network sBTC asset (/v2/pox pox_5_sbtc_contract); refusing to build. Any override must exactly match the contract the node reports." };
        }
        const [pox, bond, custodiedSats] = await Promise.all([
          (0, import_bitcoin_staking2.fetchPoxInfo)({ network: this.pox5Network }),
          (0, import_bitcoin_staking2.fetchBond)({ bondIndex: nextBondIndex, network: this.pox5Network }),
          (0, import_bitcoin_staking2.fetchStakerCustodiedSbtc)({ staker: this.address, network: this.pox5Network })
        ]);
        if (!bond) return { success: false, error: `Bond ${nextBondIndex} not found` };
        const contractMinUstx = (0, import_bitcoin_staking2.minUstxForSatsAmount)({
          sats: newSbtcSats,
          stxValueRatio: bond.stxValueRatio,
          minUstxRatioBps: bond.minUstxRatioBps
        });
        const amountResolution = this.resolveBondStxAmount(contractMinUstx, opts?.amountUstxOverride);
        if ("error" in amountResolution) return { success: false, error: amountResolution.error };
        const amountUstx = amountResolution.amountUstx;
        const preflight = await (0, import_bitcoin_staking2.fetchEligibleRegisterForBond)({
          bondIndex: nextBondIndex,
          staker: this.address,
          amountUstx,
          satsTotal: newSbtcSats,
          signerManager,
          poxInfo: pox,
          network: this.pox5Network
        });
        if (!preflight.ok) {
          const reasons = preflight.reasons ?? [];
          return { success: false, error: `Not eligible to roll sBTC bond into ${nextBondIndex}: ${this.describeBondReasons(reasons)}` };
        }
        const rollover = planSbtcRollover(custodiedSats, newSbtcSats);
        const sbtcContractId = `${sbtcAsset.contractAddress}.${sbtcAsset.contractName}`;
        const bootAddr = this.pox5Network.bootAddress;
        const pox5ContractId = `${bootAddr}.pox-5`;
        const postConditions = [
          // Paired STX: assert the FULL resulting STX lock (register-for-bond records a
          // Stacking action for the full resulting lock — answers.md §2a).
          import_transactions4.Pc.origin().willSendEq(amountUstx).ustxToLock()
        ];
        if (rollover.direction === "origin-sends") {
          postConditions.push(import_transactions4.Pc.origin().willSendEq(rollover.amountSats).ft(sbtcContractId, sbtcAsset.assetName));
        } else if (rollover.direction === "boot-sends") {
          postConditions.push(import_transactions4.Pc.principal(pox5ContractId).willSendEq(rollover.amountSats).ft(sbtcContractId, sbtcAsset.assetName));
        }
        const result = await this.runNonceExclusive(async () => {
          const resolvedNonce = await this.resolveNonce(opts?.nonce);
          const tx = await this.buildRegisterForBondTx({
            bondIndex: nextBondIndex,
            signerManager,
            amountUstx,
            sbtcSats: newSbtcSats,
            nonce: resolvedNonce,
            signerCalldata: opts?.signerCalldata,
            postConditionMode: import_transactions4.PostConditionMode.Deny,
            postConditions
          });
          return this.pox5SignAndBroadcast(
            tx,
            opts?.note ?? `roll-sbtc-bond-${nextBondIndex}`,
            opts?.externalId,
            // The net-delta post-conditions were baked from custodiedSats; a custody change
            // during approval invalidates them, so the re-check compares against it.
            () => this.revalidateRegisterForBond({ bondIndex: nextBondIndex, amountUstx, satsTotal: newSbtcSats, signerManager, expectedCustodySats: custodiedSats })
          );
        });
        if (!result?.txid || result.error || result.reason) {
          return { success: false, error: result?.error ?? result?.reason ?? "broadcast failed" };
        }
        await this.lockRecordStore.saveRecord(this.address, nextBondIndex, {
          bondIndex: nextBondIndex,
          unlockBytes: new Uint8Array(),
          lockAddress: "",
          unlockHeight: 0,
          amountSats: newSbtcSats,
          isL1Lock: false,
          signerManager,
          firstRewardCycle: (0, import_bitcoin_staking2.bondPeriodToRewardCycle)({ bondIndex: nextBondIndex, poxInfo: pox })
        });
        const settled = await this.waitForTxSettlement(result.txid);
        if (!settled.success || settled.data?.tx_status !== "success") {
          const repr = settled.data?.tx_result?.repr ?? settled.data?.tx_error ?? "";
          return { success: false, unsettled: !settled.success, error: `[${settled.data?.tx_status}] ${repr}`.trim(), txHash: result.txid };
        }
        return { success: true, txHash: result.txid };
      } catch (error) {
        return { success: false, error: `Failed to roll sBTC bond: ${formatErrorMessage(error)}` };
      }
    };
    /**
     * Withdraws sBTC from an sBTC-backed membership (`unstake-sbtc`). The pox-5
     * contract transfers the requested sBTC back to the staker, so the call runs in
     * Deny mode with two post-conditions: a will-perform-PoX condition for the PoX
     * action, and an exact FT condition asserting the contract sends exactly
     * `amountToWithdrawSats`. If the sBTC asset cannot be resolved for this network
     * the call refuses to build rather than signing an unbounded withdrawal.
     *
     * NOTE: sBTC paths are not yet exercised end-to-end on a live network.
     */
    this.unstakeSbtc = async (signerManager, amountToWithdrawSats, sbtcAsset, opts) => {
      try {
        if (!this.address || !this.publicKey || !this.vaultAccountId) {
          throw new Error("Address, Public Key or Vault ID are not set");
        }
        const eligible = await (0, import_bitcoin_staking2.fetchEligibleUnstakeSbtc)({
          staker: this.address,
          signerManager,
          amountToWithdrawSats,
          network: this.pox5Network
        });
        if (!eligible.ok) {
          const reasons = eligible.reasons ?? [];
          return { success: false, error: `Cannot unstake sBTC: ${this.describeBondReasons(reasons)}` };
        }
        const resolvedSbtc = await this.resolveSbtcAsset(sbtcAsset);
        if (!resolvedSbtc) {
          return { success: false, error: "Could not resolve the network sBTC asset (/v2/pox pox_5_sbtc_contract); refusing to build an unbounded sBTC withdrawal." };
        }
        const bootAddr = this.pox5Network.bootAddress;
        const pox5ContractId = `${bootAddr}.pox-5`;
        const sbtcContractId = `${resolvedSbtc.contractAddress}.${resolvedSbtc.contractName}`;
        const postConditionMode = import_transactions4.PostConditionMode.Deny;
        const postConditions = [
          import_transactions4.Pc.origin().willPerformPox(),
          import_transactions4.Pc.principal(pox5ContractId).willSendEq(amountToWithdrawSats).ft(sbtcContractId, resolvedSbtc.assetName)
        ];
        const result = await this.runNonceExclusive(async () => {
          const resolvedNonce = await this.resolveNonce(opts?.nonce);
          const tx = await this.buildPox5Call(
            "unstake-sbtc",
            [import_transactions4.Cl.address(signerManager), import_transactions4.Cl.uint(amountToWithdrawSats)],
            { nonce: resolvedNonce, postConditionMode, postConditions }
          );
          return this.pox5SignAndBroadcast(tx, opts?.note ?? "unstake-sbtc", opts?.externalId);
        });
        if (!result?.txid || result.error || result.reason) {
          return { success: false, error: result?.error ?? result?.reason ?? "broadcast failed" };
        }
        const settled = await this.waitForTxSettlement(result.txid);
        if (!settled.success || settled.data?.tx_status !== "success") {
          return { success: false, unsettled: !settled.success, error: settled.data?.tx_error ?? "unstake-sbtc failed on-chain", txHash: result.txid };
        }
        return { success: true, txHash: result.txid };
      } catch (error) {
        return { success: false, error: `Failed to unstake sBTC: ${formatErrorMessage(error)}` };
      }
    };
    /**
     * Returns the current PoX-5 bond position for this vault's address, enriched
     * with live L1 lock state (if BTC-locked) and accrued sats rewards.
     */
    this.getBondPosition = async () => {
      try {
        if (!this.address) throw new Error("Address is not set");
        const [pox, membership, stxOnly] = await Promise.all([
          (0, import_bitcoin_staking2.fetchPoxInfo)({ network: this.pox5Network }),
          (0, import_bitcoin_staking2.fetchBondMembership)({ address: this.address, network: this.pox5Network }),
          (0, import_bitcoin_staking2.fetchStakerInfo)({ address: this.address, network: this.pox5Network })
        ]);
        const stxOnlyData = stxOnly?.staked ? {
          amount_stx: microToStx(stxOnly.details.amountUstx),
          first_reward_cycle: stxOnly.details.firstRewardCycle,
          num_cycles: stxOnly.details.numCycles,
          signer_manager: stxOnly.details.signer
        } : null;
        if (!membership) {
          return { success: true, data: { bond: null, stx_only: stxOnlyData } };
        }
        const firstEarningCycle = (0, import_bitcoin_staking2.bondPeriodToRewardCycle)({ bondIndex: membership.bondIndex, poxInfo: pox });
        const earnedSats = await this.sumOverCycles(
          this.cycleRange(firstEarningCycle, pox.rewardCycleId),
          (cycle) => (0, import_bitcoin_staking2.fetchEarned)({
            signerManager: membership.signer,
            rewardCycle: cycle,
            bondIndex: membership.bondIndex,
            network: this.pox5Network
          }).catch(() => BigInt(0))
        );
        let unlock_height = null;
        let locking_address = null;
        let still_locked = null;
        let blocks_until_unlock = null;
        let record = null;
        if (membership.isL1Lock) {
          try {
            record = await this.lockRecordStore.loadRecord(this.address, membership.bondIndex);
          } catch (e) {
            return { success: false, error: `Lock-record store unreadable for bond ${membership.bondIndex} (UNKNOWN, not "no record") \u2014 refusing to report position state: ${formatErrorMessage(e)}` };
          }
          const bond = await (0, import_bitcoin_staking2.fetchBond)({ bondIndex: membership.bondIndex, network: this.pox5Network });
          if (bond) {
            const meta = (0, import_bitcoin_staking2.buildRegisterMetadata)({
              bondIndex: membership.bondIndex,
              poxInfo: pox,
              bitcoinPublicKey: this.publicKey,
              stxAddress: this.address,
              earlyUnlockBytes: bond.earlyUnlockBytes,
              network: this.pox5Network
            });
            unlock_height = meta.unlockHeight;
            locking_address = meta.lockAddress;
            blocks_until_unlock = Math.max(0, meta.unlockHeight - pox.currentBurnchainBlockHeight);
            try {
              const res = await fetch(`${this.esploraBase()}/address/${meta.lockAddress}/utxo`);
              if (!res.ok) throw new Error(`Esplora HTTP ${res.status}`);
              const utxos = await res.json();
              still_locked = record?.btcTxid !== void 0 && record.vout !== void 0 ? utxos.some((u) => u.txid === record.btcTxid && u.vout === record.vout) : utxos.length > 0;
            } catch {
              still_locked = null;
            }
          }
        }
        const amountSatsBn = this.effectiveL1AmountSats(membership, record);
        const amountBtc = (Number(amountSatsBn) / 1e8).toFixed(8);
        const earnedBtc = (Number(earnedSats) / 1e8).toFixed(8);
        const firstRewardCycle = (0, import_bitcoin_staking2.bondPeriodToRewardCycle)({ bondIndex: membership.bondIndex, poxInfo: pox });
        const cyclesUntilRewards = Math.max(0, firstRewardCycle - pox.rewardCycleId);
        const accountUnlock = await (0, import_bitcoin_staking2.fetchAccountStatus)({ address: this.address, network: this.pox5Network }).then((a) => a.unlockHeight > 0 ? a.unlockHeight : null).catch(() => null);
        const projectedStxUnlock = this.projectedStxUnlockBurnHeight(membership.bondIndex, pox);
        return {
          success: true,
          data: {
            bond: {
              bond_index: membership.bondIndex,
              amount_stx: microToStx(membership.amountUstx),
              amount_ustx: membership.amountUstx.toString(),
              amount_sats: amountSatsBn.toString(),
              amount_btc: amountBtc,
              signer_manager: membership.signer,
              is_l1_lock: membership.isL1Lock,
              first_reward_cycle: firstRewardCycle,
              cycles_until_rewards: cyclesUntilRewards,
              unlock_height,
              locking_address,
              still_locked,
              blocks_until_unlock,
              stx_unlock_burn_height: accountUnlock,
              projected_stx_unlock_burn_height: projectedStxUnlock,
              earned_sats: earnedSats.toString(),
              earned_btc: earnedBtc
            },
            stx_only: stxOnlyData
          }
        };
      } catch (error) {
        return { success: false, error: `Failed to get bond position: ${formatErrorMessage(error)}` };
      }
    };
    /**
     * Verifies the early-exit cosigner service still holds the key committed into `bond`'s
     * early-unlock-bytes. Throws (fail closed) on mismatch or an unreachable/misconfigured
     * service — including an unprovisioned mainnet URL. Shared by the funding-time preflight
     * and the irreversible announce gate so both apply the identical check.
     */
    this.verifyCommittedCosignerKey = async (bond) => {
      const earlyUnlockBytes = typeof bond.earlyUnlockBytes === "string" ? (0, import_common2.hexToBytes)(bond.earlyUnlockBytes) : bond.earlyUnlockBytes;
      const cosigner = new CosignerService(resolveCosignerUrl(this.testnet));
      await cosigner.verifyCommittedKey(earlyUnlockBytes);
    };
    /**
     * Announces an L1 early exit for an active BTC-locked bond (L2 leg only).
     * Zeroes the L2 amountSats; paired STX remains locked through the bond's normal
     * unlock cycle. The L1 BTC recovery (OP_ELSE spend) is a separate step requiring
     * the early-exit signer set.
     */
    this.announceEarlyExit = async (opts) => {
      try {
        if (!this.address || !this.publicKey || !this.vaultAccountId) {
          throw new Error("Address, Public Key or Vault ID are not set");
        }
        const membership = await (0, import_bitcoin_staking2.fetchBondMembership)({ address: this.address, network: this.pox5Network });
        if (!membership) return { success: false, error: "No active bond membership found" };
        if (!membership.isL1Lock) return { success: false, error: "Early exit only applies to L1-locked (native BTC) bonds" };
        const eligible = await (0, import_bitcoin_staking2.fetchEligibleAnnounceL1EarlyExit)({
          staker: this.address,
          oldSignerManager: membership.signer,
          network: this.pox5Network
        });
        if (!eligible.ok) {
          const reasons = eligible.reasons ?? [];
          return { success: false, error: `Cannot announce early exit: ${this.describeBondReasons(reasons)}` };
        }
        const bond = await (0, import_bitcoin_staking2.fetchBond)({ bondIndex: membership.bondIndex, network: this.pox5Network });
        if (!bond) return { success: false, error: `Bond ${membership.bondIndex} not found` };
        try {
          await this.verifyCommittedCosignerKey(bond);
        } catch (error) {
          return { success: false, error: `Refusing to announce early exit \u2014 cannot confirm the cosigner holds this bond's committed key (early exit would be unspendable and its rewards forfeited): ${formatErrorMessage(error)}` };
        }
        const result = await this.runNonceExclusive(async () => {
          const resolvedNonce = await this.resolveNonce(opts?.nonce);
          const tx = await this.buildPox5Call(
            "announce-l1-early-exit",
            [import_transactions4.Cl.address(this.address), import_transactions4.Cl.address(membership.signer)],
            {
              nonce: resolvedNonce,
              // Deny mode; announcing early exit performs a PoX state change only.
              postConditionMode: import_transactions4.PostConditionMode.Deny,
              postConditions: [import_transactions4.Pc.origin().willPerformPox()]
            }
          );
          return this.pox5SignAndBroadcast(tx, opts?.note ?? "announce-l1-early-exit", opts?.externalId, async () => {
            const recheck = await (0, import_bitcoin_staking2.fetchEligibleAnnounceL1EarlyExit)({
              staker: this.address,
              oldSignerManager: membership.signer,
              network: this.pox5Network
            });
            if (!recheck.ok) {
              const reasons = recheck.reasons ?? [];
              return `eligibility changed during approval: ${this.describeBondReasons(reasons)}`;
            }
            return void 0;
          });
        });
        if (!result?.txid || result.error || result.reason) {
          return { success: false, error: result?.error ?? result?.reason ?? "broadcast failed" };
        }
        const settled = await this.waitForTxSettlement(result.txid);
        if (!settled.success || settled.data?.tx_status !== "success") {
          return { success: false, unsettled: !settled.success, error: settled.data?.tx_error ?? "announce-l1-early-exit failed on-chain", txHash: result.txid };
        }
        return { success: true, txHash: result.txid };
      } catch (error) {
        return { success: false, error: `Failed to announce early exit: ${formatErrorMessage(error)}` };
      }
    };
    /**
     * Returns the P2WSH lock address (bcrt1… on testnet, bc1… on mainnet) for a given bond index.
     * Use this to know where to send BTC before calling createBond with a pre-funded btcTxid.
     */
    this.getBondLockAddress = async (bondIndex) => {
      try {
        if (!this.address || !this.publicKey) throw new Error("Address or Public Key not set");
        const [pox, bond] = await Promise.all([
          (0, import_bitcoin_staking2.fetchPoxInfo)({ network: this.pox5Network }),
          (0, import_bitcoin_staking2.fetchBond)({ bondIndex, network: this.pox5Network })
        ]);
        if (!bond) return { success: false, error: `Bond ${bondIndex} not found` };
        const metadata = (0, import_bitcoin_staking2.buildRegisterMetadata)({
          bondIndex,
          poxInfo: pox,
          bitcoinPublicKey: this.publicKey,
          stxAddress: this.address,
          earlyUnlockBytes: bond.earlyUnlockBytes,
          network: this.pox5Network
        });
        return { success: true, data: { lockAddress: metadata.lockAddress, unlockHeight: metadata.unlockHeight } };
      } catch (error) {
        return { success: false, error: `Failed to get bond lock address: ${formatErrorMessage(error)}` };
      }
    };
    /**
     * Funds the bond lock address via the private-1 BTC faucet (testnet only).
     * Returns the faucet txid — pass it as btcTxid in createBond to skip the Fireblocks send.
     */
    this.fundBondLockAddress = async (bondIndex) => {
      if (!this.testnet) return { success: false, error: "Faucet funding is only available on testnet" };
      try {
        const lockResult = await this.getBondLockAddress(bondIndex);
        if (!lockResult.success || !lockResult.data?.lockAddress) return { success: false, error: lockResult.error };
        const { lockAddress } = lockResult.data;
        const res = await fetch(
          `${this.networkProfile.stacksApiUrl}/extended/v1/faucets/btc?address=${lockAddress}`,
          { method: "POST" }
        );
        const body = await res.json();
        if (!body.success) return { success: false, error: body.error ?? "Faucet request failed" };
        return { success: true, data: { txid: body.txid, lockAddress } };
      } catch (error) {
        return { success: false, error: `Failed to fund bond lock address: ${formatErrorMessage(error)}` };
      }
    };
    /**
     * Funds the vault's STX address via the private-1 STX faucet (testnet only).
     * Pass staking=true to request the stacking-sized faucet amount.
     */
    this.fundVault = async (staking = false) => {
      if (!this.testnet) return { success: false, error: "Faucet funding is only available on testnet" };
      try {
        const address = await this.getAddress();
        const url = `${this.networkProfile.stacksApiUrl}/extended/v1/faucets/stx?address=${address}${staking ? "&stacking=true" : ""}`;
        const res = await fetch(url, { method: "POST" });
        const body = await res.json();
        if (!body.success) return { success: false, error: body.error ?? "Faucet request failed" };
        return { success: true, data: { txid: body.txId ?? "", address } };
      } catch (error) {
        return { success: false, error: `Failed to fund vault: ${formatErrorMessage(error)}` };
      }
    };
    this.getRequirements = async (opts) => {
      try {
        const pox = await (0, import_bitcoin_staking2.fetchPoxInfo)({ network: this.pox5Network });
        const safetyCheck = isSafeToSubmit(pox);
        const isPreparePh = (0, import_bitcoin_staking2.isInPreparePhase)({ burnHeight: pox.currentBurnchainBlockHeight, poxInfo: pox });
        const cycle = {
          id: pox.rewardCycleId,
          current_burn_height: pox.currentBurnchainBlockHeight,
          is_prepare_phase: isPreparePh
        };
        const stx_only = {
          safe_to_submit: safetyCheck.safe,
          blocks_until_deadline: Math.max(0, safetyCheck.blocksUntilBoundary - stacks_info.stacking.solo.safetyBlocks),
          blocks_until_safe: safetyCheck.safe ? null : pox.prepareCycleLength + safetyCheck.blocksUntilBoundary
        };
        const firstBondCycle = (0, import_bitcoin_staking2.bondPeriodToRewardCycle)({ bondIndex: 0, poxInfo: pox });
        const boundary = Math.max(0, Math.ceil((pox.rewardCycleId - firstBondCycle) / this.bondGapCycles(pox)));
        const currentBondIndex = boundary > 0 ? boundary - 1 : null;
        let nextOpenBondIndex = null;
        for (const candidate of [boundary, boundary + 1]) {
          const s = await (0, import_bitcoin_staking2.fetchBondStatus)({ bondIndex: candidate, poxInfo: pox, network: this.pox5Network });
          if (s === "open" || s === "eligible") {
            nextOpenBondIndex = candidate;
            break;
          }
        }
        const fetchBondDetails = async (idx) => {
          const [bond, status, allowance] = await Promise.all([
            (0, import_bitcoin_staking2.fetchBond)({ bondIndex: idx, network: this.pox5Network }),
            (0, import_bitcoin_staking2.fetchBondStatus)({ bondIndex: idx, poxInfo: pox, network: this.pox5Network }),
            this.address ? (0, import_bitcoin_staking2.fetchBondAllowance)({ bondIndex: idx, address: this.address, network: this.pox5Network }).catch(() => BigInt(0)) : Promise.resolve(BigInt(0))
          ]);
          if (!bond) return null;
          return {
            bond_index: idx,
            bond_phase: status,
            open_and_allowlisted: allowance > BigInt(0) && (status === "open" || status === "eligible"),
            stx_value_ratio: bond.stxValueRatio.toString(),
            target_rate_bps: bond.targetRateBps,
            min_ustx_ratio_bps: bond.minUstxRatioBps,
            your_allowance_sats: allowance.toString(),
            projected_stx_unlock_burn_height: this.projectedStxUnlockBurnHeight(idx, pox),
            _bond: bond
          };
        };
        const [currentDetails, nextOpenDetails] = await Promise.all([
          currentBondIndex !== null ? fetchBondDetails(currentBondIndex) : Promise.resolve(null),
          nextOpenBondIndex !== null ? fetchBondDetails(nextOpenBondIndex) : Promise.resolve(null)
        ]);
        if (currentDetails === null && nextOpenDetails === null && opts?.bondIndex === void 0) {
          return { success: true, data: { cycle, stx_only } };
        }
        const btc_bond = {
          current_bond: currentDetails ? {
            bond_index: currentDetails.bond_index,
            bond_phase: currentDetails.bond_phase,
            open_and_allowlisted: currentDetails.open_and_allowlisted,
            stx_value_ratio: currentDetails.stx_value_ratio,
            target_rate_bps: currentDetails.target_rate_bps,
            min_ustx_ratio_bps: currentDetails.min_ustx_ratio_bps,
            your_allowance_sats: currentDetails.your_allowance_sats,
            projected_stx_unlock_burn_height: currentDetails.projected_stx_unlock_burn_height
          } : null,
          next_open_bond: nextOpenDetails ? {
            bond_index: nextOpenDetails.bond_index,
            bond_phase: nextOpenDetails.bond_phase,
            open_and_allowlisted: nextOpenDetails.open_and_allowlisted,
            stx_value_ratio: nextOpenDetails.stx_value_ratio,
            target_rate_bps: nextOpenDetails.target_rate_bps,
            min_ustx_ratio_bps: nextOpenDetails.min_ustx_ratio_bps,
            your_allowance_sats: nextOpenDetails.your_allowance_sats,
            projected_stx_unlock_burn_height: nextOpenDetails.projected_stx_unlock_burn_height
          } : null
        };
        if (opts?.btcAmountSats !== void 0 && nextOpenDetails?._bond) {
          const minUstx = (0, import_bitcoin_staking2.minUstxForSatsAmount)({
            sats: opts.btcAmountSats,
            stxValueRatio: nextOpenDetails._bond.stxValueRatio,
            minUstxRatioBps: nextOpenDetails._bond.minUstxRatioBps
          });
          btc_bond.next_open_bond.min_stx_for_sats = microToStx(minUstx);
          btc_bond.next_open_bond.min_ustx_for_sats = minUstx.toString();
        }
        if (opts?.bondIndex !== void 0) {
          const reqDetails = await fetchBondDetails(opts.bondIndex);
          if (reqDetails) {
            btc_bond.requested_bond = {
              bond_index: reqDetails.bond_index,
              bond_phase: reqDetails.bond_phase,
              open_and_allowlisted: reqDetails.open_and_allowlisted,
              stx_value_ratio: reqDetails.stx_value_ratio,
              target_rate_bps: reqDetails.target_rate_bps,
              min_ustx_ratio_bps: reqDetails.min_ustx_ratio_bps,
              your_allowance_sats: reqDetails.your_allowance_sats,
              projected_stx_unlock_burn_height: reqDetails.projected_stx_unlock_burn_height
            };
            if (opts.btcAmountSats !== void 0) {
              const minUstx = (0, import_bitcoin_staking2.minUstxForSatsAmount)({
                sats: opts.btcAmountSats,
                stxValueRatio: reqDetails._bond.stxValueRatio,
                minUstxRatioBps: reqDetails._bond.minUstxRatioBps
              });
              btc_bond.requested_bond.min_stx_for_sats = microToStx(minUstx);
              btc_bond.requested_bond.min_ustx_for_sats = minUstx.toString();
              if (opts.signerManager && this.address) {
                const eligibility = await (0, import_bitcoin_staking2.fetchEligibleRegisterForBond)({
                  bondIndex: opts.bondIndex,
                  staker: this.address,
                  amountUstx: minUstx,
                  satsTotal: opts.btcAmountSats,
                  signerManager: opts.signerManager,
                  poxInfo: pox,
                  network: this.pox5Network
                });
                btc_bond.requested_bond.eligible = eligibility.ok;
                btc_bond.requested_bond.eligibility_reasons = eligibility.ok ? [] : (eligibility.reasons ?? []).map((r) => {
                  const d = (0, import_bitcoin_staking2.describePox5Error)(r);
                  return d ? d.name : `code ${r}`;
                });
              }
            }
          }
        }
        return { success: true, data: { cycle, stx_only, btc_bond } };
      } catch (error) {
        return { success: false, error: `Failed to fetch requirements: ${formatErrorMessage(error)}` };
      }
    };
    // Build the P2WSH output script (OP_0 <32-byte-sha256-of-witnessScript>)
    this.p2wshOutputScript = (witnessScript) => {
      const hash = (0, import_sha23.sha256)(witnessScript);
      const out = new Uint8Array(34);
      out[0] = 0;
      out[1] = 32;
      out.set(hash, 2);
      return out;
    };
    this.broadcastBtc = async (rawHex) => {
      const res = await fetch(`${this.esploraBase()}/tx`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: rawHex
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`BTC broadcast failed (${res.status}): ${body}`);
      }
      return (await res.text()).trim();
    };
    this.btcDerSig = (fullSigHex) => {
      const parsed = import_secp256k14.Signature.fromCompact(fullSigHex);
      const normalized = parsed.hasHighS() ? parsed.normalizeS() : parsed;
      const compact = normalized.toCompactRawBytes();
      const r = compact.slice(0, 32);
      const s = compact.slice(32, 64);
      return toDerSignature(r, s);
    };
    this.signBtcSighash = async (sighash) => {
      const rawSig = await this.fireblocksService.signTransaction(
        (0, import_common2.bytesToHex)(sighash),
        this.vaultAccountId.toString(),
        "BTC P2WSH spend"
      );
      return this.btcDerSig(rawSig.fullSig);
    };
    this.btcSegwitSighash = (tx, inputIndex, witnessScript, amountSats) => {
      return tx.preimageWitnessV0(inputIndex, witnessScript, SigHash.ALL, amountSats);
    };
    this.setP2wshWitness = (tx, inputIndex, items) => {
      tx.updateInput(inputIndex, { finalScriptWitness: items });
    };
    // ─── §5: deriveLock (private) ─────────────────────────────────────────────
    this.deriveLock = async (address, bondIndexOverride) => {
      const addr = address ?? this.address;
      const [pox, membership] = await Promise.all([
        (0, import_bitcoin_staking2.fetchPoxInfo)({ network: this.pox5Network }),
        (0, import_bitcoin_staking2.fetchBondMembership)({ address: addr, network: this.pox5Network }).catch(() => null)
      ]);
      const bondIndex = bondIndexOverride ?? membership?.bondIndex;
      if (bondIndex === void 0) return null;
      if (membership && !membership.isL1Lock && bondIndexOverride === void 0) return null;
      const record = await this.lockRecordStore.loadRecord(addr, bondIndex);
      if (record && record.isL1Lock === false) return null;
      const bond = await (0, import_bitcoin_staking2.fetchBond)({ bondIndex, network: this.pox5Network });
      if (!bond) throw new Error(`Bond ${bondIndex} not found`);
      const unlockBytes = record?.unlockBytes ?? (0, import_bitcoin_staking2.buildUnlockScript)((0, import_common2.hexToBytes)(this.publicKey));
      const unlockHeight = record?.unlockHeight ?? (0, import_bitcoin_staking2.computeBondUnlockHeight)({ bondIndex, poxInfo: pox });
      const lockScriptOpts = {
        stxAddress: addr,
        unlockHeight,
        unlockBytes,
        earlyUnlockBytes: bond.earlyUnlockBytes
      };
      return {
        bondIndex,
        unlockHeight,
        lockScript: (0, import_bitcoin_staking2.buildLockScript)(lockScriptOpts),
        lockingAddress: record?.lockAddress ?? (0, import_bitcoin_staking2.buildLockAddress)({ ...lockScriptOpts, network: this.pox5Network }),
        earlyUnlockBytes: typeof bond.earlyUnlockBytes === "string" ? (0, import_common2.hexToBytes)(bond.earlyUnlockBytes) : bond.earlyUnlockBytes,
        unlockBytes,
        // Use the immutable recorded amount; membership.amountSats is zeroed by
        // announce-l1-early-exit and absent after maturity, so never default to 0
        // for matching (selection is by outpoint below).
        amountSats: record?.amountSats ?? membership?.amountSats ?? BigInt(0),
        // Reaching here means a native L1 lock (the guard above rejects sBTC records,
        // and record-less derivations are native by construction), so a mismatched
        // sBTC membership must not mislabel it.
        isL1Lock: record?.isL1Lock ?? true,
        btcTxid: record?.btcTxid,
        vout: record?.vout
      };
    };
    /**
     * Locates the lock UTXO to spend. Selects by the recorded funding
     * outpoint when available; otherwise falls back to a single unspent output at
     * the bond-specific lock address. A transport failure is surfaced as an error
     * ("unknown"), never silently treated as "already spent" — the previous
     * amount-equality match returned an empty list on both a zeroed amount and a
     * failed read, making a still-locked output look spent.
     */
    this.findLockUtxo = async (lockingAddress, outpoint, opts) => {
      let utxos;
      try {
        const res = await fetch(`${this.esploraBase()}/address/${lockingAddress}/utxo`);
        if (!res.ok) throw new Error(`Esplora HTTP ${res.status}`);
        utxos = await res.json();
      } catch (error) {
        throw new Error(
          `Could not read lock UTXOs for ${lockingAddress} \u2014 treat as UNKNOWN, not spent: ${formatErrorMessage(error)}`
        );
      }
      if (outpoint?.txid !== void 0 && outpoint.vout !== void 0) {
        const match2 = utxos.find((u) => u.txid === outpoint.txid && u.vout === outpoint.vout);
        if (!match2) {
          throw new Error(
            `Lock outpoint ${outpoint.txid}:${outpoint.vout} not found at ${lockingAddress} \u2014 it may already be spent, or the override is wrong.`
          );
        }
        if (opts?.isOperatorOverride && opts.expectedAmountSats !== void 0 && opts.expectedAmountSats > BigInt(0) && BigInt(match2.value) !== opts.expectedAmountSats) {
          throw new Error(
            `Override outpoint ${outpoint.txid}:${outpoint.vout} has value ${match2.value} sats but the expected lock amount is ${opts.expectedAmountSats} sats \u2014 rejecting.`
          );
        }
        return match2;
      }
      if (utxos.length === 1) return utxos[0];
      if (utxos.length === 0) {
        throw new Error(`No unspent lock output found at ${lockingAddress}.`);
      }
      throw new Error(
        `Ambiguous lock UTXO: ${utxos.length} unspent outputs at ${lockingAddress}; a durable lock record or an explicit outpoint override is required to select the correct one.`
      );
    };
    /**
     * Resolves the exact lock UTXO to spend for a recovery. Prefers the immutable
     * recorded funding outpoint; when no record exists, an operator may supply an
     * explicit outpoint, which is validated (unspent, correct P2WSH address/script,
     * and exact expected value) before it is returned. Only when neither is present
     * does it fall back to a single unambiguous output at the lock address.
     */
    /** True if `addr` is a well-formed BTC address for the active Bitcoin network. */
    this.isValidBtcAddressForNetwork = (addr) => {
      try {
        Address(this.btcNetwork).decode(addr);
        return true;
      } catch {
        return false;
      }
    };
    /**
     * Resolves the destination for a native-BTC recovery spend. Under RAW signing the
     * destination is invisible to Fireblocks, so recovery DEFAULTS to the vault's own
     * derived BTC address; any other (external) destination must be explicitly approved
     * via `btcRecoveryAllowlist`. Wrong-network / malformed addresses are rejected
     * before signing.
     */
    this.resolveRecoveryDestination = (requested) => {
      const vaultAddress = this.getBtcVaultAddress();
      if (!vaultAddress) {
        return { error: "Cannot resolve the vault BTC address (public key not set)." };
      }
      if (!requested) return { address: vaultAddress };
      if (!this.isValidBtcAddressForNetwork(requested)) {
        return { error: `Destination ${requested} is not a valid BTC address for this network.` };
      }
      if (requested !== vaultAddress && !this.btcRecoveryAllowlist.includes(requested)) {
        return {
          error: `External BTC destination ${requested} is not approved. Recovery defaults to the vault's own address; add the destination to btcRecoveryAllowlist to permit it.`
        };
      }
      return { address: requested };
    };
    this.resolveRecoveryUtxo = async (lock, override) => {
      if (lock.btcTxid !== void 0 && lock.vout !== void 0) {
        return this.findLockUtxo(lock.lockingAddress, { txid: lock.btcTxid, vout: lock.vout });
      }
      if (override) {
        return this.findLockUtxo(lock.lockingAddress, override, {
          expectedAmountSats: lock.amountSats,
          isOperatorOverride: true
        });
      }
      return this.findLockUtxo(lock.lockingAddress);
    };
    /**
     * Reports a native-BTC bond position by index from the immutable durable lock
     * record plus live Bitcoin UTXO state — independent of Stacks membership, which
     * `announce-l1-early-exit` zeroes and maturity drops. This keeps a mature or
     * exited bond visible and recoverable after its on-chain membership disappears.
     * A Bitcoin lookup failure is reported as UNKNOWN (null), never silently as spent.
     */
    this.getHistoricalBondPosition = async (bondIndex) => {
      try {
        if (!this.address || !this.publicKey) throw new Error("Address or Public Key not set");
        const lock = await this.deriveLock(void 0, bondIndex);
        if (!lock) return { success: false, error: `No native-BTC lock found for bond ${bondIndex}` };
        let still_locked = null;
        let recovered = null;
        let matured = null;
        try {
          const [utxosRes, tipHeight] = await Promise.all([
            fetch(`${this.esploraBase()}/address/${lock.lockingAddress}/utxo`),
            this.readBtcTipHeight()
          ]);
          if (!utxosRes.ok) throw new Error(`Esplora HTTP ${utxosRes.status}`);
          const utxos = await utxosRes.json();
          const isUnspent = lock.btcTxid !== void 0 && lock.vout !== void 0 ? utxos.some((u) => u.txid === lock.btcTxid && u.vout === lock.vout) : utxos.length > 0;
          still_locked = isUnspent;
          recovered = !isUnspent;
          matured = tipHeight !== null ? tipHeight >= lock.unlockHeight : null;
        } catch {
          still_locked = null;
          recovered = null;
          matured = null;
        }
        return {
          success: true,
          data: {
            bond_index: lock.bondIndex,
            amount_sats: lock.amountSats.toString(),
            amount_btc: (Number(lock.amountSats) / 1e8).toFixed(8),
            lock_address: lock.lockingAddress,
            unlock_height: lock.unlockHeight,
            btc_txid: lock.btcTxid ?? null,
            vout: lock.vout ?? null,
            still_locked,
            recovered,
            matured
          }
        };
      } catch (error) {
        return { success: false, error: `Failed to get historical bond position: ${formatErrorMessage(error)}` };
      }
    };
    // ─── §6: unlockMaturedBond ────────────────────────────────────────────────
    /**
     * Spends the matured P2WSH UTXO back to a destination BTC address via the
     * OP_IF (CLTV) branch. Only callable after `unlockHeight` has passed on the
     * BTC chain. No early-exit signer set required — unilateral staker signature.
     */
    this.unlockMaturedBond = async (destinationBtcAddress, opts) => {
      try {
        const dest = this.resolveRecoveryDestination(destinationBtcAddress);
        if ("error" in dest) return { success: false, error: dest.error };
        const destination = dest.address;
        const lock = await this.deriveLock(void 0, opts?.bondIndex);
        if (!lock) return { success: false, error: "No L1-locked bond membership found" };
        const tipHeight = await this.readBtcTipHeight();
        if (tipHeight === null) {
          return { success: false, error: "Could not read the BTC tip height (UNKNOWN) \u2014 refusing to sign a possibly premature CLTV spend." };
        }
        if (tipHeight < lock.unlockHeight) {
          return { success: false, error: `Bond not matured: BTC tip ${tipHeight} < unlock height ${lock.unlockHeight}` };
        }
        const utxo = opts?.knownUtxo ?? await this.resolveRecoveryUtxo(lock, opts?.outpointOverride);
        const feeSats = opts?.feeSats ?? await this.estimateBtcFeeSats(this.RECOVERY_SPEND_VBYTES);
        const actualUtxoSats = BigInt(utxo.value);
        const outputAmount = actualUtxoSats - feeSats;
        if (outputAmount < this.BTC_DUST_LIMIT_SATS) return { success: false, error: `Fee ${feeSats} sats leaves ${outputAmount} sats, below the dust limit ${this.BTC_DUST_LIMIT_SATS} \u2014 lower the fee (locked ${actualUtxoSats} sats).` };
        const p2wshScript = this.p2wshOutputScript(lock.lockScript);
        const tx = new Transaction2({ lockTime: lock.unlockHeight });
        tx.addInput({
          txid: utxo.txid,
          index: utxo.vout,
          sequence: 4294967293,
          // BIP-125 replaceable (still < 0xffffffff, so CLTV holds)
          witnessUtxo: { script: p2wshScript, amount: actualUtxoSats },
          witnessScript: lock.lockScript
        });
        tx.addOutputAddress(destination, outputAmount, this.btcNetwork);
        const sighash = this.btcSegwitSighash(tx, 0, lock.lockScript, actualUtxoSats);
        const stakerSig = await this.signBtcSighash(sighash);
        this.setP2wshWitness(tx, 0, [stakerSig, new Uint8Array([1]), lock.lockScript]);
        const rawHex = (0, import_common2.bytesToHex)(tx.extract());
        const btcTxid = await this.broadcastBtc(rawHex);
        return { success: true, btcTxid };
      } catch (error) {
        return { success: false, error: `Failed to unlock matured bond: ${formatErrorMessage(error)}` };
      }
    };
    // ─── §7B: spendEarlyExitUtxo ─────────────────────────────────────────────
    /**
     * Spends the P2WSH UTXO via the OP_ELSE (early-exit) branch. The cosigner
     * leg comes from the external KMS signing service (see cosigner.service.ts).
     * Call `announceEarlyExit()` on L2 first and wait for it to settle — this is
     * pre-checked on-chain before the cosigner is contacted.
     */
    this.spendEarlyExitUtxo = async (destinationBtcAddress, opts) => {
      try {
        const dest = this.resolveRecoveryDestination(destinationBtcAddress);
        if ("error" in dest) return { success: false, error: dest.error };
        const destination = dest.address;
        const lock = await this.deriveLock(void 0, opts?.bondIndex);
        if (!lock) return { success: false, error: "No L1-locked bond membership found" };
        const announced = await (0, import_bitcoin_staking2.fetchHasAnnouncedL1EarlyExit)({
          bondIndex: lock.bondIndex,
          staker: this.address,
          network: this.pox5Network
        });
        if (!announced) {
          return { success: false, error: "announce-l1-early-exit not settled \u2014 call announceEarlyExit first and wait for it to confirm" };
        }
        const utxo = opts?.knownUtxo ?? await this.resolveRecoveryUtxo(lock, opts?.outpointOverride);
        const feeSats = opts?.feeSats ?? await this.estimateBtcFeeSats(this.RECOVERY_SPEND_VBYTES);
        const actualUtxoSats = BigInt(utxo.value);
        const outputAmount = actualUtxoSats - feeSats;
        if (outputAmount < this.BTC_DUST_LIMIT_SATS) return { success: false, error: `Fee ${feeSats} sats leaves ${outputAmount} sats, below the dust limit ${this.BTC_DUST_LIMIT_SATS} \u2014 lower the fee (locked ${actualUtxoSats} sats).` };
        const p2wshScript = this.p2wshOutputScript(lock.lockScript);
        const tx = new Transaction2();
        tx.addInput({
          txid: utxo.txid,
          index: utxo.vout,
          sequence: 4294967293,
          // BIP-125 replaceable (still < 0xffffffff, so CLTV holds)
          witnessUtxo: { script: p2wshScript, amount: actualUtxoSats },
          witnessScript: lock.lockScript
        });
        tx.addOutputAddress(destination, outputAmount, this.btcNetwork);
        const sighash = this.btcSegwitSighash(tx, 0, lock.lockScript, actualUtxoSats);
        const unsignedTxHex = (0, import_common2.bytesToHex)(tx.toBytes(false, false));
        const cosigner = new CosignerService(resolveCosignerUrl(this.testnet));
        const [stakerSig, earlyExitSig] = await Promise.all([
          this.signBtcSighash(sighash),
          cosigner.cosignEarlyExit({
            unsignedTxHex,
            prevoutScriptPubKeyHex: (0, import_common2.bytesToHex)(p2wshScript),
            prevoutValueSats: Number(actualUtxoSats),
            witnessScriptHex: (0, import_common2.bytesToHex)(lock.lockScript),
            expectedSighash: sighash,
            expectedUnlockBytes: lock.earlyUnlockBytes
          })
        ]);
        const preimage = (0, import_bitcoin_staking2.computeRegisterPreimage)(this.address);
        this.setP2wshWitness(tx, 0, [stakerSig, earlyExitSig, preimage, new Uint8Array([]), lock.lockScript]);
        const btcTxid = await this.broadcastBtc((0, import_common2.bytesToHex)(tx.extract()));
        return { success: true, btcTxid };
      } catch (error) {
        return { success: false, error: `Failed to spend early exit UTXO: ${formatErrorMessage(error)}` };
      }
    };
    /**
     * Replaces a still-unconfirmed recovery spend (from unlockMaturedBond or
     * spendEarlyExitUtxo) with a higher-fee transaction (BIP-125 RBF).
     *
     * A recovery spend is one input (the lock UTXO) and one output (the destination), so
     * the fee can only be raised by REDUCING the destination amount — this method never
     * claims to preserve the received amount. It:
     *   - preserves the original lock input and destination address;
     *   - requires the new absolute fee to exceed the original AND to clear the BIP-125
     *     rule-4 increment (≥ 1 sat/vB over the original, so the replacement pays for its
     *     own relay bandwidth) — since the size is fixed, a higher absolute fee is also a
     *     higher fee rate;
     *   - refuses to create a dust output;
     *   - rebuilds, re-authorizes, and re-signs through Fireblocks (fresh signatures);
     *   - rejects if the original is already confirmed or can no longer be found
     *     (dropped/replaced), and if the still-unspent lock UTXO has been spent by a
     *     confirmed transaction the rebuild's UTXO lookup rejects it.
     * The response carries old/new fee and old/new destination amount for display.
     *
     * @param originalTxid - The txid of the recovery spend being replaced.
     * @param newFeeSats - The new absolute fee in sats (must exceed the original fee).
     * @param opts.kind - Force the spend branch; defaults to inferring from bond maturity.
     */
    this.replaceBtcRecoveryFee = async (originalTxid, newFeeSats, opts) => {
      try {
        if (!/^[0-9a-fA-F]{64}$/.test(originalTxid)) {
          return { success: false, error: `Invalid original txid: ${originalTxid}` };
        }
        if (newFeeSats <= BigInt(0)) {
          return { success: false, error: "newFeeSats must be positive" };
        }
        let orig;
        try {
          const res = await fetch(`${this.esploraBase()}/tx/${originalTxid}`);
          if (res.status === 404) {
            return { success: false, error: `Original tx ${originalTxid} not found \u2014 it may already be confirmed and pruned, or replaced/dropped from the mempool. Read its current state before replacing.` };
          }
          if (!res.ok) throw new Error(`Esplora HTTP ${res.status}`);
          orig = await res.json();
        } catch (error) {
          return { success: false, error: `Could not read original tx ${originalTxid} (treat as UNKNOWN, not replaceable): ${formatErrorMessage(error)}` };
        }
        if (orig?.status?.confirmed) {
          return { success: false, error: `Original tx ${originalTxid} is already confirmed (block ${orig.status.block_height}) \u2014 nothing to replace.` };
        }
        const lock = await this.deriveLock(void 0, opts?.bondIndex);
        if (!lock) return { success: false, error: "No L1-locked bond found to replace a recovery spend for." };
        const vin0 = Array.isArray(orig.vin) ? orig.vin[0] : void 0;
        const parsed = {
          confirmed: !!orig?.status?.confirmed,
          blockHeight: orig?.status?.block_height,
          feeSats: BigInt(orig.fee ?? 0),
          // vsize from weight (ceil(weight/4)); Esplora reports weight, not vsize directly.
          vsize: orig.weight ? Math.ceil(Number(orig.weight) / 4) : this.RECOVERY_SPEND_VBYTES,
          destination: Array.isArray(orig.vout) ? orig.vout[0]?.scriptpubkey_address : void 0,
          destinationSats: BigInt((Array.isArray(orig.vout) ? orig.vout[0]?.value : 0) ?? 0),
          outputCount: Array.isArray(orig.vout) ? orig.vout.length : 0,
          lockOutpoint: vin0 ? { txid: vin0.txid, vout: vin0.vout } : void 0,
          prevoutAddress: vin0?.prevout?.scriptpubkey_address
        };
        const check = checkFeeReplacement(
          parsed,
          newFeeSats,
          lock.lockingAddress,
          lock.btcTxid !== void 0 && lock.vout !== void 0 ? { txid: lock.btcTxid, vout: lock.vout } : void 0
        );
        if (!check.ok) return { success: false, error: check.error };
        let branch = opts?.kind;
        if (!branch) {
          const tipHeight = await this.readBtcTipHeight();
          if (tipHeight === null) {
            return { success: false, error: "Could not read the BTC tip height to determine the spend branch; pass opts.kind (matured | early-exit) explicitly." };
          }
          branch = tipHeight >= lock.unlockHeight ? "matured" : "early-exit";
        }
        const lockValueSats = Number(vin0?.prevout?.value ?? lock.amountSats ?? 0);
        if (!Number.isFinite(lockValueSats) || lockValueSats <= 0) {
          return { success: false, error: "Could not determine the lock UTXO value for the replacement (missing prevout value and no recorded lock amount)." };
        }
        const spendOpts = {
          feeSats: newFeeSats,
          bondIndex: opts?.bondIndex,
          knownUtxo: { txid: check.lockOutpoint.txid, vout: check.lockOutpoint.vout, value: lockValueSats }
        };
        const spend = branch === "matured" ? await this.unlockMaturedBond(check.destination, spendOpts) : await this.spendEarlyExitUtxo(check.destination, spendOpts);
        if (!spend.success || !spend.btcTxid) {
          return { success: false, error: spend.error ?? "Replacement spend failed." };
        }
        return {
          success: true,
          btcTxid: spend.btcTxid,
          replacement: {
            oldFeeSats: check.oldFeeSats.toString(),
            newFeeSats: check.newFeeSats.toString(),
            oldDestinationSats: check.oldDestinationSats.toString(),
            newDestinationSats: check.newDestinationSats.toString(),
            feeRateOldSatVb: check.feeRateOldSatVb,
            feeRateNewSatVb: check.feeRateNewSatVb,
            destination: check.destination,
            branch
          }
        };
      } catch (error) {
        return { success: false, error: `Failed to replace recovery fee: ${formatErrorMessage(error)}` };
      }
    };
    /**
     * Returns the early-exit cosigner service's account xpub and metadata —
     * useful for verifying the configured service matches a bond's
     * early-unlock-bytes before attempting an early-exit spend.
     */
    this.getEarlyExitPublicKey = async () => {
      const cosigner = new CosignerService(resolveCosignerUrl(this.testnet));
      return cosigner.getPublicKey();
    };
    // ─── §8: renewBond ───────────────────────────────────────────────────────
    /**
     * Rolls the current bond into the next period atomically:
     * 1. Spends the matured prior P2WSH → next bond's locking address (OP_IF branch)
     * 2. Assembles the SPV proof for the new output
     * 3. Calls register-for-bond for nextBondIndex on L2
     *
     * Must be called inside the re-lock window (after prior unlockHeight, before next bond starts).
     */
    this.renewBond = async (nextBondIndex, signerManager, opts) => {
      const committedBtc = {};
      try {
        if (!this.address || !this.publicKey || !this.vaultAccountId) {
          throw new Error("Address, Public Key or Vault ID are not set");
        }
        const storeError = await this.assertDurableLockStore();
        if (storeError) return { success: false, error: storeError };
        const smAllowError = this.signerManagerAllowedError(signerManager);
        if (smAllowError) return { success: false, error: smAllowError };
        const [pox, nextBond] = await Promise.all([
          (0, import_bitcoin_staking2.fetchPoxInfo)({ network: this.pox5Network }),
          (0, import_bitcoin_staking2.fetchBond)({ bondIndex: nextBondIndex, network: this.pox5Network })
        ]);
        if (!nextBond) return { success: false, error: `Next bond ${nextBondIndex} not found` };
        const nextMeta = (0, import_bitcoin_staking2.buildRegisterMetadata)({
          bondIndex: nextBondIndex,
          poxInfo: pox,
          bitcoinPublicKey: this.publicKey,
          stxAddress: this.address,
          earlyUnlockBytes: nextBond.earlyUnlockBytes,
          network: this.pox5Network
        });
        const onchainNext = await (0, import_bitcoin_staking2.fetchConstructLockupOutputScript)({
          stxAddress: this.address,
          unlockHeight: nextMeta.unlockHeight,
          unlockBytes: nextMeta.unlockBytes,
          earlyUnlockBytes: nextBond.earlyUnlockBytes,
          network: this.pox5Network
        });
        if ((0, import_common2.bytesToHex)(nextMeta.outputScript) !== (0, import_common2.bytesToHex)(onchainNext)) {
          return { success: false, error: "Next bond lockup script mismatch \u2014 NOT proceeding" };
        }
        const currentMembership = await (0, import_bitcoin_staking2.fetchBondMembership)({ address: this.address, network: this.pox5Network }).catch(() => null);
        let priorBondRecord = null;
        if (currentMembership && opts?.rewardBtcAddress === void 0) {
          try {
            priorBondRecord = await this.lockRecordStore.loadRecord(this.address, currentMembership.bondIndex);
          } catch (e) {
            return { success: false, error: `Cannot renew bond: the reward-destination record for bond ${currentMembership.bondIndex} is unreadable (${formatErrorMessage(e)}). Refusing to re-lock BTC when a persisted reward address might be silently dropped \u2014 retry once the lock-record store is reachable, or pass rewardBtcAddress explicitly.` };
          }
        }
        const rewardBtcAddress = opts?.rewardBtcAddress ?? priorBondRecord?.rewardBtcAddress;
        const rewardMaxFeeSats = opts?.rewardMaxFeeSats ?? priorBondRecord?.rewardMaxFeeSats;
        let signerCalldata;
        try {
          signerCalldata = this.resolveSignerCalldata({ signerCalldata: opts?.signerCalldata, rewardBtcAddress, rewardMaxFeeSats });
        } catch (e) {
          return { success: false, error: `Invalid reward/signer calldata (no BTC re-locked): ${formatErrorMessage(e)}` };
        }
        const nextRecordFor = (amountSats, extra = {}) => ({
          bondIndex: nextBondIndex,
          unlockBytes: nextMeta.unlockBytes,
          lockAddress: nextMeta.lockAddress,
          unlockHeight: nextMeta.unlockHeight,
          amountSats,
          isL1Lock: true,
          signerManager,
          firstRewardCycle: (0, import_bitcoin_staking2.bondPeriodToRewardCycle)({ bondIndex: nextBondIndex, poxInfo: pox }),
          // Carry the reward destination onto the new position's record.
          ...rewardBtcAddress !== void 0 ? { rewardBtcAddress } : {},
          ...rewardMaxFeeSats !== void 0 ? { rewardMaxFeeSats } : {},
          ...extra
        });
        const requiredUstx = (sats) => (0, import_bitcoin_staking2.minUstxForSatsAmount)({
          sats,
          stxValueRatio: nextBond.stxValueRatio,
          minUstxRatioBps: nextBond.minUstxRatioBps
        });
        const staleLockGuard = await this.nativeRecordOverwriteGuard(nextBondIndex, nextMeta.lockAddress);
        if (staleLockGuard) return { success: false, error: staleLockGuard };
        let priorNextRecord;
        try {
          priorNextRecord = await this.lockRecordStore.loadRecord(this.address, nextBondIndex);
        } catch (e) {
          return { success: false, error: `Lock-record store unreadable for bond ${nextBondIndex} (UNKNOWN, not "no prior attempt") \u2014 refusing to re-lock: ${formatErrorMessage(e)}` };
        }
        let resumeRelock = priorNextRecord?.btcTxid !== void 0 && priorNextRecord.lockAddress === nextMeta.lockAddress;
        let rebuildingOverDeadTxid = false;
        if (resumeRelock) {
          const recordedTx = await this.getBtcTxStatus(priorNextRecord.btcTxid);
          if (!recordedTx.success) {
            return { success: false, error: `Cannot verify the recorded re-lock tx ${priorNextRecord.btcTxid} (UNKNOWN) \u2014 refusing to proceed: ${recordedTx.error ?? ""}` };
          }
          if (!recordedTx.data.found) {
            resumeRelock = false;
            rebuildingOverDeadTxid = true;
          }
        }
        let btcTxid;
        let outputAmount;
        if (resumeRelock) {
          btcTxid = priorNextRecord.btcTxid;
          outputAmount = priorNextRecord.amountSats;
          committedBtc.btcTxid = btcTxid;
        } else {
          const prior = await this.deriveLock();
          if (!prior) return { success: false, error: "No current L1 bond to renew" };
          const tipHeight = await this.readBtcTipHeight();
          if (tipHeight === null) {
            return { success: false, error: "Could not read the BTC tip height (UNKNOWN) \u2014 refusing to sign a possibly premature CLTV re-lock." };
          }
          if (tipHeight < prior.unlockHeight) {
            return { success: false, error: `Prior bond not matured: BTC tip ${tipHeight} < unlock height ${prior.unlockHeight}` };
          }
          const utxo = await this.findLockUtxo(prior.lockingAddress, { txid: prior.btcTxid, vout: prior.vout });
          const feeSats = opts?.feeSats ?? await this.estimateBtcFeeSats(this.RECOVERY_SPEND_VBYTES);
          const actualUtxoSats = BigInt(utxo.value);
          outputAmount = actualUtxoSats - feeSats;
          if (outputAmount < this.BTC_DUST_LIMIT_SATS) return { success: false, error: `Fee ${feeSats} sats leaves ${outputAmount} sats, below the dust limit ${this.BTC_DUST_LIMIT_SATS} \u2014 lower the fee (locked ${actualUtxoSats} sats).` };
          const preflight = await (0, import_bitcoin_staking2.fetchEligibleRegisterForBond)({
            bondIndex: nextBondIndex,
            staker: this.address,
            amountUstx: requiredUstx(outputAmount),
            satsTotal: outputAmount,
            signerManager,
            poxInfo: pox,
            network: this.pox5Network
          });
          if (!preflight.ok) {
            const reasons = preflight.reasons ?? [];
            return { success: false, error: `Next bond ${nextBondIndex} not eligible (no BTC re-locked): ${this.describeBondReasons(reasons)}` };
          }
          const priorP2wshScript = this.p2wshOutputScript(prior.lockScript);
          const btcTx = new Transaction2({ lockTime: prior.unlockHeight });
          btcTx.addInput({
            txid: utxo.txid,
            index: utxo.vout,
            sequence: 4294967293,
            // BIP-125 replaceable (still < 0xffffffff, so CLTV holds)
            witnessUtxo: { script: priorP2wshScript, amount: actualUtxoSats },
            witnessScript: prior.lockScript
          });
          btcTx.addOutputAddress(nextMeta.lockAddress, outputAmount, this.btcNetwork);
          const sighash = this.btcSegwitSighash(btcTx, 0, prior.lockScript, actualUtxoSats);
          const stakerSig = await this.signBtcSighash(sighash);
          this.setP2wshWitness(btcTx, 0, [stakerSig, new Uint8Array([1]), prior.lockScript]);
          btcTxid = btcTx.id;
          committedBtc.btcTxid = btcTxid;
          await this.lockRecordStore.saveRecord(this.address, nextBondIndex, nextRecordFor(outputAmount, { btcTxid }));
          let broadcastTxid;
          try {
            broadcastTxid = await this.broadcastBtc((0, import_common2.bytesToHex)(btcTx.extract()));
          } catch (e) {
            if (rebuildingOverDeadTxid && priorNextRecord) {
              await this.lockRecordStore.saveRecord(this.address, nextBondIndex, priorNextRecord).catch(() => {
              });
              committedBtc.btcTxid = priorNextRecord.btcTxid;
            }
            throw e;
          }
          if (broadcastTxid !== btcTxid) {
            const bodyIsTxid = /^[0-9a-fA-F]{64}$/.test(broadcastTxid);
            if (bodyIsTxid) {
              await this.lockRecordStore.saveRecord(this.address, nextBondIndex, nextRecordFor(outputAmount, { btcTxid: broadcastTxid })).catch(() => {
              });
            }
            return {
              success: false,
              error: `Broadcast response ${JSON.stringify(broadcastTxid)} does not match the locally computed txid ${btcTxid}; refusing to continue with an inconsistent pointer.`,
              btcTxid: bodyIsTxid ? broadcastTxid : btcTxid
            };
          }
        }
        const amountUstx = requiredUstx(outputAmount);
        const { blockHash } = await this.waitForBtcConfirmations(btcTxid, opts?.confirmations ?? 3);
        const lockupProof = await this.assembleLockupProof(btcTxid, blockHash, nextMeta.outputScript, nextMeta.unlockHeight);
        committedBtc.vout = lockupProof.outputIndex;
        await this.lockRecordStore.saveRecord(this.address, nextBondIndex, nextRecordFor(outputAmount, {
          btcTxid,
          vout: lockupProof.outputIndex,
          ...resumeRelock && priorNextRecord ? { stage: priorNextRecord.stage, fundingExternalId: priorNextRecord.fundingExternalId } : {}
        }));
        const proofPox = await (0, import_bitcoin_staking2.fetchPoxInfo)({ network: this.pox5Network });
        const proofPreflight = await (0, import_bitcoin_staking2.fetchEligibleRegisterForBond)({
          bondIndex: nextBondIndex,
          staker: this.address,
          amountUstx,
          satsTotal: outputAmount,
          signerManager,
          poxInfo: proofPox,
          outputs: [lockupProof],
          network: this.pox5Network
        });
        if (!proofPreflight.ok) {
          const reasons = proofPreflight.reasons ?? [];
          return { success: false, error: `SPV proof preflight failed for bond ${nextBondIndex} (BTC re-locked; recover via unlockMaturedBond/spendEarlyExitUtxo): ${this.describeBondReasons(reasons)}`, btcTxid, vout: lockupProof.outputIndex };
        }
        const result = await this.runNonceExclusive(async () => {
          const custodyRefund = await this.custodyRefundPostConditions();
          const resolvedNonce = await this.resolveNonce(opts?.nonce);
          const stacksTx = await this.buildRegisterForBondTx({
            bondIndex: nextBondIndex,
            signerManager,
            amountUstx,
            outputs: [lockupProof],
            unlockBytes: nextMeta.unlockBytes,
            nonce: resolvedNonce,
            signerCalldata,
            // Bound the paired STX lock to exactly the required amount.
            postConditionMode: import_transactions4.PostConditionMode.Deny,
            postConditions: [import_transactions4.Pc.origin().willSendEq(amountUstx).ustxToLock(), ...custodyRefund.conditions]
          });
          return this.pox5SignAndBroadcast(
            stacksTx,
            opts?.note ?? `renew-bond-${nextBondIndex}`,
            opts?.externalId,
            // The BTC is already re-locked; a window/phase crossing or custody change
            // during Fireblocks approval must discard the tx, not broadcast a doomed one.
            () => this.revalidateRegisterForBond({
              bondIndex: nextBondIndex,
              amountUstx,
              satsTotal: outputAmount,
              signerManager,
              outputs: [lockupProof],
              expectedCustodySats: custodyRefund.custodiedSats
            })
          );
        });
        if (!result?.txid || result.error || result.reason) {
          return { success: false, error: result?.error ?? result?.reason ?? "broadcast failed", btcTxid, vout: lockupProof.outputIndex };
        }
        const settled = await this.waitForTxSettlement(result.txid);
        if (!settled.success || settled.data?.tx_status !== "success") {
          const txRepr = settled.data?.tx_result?.repr ?? settled.data?.tx_error ?? "";
          return { success: false, unsettled: !settled.success, error: `[${settled.data?.tx_status}] ${txRepr}`.trim(), stacksTxid: result.txid, btcTxid, vout: lockupProof.outputIndex };
        }
        return {
          success: true,
          btcTxid,
          vout: lockupProof.outputIndex,
          stacksTxid: result.txid,
          lockingAddress: nextMeta.lockAddress,
          unlockHeight: nextMeta.unlockHeight,
          amountUstx: amountUstx.toString()
        };
      } catch (error) {
        return { success: false, error: `Failed to renew bond: ${formatErrorMessage(error)}`, ...committedBtc };
      }
    };
    // ─── §9: Rewards ─────────────────────────────────────────────────────────
    /**
     * Derives the bond-period indices that can be active at the current burn height
     * from the cycle, rather than scanning a fixed range from zero. Bond indices grow
     * without bound, so a hardcoded cap silently operates on an empty set once the
     * live index exceeds it. The window is anchored on the latest started bond and
     * spans BOND_END_OFFSET_PERIODS periods (≤ 6 bonds).
     */
    /**
     * Projected burn height at which a bond's paired STX unlocks, taken from the
     * dependency's bond phase schedule (the start of the 'unlocked' phase). This is a
     * PROJECTION for display: post-enrollment, the account's node-reported unlock height
     * is the authoritative value and should be preferred where available.
     */
    this.projectedStxUnlockBurnHeight = (bondIndex, pox) => {
      try {
        const unlocked = (0, import_bitcoin_staking2.bondPhaseRanges)({ bondIndex, poxInfo: pox }).find((r) => r.name === "unlocked");
        return unlocked ? unlocked.startBurnHeight : null;
      } catch {
        return null;
      }
    };
    // Cycles between consecutive bond periods (derived rather than importing the
    // constant, which the dependency does not export at the type level).
    this.bondGapCycles = (pox) => (0, import_bitcoin_staking2.bondPeriodToRewardCycle)({ bondIndex: 1, poxInfo: pox }) - (0, import_bitcoin_staking2.bondPeriodToRewardCycle)({ bondIndex: 0, poxInfo: pox });
    /**
     * Distribution "calculation height" — the burn height at which the reward waterfall
     * snapshots the active-bond set. calculate-rewards must submit exactly the bonds
     * active at THIS height, not at the drifting live burn height; near a boundary the
     * two can fall in different cycles, which is the defect FBS-41 fixes.
     *
     * The contract evaluates `(- (distribution-cycle-to-burn-height
     * (current-distribution-cycle)) u1)` — one block BEFORE the current distribution-
     * cycle boundary (pox-5 calculate-rewards). This mirrors that exactly via the same
     * dependency helpers the authoritative fetchEligibleCalculateRewards preflight uses,
     * replacing the earlier reward-cycle-start guess that missed every other
     * distribution half-cycle. Fail-safe either way: a wrong height only makes the node
     * REJECT calculate-rewards (no misdistribution).
     */
    this.calculationHeight = (pox) => (0, import_bitcoin_staking2.distributionCycleToBurnHeight)({ distributionCycle: (0, import_bitcoin_staking2.currentDistributionCycle)(pox), poxInfo: pox }) - 1;
    this.activeBondWindow = (pox, burnHeight) => {
      const currentCycle = (0, import_bitcoin_staking2.burnHeightToRewardCycle)({ burnHeight, poxInfo: pox });
      const firstBondCycle = (0, import_bitcoin_staking2.bondPeriodToRewardCycle)({ bondIndex: 0, poxInfo: pox });
      const gap = this.bondGapCycles(pox);
      const latest = currentCycle <= firstBondCycle ? 0 : Math.floor((currentCycle - firstBondCycle) / gap);
      const windowStart = Math.max(0, latest - (import_bitcoin_staking2.BOND_END_OFFSET_PERIODS - 1));
      const candidates = [];
      for (let i = windowStart; i <= latest; i++) candidates.push(i);
      return candidates;
    };
    this.getActiveBondsSorted = async () => {
      const pox = await (0, import_bitcoin_staking2.fetchPoxInfo)({ network: this.pox5Network });
      const calcHeight = this.calculationHeight(pox);
      const candidates = this.activeBondWindow(pox, calcHeight);
      const results = await Promise.all(
        candidates.map(async (i) => {
          const bond = await (0, import_bitcoin_staking2.fetchBond)({ bondIndex: i, network: this.pox5Network }).catch(() => null);
          if (!bond) return null;
          const active = (0, import_bitcoin_staking2.isBondActiveAtHeight)({ bondIndex: i, burnHeight: calcHeight, poxInfo: pox });
          if (!active) return null;
          return { i, stxValueRatio: bond.stxValueRatio };
        })
      );
      return results.filter((r) => r !== null).sort((a, b) => {
        if (b.stxValueRatio > a.stxValueRatio) return 1;
        if (b.stxValueRatio < a.stxValueRatio) return -1;
        return a.i - b.i;
      }).map((r) => r.i);
    };
    /**
     * Triggers the PoX-5 reward distribution waterfall for the current cycle.
     * Must include ALL active bonds, sorted descending by stxValueRatio (ascending bondIndex as tiebreaker).
     * ERR_DISTRIBUTION_ALREADY_COMPUTED (u30) is benign — rewards were already settled.
     */
    this.calculateRewards = async (opts) => {
      try {
        if (!this.publicKey || !this.vaultAccountId) throw new Error("SDK not initialized");
        const bondIndices = await this.getActiveBondsSorted();
        const preflight = await (0, import_bitcoin_staking2.fetchEligibleCalculateRewards)({ bondIndices, network: this.pox5Network });
        if (!preflight.ok) {
          const reasons = preflight.reasons ?? [];
          return { success: false, error: `Cannot calculate rewards: ${this.describeBondReasons(reasons)}` };
        }
        const result = await this.runNonceExclusive(async () => {
          const resolvedNonce = await this.resolveNonce(opts?.nonce);
          const tx = await (0, import_bitcoin_staking2.buildCalculateRewards)({
            bondIndices,
            publicKey: this.publicKey,
            fee: DEFAULT_POX_FEE_USTX,
            nonce: resolvedNonce,
            network: this.pox5Network
          });
          return this.pox5SignAndBroadcast(tx, opts?.note ?? "calculate-rewards");
        });
        if (!result?.txid || result.error || result.reason) {
          return { success: false, error: result?.error ?? result?.reason ?? "broadcast failed" };
        }
        const settled = await this.waitForTxSettlement(result.txid);
        if (!settled.success || settled.data?.tx_status !== "success") {
          return { success: false, unsettled: !settled.success, error: settled.data?.tx_error ?? "calculate-rewards failed on-chain", txHash: result.txid };
        }
        return { success: true, txHash: result.txid };
      } catch (error) {
        return { success: false, error: `Failed to calculate rewards: ${formatErrorMessage(error)}` };
      }
    };
    this.cycleRange = (startCycle, endCycleExclusive) => {
      const cycles = [];
      for (let cycle = startCycle; cycle < endCycleExclusive; cycle++) cycles.push(cycle);
      return cycles;
    };
    /**
     * Resolves a fetcher across cycles in fixed-size batches. Contract reads are issued
     * one batch at a time to keep a wide cycle range from exhausting node connections.
     */
    this.mapCyclesLimited = async (cycles, fetcher, concurrency = 10) => {
      const values = [];
      for (let i = 0; i < cycles.length; i += concurrency) {
        values.push(...await Promise.all(cycles.slice(i, i + concurrency).map(fetcher)));
      }
      return values;
    };
    this.sumOverCycles = async (cycles, fetcher) => {
      const values = await this.mapCyclesLimited(cycles, fetcher);
      return values.reduce((sum, v) => sum + v, BigInt(0));
    };
    /**
     * Executes the two-step signer-manager reward claim for a single reward cycle.
     * @param claimBondIndices - Bond indices passed to claim-rewards (empty for STX-only stakes).
     * @param stakerBondIndices - One claim-staker-rewards call per entry; `undefined` claims the
     * STX-only share via none() instead of some(bondIndex).
     * @returns The advanced nonce, and an error message if any step failed.
     */
    this.executeClaimCycle = async (signerContractAddress, signerContractName, cycle, claimBondIndices, stakerBondIndices, nonceHolder, note, txHashes, results) => {
      const signerManager = `${signerContractAddress}.${signerContractName}`;
      const uniqueBondIndices = [...new Set(claimBondIndices)].sort((a, b) => a - b);
      const sbtcAsset = await this.resolveSbtcAsset();
      if (!sbtcAsset) {
        return { error: `Cannot resolve the network sBTC asset to bound claim-rewards at cycle ${cycle}; refusing to broadcast an unbounded reward claim.` };
      }
      const bootAddr = this.pox5Network.bootAddress;
      const pox5ContractId = `${bootAddr}.pox-5`;
      const sbtcContractId = `${sbtcAsset.contractAddress}.${sbtcAsset.contractName}`;
      let totalRewards;
      const accruedByBond = /* @__PURE__ */ new Map();
      let noneAccrued = BigInt(0);
      try {
        const earned = await Promise.all([
          (0, import_bitcoin_staking2.fetchEarned)({ signerManager, rewardCycle: cycle, network: this.pox5Network }),
          ...uniqueBondIndices.map(
            (idx) => (0, import_bitcoin_staking2.fetchEarned)({ signerManager, rewardCycle: cycle, bondIndex: idx, network: this.pox5Network })
          )
        ]);
        totalRewards = earned.reduce((sum, e) => sum + e, BigInt(0));
        noneAccrued = earned[0] ?? BigInt(0);
        uniqueBondIndices.forEach((idx, i) => accruedByBond.set(idx, earned[i + 1] ?? BigInt(0)));
      } catch (error) {
        return { error: `Could not read earned rewards to bound claim-rewards at cycle ${cycle}: ${formatErrorMessage(error)}` };
      }
      const broadcastLeg = async (buildTx, legNote) => {
        const result = await this.runNonceExclusive(async () => {
          const explicit = nonceHolder.value;
          nonceHolder.value = void 0;
          const n = await this.resolveNonce(explicit);
          const tx = await buildTx(n);
          return this.pox5SignAndBroadcast(tx, legNote);
        });
        if (!result?.txid || result.error || result.reason) {
          return { broadcastError: [result?.error, result?.reason].filter(Boolean).join(" \u2014 ") || "broadcast failed" };
        }
        const settled = await this.waitForTxSettlement(result.txid);
        return { txid: result.txid, settled };
      };
      const recordCycleFailure = (error, signerClaimTxid2) => {
        for (const b of stakerBondIndices) {
          results.push({
            bondIndex: b ?? null,
            rewardCycle: cycle,
            signerManager,
            signerAccruedSats: (b !== void 0 ? accruedByBond.get(b) ?? BigInt(0) : noneAccrued).toString(),
            stakerPaidSats: null,
            signerClaimTxid: signerClaimTxid2,
            stakerClaimTxid: null,
            status: "failed",
            error
          });
        }
      };
      const stakerPayoutPolicy = this.signerManagerRegistry.get(signerManager)?.payoutPolicy;
      if (stakerBondIndices.length > 0 && !stakerPayoutPolicy) {
        return {
          error: `No registered payout policy for signer manager ${signerManager} \u2014 refusing the reward claim at cycle ${cycle} before any leg broadcasts. Register a signerManagerAdapters entry with a payout policy for this manager.`
        };
      }
      const stakerPayoutAssetId = stakerPayoutPolicy ? `${stakerPayoutPolicy.asset.contractAddress}.${stakerPayoutPolicy.asset.contractName}` : void 0;
      let signerClaimTxid = null;
      if (totalRewards > BigInt(0)) {
        const smClaim = await broadcastLeg(
          (n) => (0, import_transactions4.makeUnsignedContractCall)({
            contractAddress: signerContractAddress,
            contractName: signerContractName,
            functionName: "claim-rewards",
            functionArgs: [import_transactions4.Cl.list(uniqueBondIndices.map((i) => import_transactions4.Cl.uint(i))), import_transactions4.Cl.uint(cycle)],
            publicKey: this.publicKey,
            fee: DEFAULT_POX_FEE_USTX,
            nonce: n,
            network: this.pox5Network,
            // Deny mode: PoX-5 sends exactly total-rewards sBTC to the signer manager for
            // this cycle. Computed from the same chain state read just above.
            postConditionMode: "deny",
            postConditions: [
              import_transactions4.Pc.principal(pox5ContractId).willSendEq(totalRewards).ft(sbtcContractId, sbtcAsset.assetName)
            ]
          }),
          `sm-claim-rewards-cycle-${cycle}`
        );
        if ("broadcastError" in smClaim) {
          const msg = `signer-manager.claim-rewards broadcast failed at cycle ${cycle}: ${smClaim.broadcastError}`;
          recordCycleFailure(msg, null);
          return { error: msg };
        }
        const smClaimRepr = smClaim.settled.data?.tx_result?.repr ?? smClaim.settled.data?.tx_error ?? "";
        if (smClaim.settled.data?.tx_status !== "success" && !smClaimRepr.includes("u30") && !smClaimRepr.includes("u32")) {
          const msg = `signer-manager.claim-rewards failed at cycle ${cycle}: ${smClaimRepr}`;
          recordCycleFailure(msg, smClaim.txid);
          return { unsettled: !smClaim.settled.success, error: msg };
        }
        signerClaimTxid = smClaim.txid;
        txHashes.push(smClaim.txid);
      }
      for (const bondIndex of stakerBondIndices) {
        const signerAccruedSats = bondIndex !== void 0 ? accruedByBond.get(bondIndex) ?? BigInt(0) : noneAccrued;
        const stakerPaidSats = await (0, import_bitcoin_staking2.fetchEarnedStakerRewards)({
          signerManager,
          rewardCycle: cycle,
          bondIndex,
          staker: this.address,
          network: this.pox5Network
        }).catch(() => null);
        const recordResult = (status, stakerClaimTxid, error) => results.push({
          bondIndex: bondIndex ?? null,
          rewardCycle: cycle,
          signerManager,
          signerAccruedSats: signerAccruedSats.toString(),
          // Only report a paid amount when the payout actually settled; a failed leg
          // paid nothing, so it must not carry the pre-claim entitlement.
          stakerPaidSats: status === "claimed" && stakerPaidSats !== null ? stakerPaidSats.toString() : null,
          signerClaimTxid,
          stakerClaimTxid,
          status,
          ...error ? { error } : {}
        });
        const defaultNote = bondIndex !== void 0 ? `sm-claim-staker-rewards-cycle-${cycle}-bond-${bondIndex}` : `sm-claim-staker-stx-rewards-cycle-${cycle}`;
        const bondSuffix = bondIndex !== void 0 ? ` bond ${bondIndex}` : "";
        const smStaker = await broadcastLeg(
          (n) => (0, import_transactions4.makeUnsignedContractCall)({
            contractAddress: signerContractAddress,
            contractName: signerContractName,
            functionName: "claim-staker-rewards",
            functionArgs: [
              import_transactions4.Cl.address(this.address),
              import_transactions4.Cl.uint(cycle),
              bondIndex !== void 0 ? import_transactions4.Cl.some(import_transactions4.Cl.uint(bondIndex)) : import_transactions4.Cl.none()
            ],
            publicKey: this.publicKey,
            fee: DEFAULT_POX_FEE_USTX,
            nonce: n,
            network: this.pox5Network,
            // Deny mode: the manager sends the staker at most maxPayoutSats of the
            // policy asset (a deliberate upper bound, per answers §3a).
            postConditionMode: "deny",
            postConditions: [
              import_transactions4.Pc.principal(signerManager).willSendLte(stakerPayoutPolicy.maxPayoutSats).ft(stakerPayoutAssetId, stakerPayoutPolicy.asset.assetName)
            ]
          }),
          note ?? defaultNote
        );
        if ("broadcastError" in smStaker) {
          recordResult("failed", null, smStaker.broadcastError);
          return { error: `Failed at cycle ${cycle}${bondSuffix}: ${smStaker.broadcastError}` };
        }
        if (!smStaker.settled.success || smStaker.settled.data?.tx_status !== "success") {
          const stakerRepr = smStaker.settled.data?.tx_result?.repr ?? smStaker.settled.data?.tx_error ?? "";
          recordResult("failed", smStaker.txid, stakerRepr);
          return { unsettled: !smStaker.settled.success, error: `Claim failed on-chain at cycle ${cycle}${bondSuffix}: ${stakerRepr}` };
        }
        recordResult("claimed", smStaker.txid);
        txHashes.push(smStaker.txid);
      }
      return {};
    };
    /**
     * Claims ALL accumulated sBTC rewards for the given bond indices.
     * Handles the full flow internally: calculate → distribute → claim staker share.
     *
     * The signer manager that governs each reward cycle is resolved from chain
     * (get-signer-cycle-membership) rather than the local record, so signer rotation
     * between cycles routes each cycle's claim to the correct manager and historical
     * cycles remain claimable after a restart with an empty cache. A chain read failure
     * refuses the claim (unknown, never silently "no rewards").
     *
     * Resumable by design: the per-cycle plan is rebuilt from chain on every call and
     * includes only cycles/bonds with a still-positive signer accrual or staker
     * entitlement, so a re-invocation after a partial failure resumes at the first
     * unclaimed leg without repeating confirmed work — the chain is the progress record,
     * not a local file. Both claim legs are contract-idempotent, so re-running a leg that
     * already settled is benign. On failure the response carries the partial `results`
     * and `txHashes` plus the error; call again to resume.
     */
    this.claimRewards = async (bondIndices, opts) => {
      try {
        if (!this.publicKey || !this.vaultAccountId) throw new Error("SDK not initialized");
        if (!this.address) throw new Error("Address not set");
        if (bondIndices.length === 0) return { success: false, error: "No bond indices provided" };
        const staker = this.address;
        const uniqueBonds = [...new Set(bondIndices)].sort((a, b) => a - b);
        const pox = await (0, import_bitcoin_staking2.fetchPoxInfo)({ network: this.pox5Network });
        const firstCycleByBond = new Map(
          uniqueBonds.map((b) => [b, (0, import_bitcoin_staking2.bondPeriodToRewardCycle)({ bondIndex: b, poxInfo: pox })])
        );
        const minFirstCycle = Math.min(...firstCycleByBond.values());
        let lastComputeHeight;
        try {
          lastComputeHeight = await (0, import_bitcoin_staking2.fetchLastRewardComputeHeight)({ network: this.pox5Network });
        } catch (e) {
          return { success: false, error: `Could not read the last reward compute height (unknown, not zero) \u2014 refusing to claim: ${formatErrorMessage(e)}` };
        }
        const lastComputedCycle = lastComputeHeight > 0 ? Math.floor((lastComputeHeight - pox.firstBurnchainBlockHeight) / pox.rewardCycleLength) : pox.rewardCycleId - 1;
        const plan = [];
        for (let cycle = minFirstCycle; cycle <= lastComputedCycle; cycle++) {
          let cycleMembership;
          try {
            cycleMembership = await (0, import_bitcoin_staking2.fetchSignerCycleMembership)({ staker, cycle, network: this.pox5Network });
          } catch (e) {
            return { success: false, error: `Could not resolve signer-cycle membership for cycle ${cycle} (unknown, not zero) \u2014 refusing to claim: ${formatErrorMessage(e)}` };
          }
          if (!cycleMembership) continue;
          const signerManager = cycleMembership.signer;
          const candidateBonds = uniqueBonds.filter((b) => (firstCycleByBond.get(b) ?? 0) <= cycle);
          const earned = await Promise.all(
            candidateBonds.map(async (b) => {
              const [signerSats, stakerSats] = await Promise.all([
                (0, import_bitcoin_staking2.fetchEarned)({ signerManager, rewardCycle: cycle, bondIndex: b, network: this.pox5Network }).catch(() => BigInt(-1)),
                (0, import_bitcoin_staking2.fetchEarnedStakerRewards)({ signerManager, rewardCycle: cycle, bondIndex: b, staker, network: this.pox5Network }).catch(() => BigInt(-1))
              ]);
              return { bond: b, signerSats, stakerSats };
            })
          );
          const failedRead = earned.find((e) => e.signerSats < BigInt(0) || e.stakerSats < BigInt(0));
          if (failedRead) {
            return { success: false, error: `Could not read earned rewards for bond ${failedRead.bond} at cycle ${cycle} (unknown, not zero) \u2014 refusing to claim` };
          }
          const claimBonds = earned.filter((e) => e.signerSats > BigInt(0) || e.stakerSats > BigInt(0)).map((e) => e.bond);
          if (claimBonds.length === 0) continue;
          const dot = signerManager.lastIndexOf(".");
          plan.push({ cycle, signerAddr: signerManager.slice(0, dot), signerName: signerManager.slice(dot + 1), bonds: claimBonds });
        }
        if (plan.length === 0) {
          return {
            success: false,
            error: `No rewards available yet for bond(s) ${uniqueBonds.join(", ")} (last_computed_cycle: ${lastComputedCycle}, current_cycle: ${pox.rewardCycleId})`
          };
        }
        const txHashes = [];
        const results = [];
        const nonceHolder = { value: opts?.nonce };
        for (const item of plan) {
          for (let i = 0; i < item.bonds.length; i += 6) {
            const chunk = item.bonds.slice(i, i + 6);
            const result = await this.executeClaimCycle(
              item.signerAddr,
              item.signerName,
              item.cycle,
              chunk,
              chunk,
              nonceHolder,
              opts?.note,
              txHashes,
              results
            );
            if (result.error) return { success: false, unsettled: result.unsettled, error: result.error, txHashes, results };
          }
        }
        return { success: true, txHashes, results };
      } catch (error) {
        return { success: false, error: `Failed to claim rewards: ${formatErrorMessage(error)}` };
      }
    };
    /**
     * Claims accumulated sBTC rewards for an STX-only staker (no BTC bonds).
     *
     * The signer manager is resolved PER CYCLE from get-signer-cycle-membership (not the
     * current stake), so historical cycles route correctly across signer rotation and
     * stay claimable after the stake expires when an explicit cycle range is supplied.
     * Claimability per cycle is the complementary pair: the staker entitlement
     * (get-earned-staker-rewards, positive only AFTER someone runs claim-rewards) OR the
     * signer-level accrual (get-earned, positive only BEFORE) — the latter additionally
     * requiring this staker to hold shares for the cycle. Gating on the staker read alone
     * would deadlock a self-managed signer, whose first claim-rewards is reachable only
     * through this method. A read failure refuses rather than reading as "no rewards".
     */
    this.claimStxOnlyRewards = async (opts) => {
      try {
        if (!this.publicKey || !this.vaultAccountId) throw new Error("SDK not initialized");
        if (!this.address) throw new Error("Address not set");
        const staker = this.address;
        if (opts?.fromCycle !== void 0 && opts?.toCycle !== void 0 && opts.fromCycle > opts.toCycle) {
          return { success: false, error: `Invalid cycle range: fromCycle ${opts.fromCycle} > toCycle ${opts.toCycle}` };
        }
        const pox = await (0, import_bitcoin_staking2.fetchPoxInfo)({ network: this.pox5Network });
        let lastComputeHeight;
        try {
          lastComputeHeight = await (0, import_bitcoin_staking2.fetchLastRewardComputeHeight)({ network: this.pox5Network });
        } catch (e) {
          return { success: false, error: `Could not read the last reward compute height (unknown, not zero) \u2014 refusing to claim: ${formatErrorMessage(e)}` };
        }
        const lastComputedCycle = lastComputeHeight > 0 ? Math.floor((lastComputeHeight - pox.firstBurnchainBlockHeight) / pox.rewardCycleLength) : pox.rewardCycleId - 1;
        let startCycle = opts?.fromCycle;
        if (startCycle === void 0) {
          const stakerInfo = await (0, import_bitcoin_staking2.fetchStakerInfo)({ address: staker, network: this.pox5Network }).catch(() => null);
          if (!stakerInfo?.staked) {
            return { success: false, error: "No active STX-only stake found; supply fromCycle (and optionally toCycle) to claim historical cycles after expiry." };
          }
          startCycle = stakerInfo.details.firstRewardCycle;
        }
        const endCycle = Math.min(opts?.toCycle ?? lastComputedCycle, lastComputedCycle);
        const plan = [];
        for (let cycle = startCycle; cycle <= endCycle; cycle++) {
          let cycleMembership;
          try {
            cycleMembership = await (0, import_bitcoin_staking2.fetchSignerCycleMembership)({ staker, cycle, network: this.pox5Network });
          } catch (e) {
            return { success: false, error: `Could not resolve signer-cycle membership for cycle ${cycle} (unknown, not zero) \u2014 refusing to claim: ${formatErrorMessage(e)}` };
          }
          if (!cycleMembership) continue;
          const signerManager = cycleMembership.signer;
          let signerEarned;
          let stakerEarned;
          let stakerShares;
          try {
            [signerEarned, stakerEarned, stakerShares] = await Promise.all([
              (0, import_bitcoin_staking2.fetchEarned)({ signerManager, rewardCycle: cycle, network: this.pox5Network }),
              (0, import_bitcoin_staking2.fetchEarnedStakerRewards)({ signerManager, rewardCycle: cycle, staker, network: this.pox5Network }),
              (0, import_bitcoin_staking2.fetchStakerSharesStakedForCycle)({ staker, signer: signerManager, rewardCycle: cycle, network: this.pox5Network })
            ]);
          } catch (e) {
            return { success: false, error: `Could not read earned rewards at cycle ${cycle} (unknown, not zero) \u2014 refusing to claim: ${formatErrorMessage(e)}` };
          }
          const claimable = stakerEarned > BigInt(0) || signerEarned > BigInt(0) && stakerShares > BigInt(0);
          if (!claimable) continue;
          const dot = signerManager.lastIndexOf(".");
          plan.push({ cycle, signerAddr: signerManager.slice(0, dot), signerName: signerManager.slice(dot + 1) });
        }
        if (plan.length === 0) {
          return { success: false, error: `No STX-only rewards for this staker in cycles ${startCycle}-${endCycle} (last_computed_cycle: ${lastComputedCycle}, current_cycle: ${pox.rewardCycleId})` };
        }
        const txHashes = [];
        const results = [];
        const nonceHolder = { value: opts?.nonce };
        for (const item of plan) {
          const result = await this.executeClaimCycle(
            item.signerAddr,
            item.signerName,
            item.cycle,
            [],
            [void 0],
            nonceHolder,
            opts?.note,
            txHashes,
            results
          );
          if (result.error) return { success: false, unsettled: result.unsettled, error: result.error, txHashes, results };
        }
        return { success: true, txHashes, results };
      } catch (error) {
        return { success: false, error: `Failed to claim STX-only rewards: ${formatErrorMessage(error)}` };
      }
    };
    /**
     * Returns earned sBTC rewards (sats) for a signerManager + optional bondIndex.
     * Includes staker-specific rewards when this vault's address is in the signer set.
     */
    this.getEarnedRewards = async (signerManager, bondIndex) => {
      try {
        const pox = await (0, import_bitcoin_staking2.fetchPoxInfo)({ network: this.pox5Network });
        const bondFirstRewardCycle = bondIndex !== void 0 ? (0, import_bitcoin_staking2.bondPeriodToRewardCycle)({ bondIndex, poxInfo: pox }) : void 0;
        let startCycle = bondFirstRewardCycle;
        if (startCycle === void 0) {
          const stakerInfo = this.address ? await (0, import_bitcoin_staking2.fetchStakerInfo)({ address: this.address, network: this.pox5Network }).catch(() => null) : null;
          startCycle = stakerInfo?.staked ? stakerInfo.details.firstRewardCycle : pox.rewardCycleId;
        }
        const pastCycles = this.cycleRange(startCycle, pox.rewardCycleId);
        const stakerAddress = this.address;
        const [earned, stakerEarned] = await Promise.all([
          this.sumOverCycles(pastCycles, (cycle) => (0, import_bitcoin_staking2.fetchEarned)({
            signerManager,
            rewardCycle: cycle,
            bondIndex,
            network: this.pox5Network
          }).catch(() => BigInt(0))),
          stakerAddress ? this.sumOverCycles(pastCycles, (cycle) => (0, import_bitcoin_staking2.fetchEarnedStakerRewards)({
            signerManager,
            rewardCycle: cycle,
            bondIndex,
            staker: stakerAddress,
            network: this.pox5Network
          }).catch(() => BigInt(0))) : Promise.resolve(BigInt(0))
        ]);
        const cyclesUntilRewards = bondFirstRewardCycle !== void 0 ? Math.max(0, bondFirstRewardCycle - pox.rewardCycleId) : void 0;
        return {
          success: true,
          data: {
            current_cycle: pox.rewardCycleId,
            first_reward_cycle: bondFirstRewardCycle,
            cycles_until_rewards: cyclesUntilRewards,
            earned_sats: earned.toString(),
            staker_earned_sats: stakerEarned.toString()
          }
        };
      } catch (error) {
        return { success: false, error: `Failed to fetch earned rewards: ${formatErrorMessage(error)}` };
      }
    };
    /**
     * Check account status: balance total, locked amount and delegation status.
     * @returns A promise that resolves to a {CreateTransactionResponse}.
     */
    this.checkStatus = async () => {
      if (!this.address || !this.publicKey || !this.vaultAccountId) {
        throw new Error("Address, Public Key or Vault ID are not set");
      }
      console.log(`Checking account status for address: ${this.address}`);
      try {
        const pox5Info = await (0, import_bitcoin_staking2.fetchPoxInfo)({ network: this.pox5Network }).catch(() => null);
        const delegationApplicable = pox5Info?.contractId?.includes("pox-4") ?? false;
        const [delegationResult, balanceResponse, stakerInfo, bondMembership] = await Promise.all([
          delegationApplicable ? this.chainService.checkDelegationStatus(this.address).then((value) => ({ value, failed: false })).catch(() => ({ value: null, failed: true })) : Promise.resolve({ value: null, failed: false }),
          this.chainService.makeBalanceCalls(this.address),
          (0, import_bitcoin_staking2.fetchStakerInfo)({ address: this.address, network: this.pox5Network }).catch(() => null),
          (0, import_bitcoin_staking2.fetchBondMembership)({ address: this.address, network: this.pox5Network }).catch(() => null)
        ]);
        if (!balanceResponse) {
          throw new Error("Failed to fetch balance data");
        }
        const balanceData = balanceResponse.data;
        const stxBalMicro = BigInt(balanceData.balance ?? "0");
        const stxLockedMicro = BigInt(balanceData.locked ?? "0");
        const totalMinerRewardsRecievedMicro = BigInt(
          balanceData.total_miner_rewards_received ?? "0"
        );
        const delegationData = delegationResult.value;
        const isDelegated = !!(delegationData && delegationData.value);
        const amountDelegatedMicro = isDelegated ? BigInt(delegationData.value["amount-ustx"]?.value ?? "0") : null;
        const delegatedTo = isDelegated ? delegationData.value["delegated-to"]?.value ?? null : null;
        const untilBurnHt = isDelegated ? delegationData.value["until-burn-ht"]?.value?.value ? Number(delegationData.value["until-burn-ht"].value.value) : null : null;
        const poxAddrTuple = isDelegated ? delegationData.value["pox-addr"]?.value ?? null : null;
        const pox5IsStaked = !!stakerInfo?.staked;
        const pox5Details = pox5IsStaked && stakerInfo?.staked ? stakerInfo.details : null;
        const unlockBurnHeight = pox5Details && pox5Info ? pox5Info.firstBurnchainBlockHeight + (pox5Details.firstRewardCycle + pox5Details.numCycles) * pox5Info.rewardCycleLength : null;
        const inPreparePhase = pox5Info ? (0, import_bitcoin_staking2.isInPreparePhase)({ burnHeight: pox5Info.currentBurnchainBlockHeight, poxInfo: pox5Info }) : false;
        const statusData = {
          balance: {
            stx_total: microToStx(stxBalMicro),
            stx_locked: microToStx(stxLockedMicro),
            lock_tx_id: balanceData.lock_tx_id || null,
            lock_height: balanceData.lock_height || null,
            burnchain_lock_height: balanceData.burnchain_lock_height || null,
            burnchain_unlock_height: balanceData.burnchain_unlock_height || null,
            total_miner_rewards_received: microToStx(
              totalMinerRewardsRecievedMicro
            )
          },
          delegation: {
            applicable: delegationApplicable,
            is_delegated: isDelegated,
            lookup_failed: delegationResult.failed,
            delegated_to: delegatedTo,
            amount_delegated: amountDelegatedMicro ? microToStx(amountDelegatedMicro) : null,
            until_burn_ht: untilBurnHt,
            pox_addr: poxAddrTuple
          },
          stx_only: {
            is_staked: pox5IsStaked,
            amount_stx: pox5Details ? microToStx(pox5Details.amountUstx) : null,
            signer_manager: pox5Details?.signer ?? null,
            first_reward_cycle: pox5Details?.firstRewardCycle ?? null,
            num_cycles: pox5Details?.numCycles ?? null,
            unlock_burn_height: unlockBurnHeight,
            current_burn_height: pox5Info?.currentBurnchainBlockHeight ?? 0,
            current_cycle_id: pox5Info?.rewardCycleId ?? 0,
            is_prepare_phase: inPreparePhase,
            // True when the PoX read failed: the burn-height/cycle/prepare-phase fields
            // above are UNKNOWN (defaulted to 0/false), not authoritative zeros.
            pox_lookup_failed: pox5Info === null
          },
          bond: bondMembership ? {
            bond_index: bondMembership.bondIndex,
            amount_stx: microToStx(bondMembership.amountUstx),
            // Same zeroed-amount fallback as getBondPosition (single helper): early exit
            // zeroes the membership amount while the BTC stays locked. Best-effort record
            // read here — checkStatus is an aggregate status view, and a store failure
            // leaves the membership value rather than failing the whole status call.
            amount_sats: this.effectiveL1AmountSats(
              bondMembership,
              bondMembership.isL1Lock ? await this.lockRecordStore.loadRecord(this.address, bondMembership.bondIndex).catch(() => null) : null
            ).toString(),
            signer_manager: bondMembership.signer,
            is_l1_lock: bondMembership.isL1Lock
          } : null
        };
        return {
          success: true,
          data: statusData
        };
      } catch (error) {
        console.error(`Error checking status: ${formatErrorMessage(error)}`);
        return {
          success: false,
          error: `Failed to check status: ${formatErrorMessage(error)}`
        };
      }
    };
    /**
     * Check eligibility for PoX-5 staking.
     * @returns A promise that resolves to an object indicating eligibility and reason if not eligible.
     */
    this.checkEligibility = async (pox, amountStx) => {
      try {
        const stakerInfo = await (0, import_bitcoin_staking2.fetchStakerInfo)({ address: this.address, network: this.pox5Network });
        if (stakerInfo.staked) {
          return {
            eligible: false,
            reason: `Account already has an active PoX-5 staking position. Use updateStake to modify it.`
          };
        }
        const safetyCheck = isSafeToSubmit(pox);
        if (!safetyCheck.safe) {
          const raw = pox;
          const prepareLength = raw.prepare_phase_block_length ?? raw.prepareCycleLength;
          const cycleId = raw.reward_cycle_id ?? raw.rewardCycleId;
          return {
            eligible: false,
            reason: `Too close to prepare phase boundary. Try again in ${prepareLength + safetyCheck.blocksUntilBoundary} blocks (next cycle: ${cycleId + 1}).`
          };
        }
        const balance = await this.getBalance();
        if (!balance.success) {
          throw new Error(`Could not fetch account balance to check funds sufficiency`);
        }
        if (stxToMicro(amountStx) > stxToMicro(balance.balance)) {
          return {
            eligible: false,
            reason: `Amount to stake (${amountStx} STX) exceeds available balance of ${balance.balance} STX.`
          };
        }
        return { eligible: true };
      } catch (error) {
        console.error(`Error checking eligibility: ${formatErrorMessage(error)}`);
        return {
          eligible: false,
          reason: `Failed to check eligibility: ${formatErrorMessage(error)}`
        };
      }
    };
    /**
     * Solo stacks a specified amount of STX for a given lock period.
     * @param signerKey - The signer's compressed public key (hex).
     * @param signerSig65Hex - 65-byte signer signature (hex).
     * @param amount - Amount of STX to stack (number). Converted to microSTX internally.
     * @param maxAmount - Maximum authorized STX amount, must be >= amount (number). Converted to microSTX internally.
     * @param lockPeriod - The number of cycles to lock the STX.
     * @param authId - Authorization ID for the transaction (bigint).
     * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
     * @returns A response indicating success or failure of the transaction.
     */
    this.stackSolo = async (signerKey, signerSig65Hex, amount, maxAmount, lockPeriod, authId, note, nonce, externalId) => {
      try {
        if (!this.address || !this.publicKey || !this.vaultAccountId) {
          throw new Error("Address, Public Key or Vault ID are not set");
        }
        console.log(`Solo stacking ${amount} STX for ${lockPeriod} cycles`);
        const poxResponse = await this.chainService.fetchPoxInfo();
        const pox = poxResponse.data;
        const isPox4 = String(pox.contract_id ?? "").includes("pox-4");
        if (isPox4) {
          const status = await this.checkStatus();
          if (!status.success || !status.data) {
            return { success: false, error: `Failed to check account status before solo stacking: ${status.error}` };
          }
          if (status.data.delegation.lookup_failed) {
            return { success: false, error: `Could not determine delegation status. Retry once the Stacks API is reachable.` };
          }
          if (status.data.delegation.is_delegated) {
            return {
              success: false,
              error: `Account has an active delegation to ${status.data.delegation.delegated_to}. Revoke it before solo stacking.`
            };
          }
        }
        if (stxToMicro(amount) < BigInt(pox.min_amount_ustx)) {
          return {
            success: false,
            error: `Amount to stack (${amount} STX) is below the minimum of ${microToStx(BigInt(pox.min_amount_ustx))} STX.`
          };
        }
        const eligibilityCheck = await this.checkEligibility(pox, amount);
        if (!eligibilityCheck.eligible) {
          return {
            success: false,
            error: `Account not eligible for solo stacking: ${eligibilityCheck.reason}`
          };
        }
        const startBurnHeight = pox.current_burnchain_block_height;
        const result = await this.buildSignSendContractCall({
          functionName: "solo-stack",
          amount: stxToMicro(amount),
          maxAmount: stxToMicro(maxAmount),
          lockPeriod,
          signerKey,
          signerSig65Hex,
          startBurnHeight,
          authId,
          note,
          nonce,
          externalId
        });
        const assertResult = assertResultSuccess(result);
        if (assertResult.success === false) {
          return {
            success: false,
            error: `Failed to solo stack STX: ${assertResult.error}`
          };
        }
        const txStatus = await this.waitForTxSettlement(result.txid);
        if (!txStatus.success || txStatus.data?.tx_status !== "success") {
          return {
            success: false,
            unsettled: !txStatus.success,
            error: txStatus.error || txStatus.data?.tx_error || "Transaction failed at the contract level.",
            txHash: result.txid
          };
        }
        console.log(`Successfully solo stacked ${amount} STX`);
        return {
          success: true,
          txHash: result.txid
        };
      } catch (error) {
        console.error(`Error solo stacking: ${formatErrorMessage(error)}`);
        return {
          success: false,
          error: `Failed to solo stack: ${formatErrorMessage(error)}`
        };
      }
    };
    /**
     * Increases the stacked amount of an existing solo stacking position.
     * @param signerKey - The signer's compressed public key (hex).
     * @param signerSig65Hex - 65-byte signer signature (hex).
     * @param increaseBy - Amount of STX to add to the existing stack (number). Converted to microSTX internally.
     * @param maxAmount - New maximum authorized STX amount after increase (number). Converted to microSTX internally.
     * @param authId - Authorization ID for the transaction (bigint).
     * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
     * @returns A response indicating success or failure of the transaction.
     */
    this.increaseStackedAmount = async (signerKey, signerSig65Hex, increaseBy, maxAmount, authId, note, nonce, externalId) => {
      try {
        if (!this.address || !this.publicKey || !this.vaultAccountId) {
          throw new Error("Address, Public Key or Vault ID are not set");
        }
        console.log(`Increasing stacked amount by ${increaseBy} STX`);
        const result = await this.buildSignSendContractCall({
          functionName: "increase-stack-amount",
          amount: stxToMicro(increaseBy),
          maxAmount: stxToMicro(maxAmount),
          signerKey,
          signerSig65Hex,
          authId,
          note,
          nonce,
          externalId
        });
        const assertResult = assertResultSuccess(result);
        if (assertResult.success === false) {
          return {
            success: false,
            error: `Failed to increase stacked amount: ${assertResult.error}`
          };
        }
        const txStatus = await this.waitForTxSettlement(result.txid);
        if (!txStatus.success || txStatus.data?.tx_status !== "success") {
          return {
            success: false,
            unsettled: !txStatus.success,
            error: txStatus.error || txStatus.data?.tx_error || "Transaction failed at the contract level.",
            txHash: result.txid
          };
        }
        console.log(`Successfully increased stacked amount by ${increaseBy} STX`);
        return {
          success: true,
          txHash: result.txid
        };
      } catch (error) {
        console.error(`Error increasing stacked amount: ${formatErrorMessage(error)}`);
        return {
          success: false,
          error: `Failed to increase stacked amount: ${formatErrorMessage(error)}`
        };
      }
    };
    /**
    * Extends the stacking period of an existing solo stacking position.
    * @param signerKey - The signer's compressed public key (hex).
    * @param signerSig65Hex - 65-byte signer signature (hex).
    * @param increaseBy - Number of additional cycles to extend the stacking period.
    * @param maxAmount - Maximum authorized STX amount for the extension (number). Converted to microSTX internally.
    * @param authId - Authorization ID for the transaction (bigint).
    * @param nonce - Optional nonce override (bigint). Defaults to next available gap-aware nonce.
    * @returns A response indicating success or failure of the transaction.
    */
    this.extendStackingPeriod = async (signerKey, signerSig65Hex, extendCycles, maxAmount, authId, note, nonce, externalId) => {
      try {
        if (!this.address || !this.publicKey || !this.vaultAccountId) {
          throw new Error("Address, Public Key or Vault ID are not set");
        }
        console.log(`Extending stacking period by ${extendCycles} cycles`);
        const result = await this.buildSignSendContractCall({
          functionName: "extend-stack-period",
          maxAmount: stxToMicro(maxAmount),
          extendCycles,
          signerKey,
          signerSig65Hex,
          authId,
          note,
          nonce,
          externalId
        });
        const assertResult = assertResultSuccess(result);
        if (assertResult.success === false) {
          return {
            success: false,
            error: `Failed to extend stacking period: ${assertResult.error}`
          };
        }
        const txStatus = await this.waitForTxSettlement(result.txid);
        if (!txStatus.success || txStatus.data?.tx_status !== "success") {
          return {
            success: false,
            unsettled: !txStatus.success,
            error: txStatus.error || txStatus.data?.tx_error || "Transaction failed at the contract level.",
            txHash: result.txid
          };
        }
        console.log(`Successfully extended stacking period by ${extendCycles} cycles`);
        return {
          success: true,
          txHash: result.txid
        };
      } catch (error) {
        console.error(`Error extending stacking period: ${formatErrorMessage(error)}`);
        return {
          success: false,
          error: `Failed to extend stacking period: ${formatErrorMessage(error)}`
        };
      }
    };
    /**
     * Replaces a pending transaction with a higher fee (replace-by-fee / RBF).
     *
     * Two mutually exclusive modes — provide one, not both:
     *   - `originalTxId` only: tx is visible in the explorer. SDK looks it up, reads its nonce,
     *     and reconstructs it. Works for token_transfer and contract_call. `newFee` must be
     *     at least RBF_MIN_FEE_MULTIPLIER × the original fee. `newRecipient`/`newAmount` are
     *     optional overrides for token_transfer only.
     *   - `nonceOverride` only: tx is NOT visible in the explorer. SDK skips lookup entirely.
     *     `originalTxId` is unused — omit it. Only STX transfers supported. `newRecipient` and
     *     `newAmount` are required since there is nothing to reconstruct.
     *
     * @param newFee - New fee in STX. Must be > 0 and ≤ MAX_FEE_STX.
     * @param originalTxId - TX ID to look up and replace. Required unless using nonceOverride.
     * @param newRecipient - New recipient (token_transfer only). Optional on lookup path, required on override path.
     * @param newAmount - New amount in STX (token_transfer only). Optional on lookup path, required on override path.
     * @param nonceOverride - Nonce of the stuck tx. Use only when the tx is not visible in the explorer.
     * @param note - Optional note shown in Fireblocks console during raw signing.
     * @returns A promise that resolves to a {CreateTransactionResponse}.
     */
    this.replaceTransaction = async (newFee, originalTxId, newRecipient, newAmount, nonceOverride, note, externalId) => {
      if (!this.address || !this.publicKey || !this.vaultAccountId) {
        throw new Error("Address, Public Key or Vault ID are not set");
      }
      try {
        parseOptionalFee(newFee);
        const feeBigInt = stxToMicro(newFee);
        if (!originalTxId && nonceOverride === void 0) {
          return { success: false, error: "Either originalTxId or nonceOverride must be provided" };
        }
        if (nonceOverride !== void 0) {
          if (!newRecipient || newAmount === void 0) {
            return {
              success: false,
              error: "newRecipient and newAmount are required when nonceOverride is provided"
            };
          }
          if (!validateAddress(newRecipient, this.testnet)) {
            return { success: false, error: "Invalid recipient address" };
          }
          const nonce2 = nonceOverride;
          const amountUstx = stxToMicro(newAmount);
          const confirmedNonce = await this.chainService.getConfirmedNonce(this.address);
          if (nonce2 < confirmedNonce) {
            return {
              success: false,
              error: `nonceOverride (${nonce2}) is below the confirmed nonce (${confirmedNonce}). This transaction would be rejected.`
            };
          }
          const balance = await this.getBalance();
          if (balance.success) {
            const totalRequired = microToStx(amountUstx + feeBigInt);
            if (balance.balance !== void 0 && totalRequired > balance.balance) {
              return {
                success: false,
                error: `Insufficient balance. Required: ${totalRequired} STX, Available: ${balance.balance} STX`
              };
            }
          }
          const transactionToSign = await this.chainService.serializeTransaction(
            this.address,
            this.publicKey,
            newRecipient,
            amountUstx,
            "STX" /* STX */,
            void 0,
            void 0,
            void 0,
            void 0,
            nonce2,
            feeBigInt
          );
          const rawSignature2 = await this.fireblocksService.signTransaction(
            transactionToSign.preSignSigHash,
            this.vaultAccountId.toString(),
            note,
            externalId
          );
          const signature2 = concatSignature(rawSignature2.fullSig, rawSignature2.v);
          transactionToSign.unsignedTx.auth.spendingCondition.signature = (0, import_transactions4.createMessageSignature)(signature2);
          const result2 = await this.chainService.broadcastTransaction(transactionToSign.unsignedTx);
          if (!result2 || result2.error || !result2.txid || result2.reason) {
            const msg = result2?.error && result2?.reason ? `${result2.error} - ${result2.reason}` : result2?.error || result2?.reason || "unknown error";
            return { success: false, error: formatErrorMessage(msg) };
          }
          console.log(`Replaced transaction ${originalTxId} with ${result2.txid}`);
          return { success: true, txHash: result2.txid };
        }
        const originalTxResponse = await this.getTxStatusById(originalTxId);
        if (!originalTxResponse.success || !originalTxResponse.data) {
          return { success: false, error: "Could not fetch original transaction details" };
        }
        if (originalTxResponse.data.tx_status !== "pending") {
          return {
            success: false,
            error: `Can only replace pending transactions. Current status: ${originalTxResponse.data.tx_status}`
          };
        }
        const fullTx = originalTxResponse.data.full_tx_details;
        if (fullTx?.tx_type !== "token_transfer" && fullTx?.tx_type !== "contract_call") {
          return {
            success: false,
            error: `Cannot replace tx of type "${fullTx?.tx_type}". Only token_transfer and contract_call are supported.`
          };
        }
        if (fullTx.sender_address !== this.address) {
          return {
            success: false,
            error: "Transaction sender does not match this vault account address"
          };
        }
        const originalFeeUstx = BigInt(fullTx.fee_rate);
        const minFeeUstx = originalFeeUstx * BigInt(Math.round(RBF_MIN_FEE_MULTIPLIER * 100)) / BigInt(100);
        if (feeBigInt < minFeeUstx) {
          return {
            success: false,
            error: `New fee (${newFee} STX) must be at least ${RBF_MIN_FEE_MULTIPLIER}x the original fee (${microToStx(originalFeeUstx)} STX). Minimum required: ${microToStx(minFeeUstx)} STX`
          };
        }
        if (fullTx.tx_type === "contract_call" && (newRecipient !== void 0 || newAmount !== void 0)) {
          return {
            success: false,
            error: "newRecipient and newAmount can only be changed for native STX transfers. This transaction is a contract_call."
          };
        }
        const nonce = BigInt(fullTx.nonce);
        let unsignedTxWire;
        let preSignSigHash;
        if (fullTx.tx_type === "token_transfer") {
          const recipient = newRecipient ?? fullTx.token_transfer.recipient_address;
          const amountUstx = newAmount !== void 0 ? stxToMicro(newAmount) : BigInt(fullTx.token_transfer.amount);
          const memoHex = fullTx.token_transfer.memo;
          const memo = memoHex ? Buffer.from(memoHex.startsWith("0x") ? memoHex.slice(2) : memoHex, "hex").toString("utf8").replace(/\0/g, "") || void 0 : void 0;
          if (!validateAddress(recipient, this.testnet)) {
            return { success: false, error: "Invalid recipient address" };
          }
          const balanceCheck = await this.getBalance();
          if (balanceCheck.success) {
            const totalRequired = microToStx(amountUstx + feeBigInt);
            if (balanceCheck.balance !== void 0 && totalRequired > balanceCheck.balance) {
              return {
                success: false,
                error: `Insufficient balance. Required: ${totalRequired} STX, Available: ${balanceCheck.balance} STX`
              };
            }
          }
          const serialized = await this.chainService.serializeTransaction(
            this.address,
            this.publicKey,
            recipient,
            amountUstx,
            "STX" /* STX */,
            void 0,
            void 0,
            void 0,
            void 0,
            nonce,
            feeBigInt,
            memo
          );
          unsignedTxWire = serialized.unsignedTx;
          preSignSigHash = serialized.preSignSigHash;
        } else {
          const [contractAddress, contractName] = fullTx.contract_call.contract_id.split(".");
          const functionName = fullTx.contract_call.function_name;
          const functionArgs = fullTx.contract_call.function_args.map(
            (arg) => (0, import_transactions4.hexToCV)(arg.hex)
          );
          let postConditions;
          let postConditionMode;
          try {
            const modeStr = fullTx.post_condition_mode;
            postConditionMode = modeStr === "allow" ? import_transactions4.PostConditionMode.Allow : import_transactions4.PostConditionMode.Deny;
            postConditions = fullTx.post_conditions.map((pc) => {
              const principalStr = pc.principal.type_id === "principal_contract" ? `${pc.principal.address}.${pc.principal.contract_name}` : pc.principal.address;
              const pcBuilder = pc.principal.type_id === "principal_origin" ? import_transactions4.Pc.origin() : import_transactions4.Pc.principal(principalStr);
              const amount = BigInt(pc.amount);
              const withCode = (() => {
                switch (pc.condition_code) {
                  case "sent_equal_to":
                    return pcBuilder.willSendEq(amount);
                  case "sent_greater_than":
                    return pcBuilder.willSendGt(amount);
                  case "sent_greater_than_or_equal_to":
                    return pcBuilder.willSendGte(amount);
                  case "sent_less_than":
                    return pcBuilder.willSendLt(amount);
                  case "sent_less_than_or_equal_to":
                    return pcBuilder.willSendLte(amount);
                  default:
                    throw new Error(`Unsupported post-condition code: ${pc.condition_code}`);
                }
              })();
              if (pc.type === "stx") return withCode.ustx();
              if (pc.type === "fungible") {
                return withCode.ft(
                  `${pc.asset.contract_address}.${pc.asset.contract_name}`,
                  pc.asset.asset_name
                );
              }
              throw new Error(`Unsupported post-condition type: ${pc.type}`);
            });
          } catch {
            return {
              success: false,
              error: "Cannot replace transaction: failed to reconstruct original post-conditions. Refusing to replace to avoid weakening safety guarantees."
            };
          }
          const balanceCheck = await this.getBalance();
          if (balanceCheck.success) {
            const feeStx = microToStx(feeBigInt);
            if (balanceCheck.balance !== void 0 && feeStx > balanceCheck.balance) {
              return {
                success: false,
                error: `Insufficient balance for fee. Required: ${feeStx} STX, Available: ${balanceCheck.balance} STX`
              };
            }
          }
          const serialized = await this.chainService.serializeContractCall(
            this.publicKey,
            contractAddress,
            contractName,
            functionName,
            functionArgs,
            nonce,
            feeBigInt,
            postConditions,
            postConditionMode
          );
          unsignedTxWire = serialized.unsignedContractCall;
          preSignSigHash = serialized.preSignSigHash;
        }
        const rawSignature = await this.fireblocksService.signTransaction(
          preSignSigHash,
          this.vaultAccountId.toString(),
          note,
          externalId
        );
        const signature = concatSignature(rawSignature.fullSig, rawSignature.v);
        unsignedTxWire.auth.spendingCondition.signature = (0, import_transactions4.createMessageSignature)(signature);
        const result = await this.chainService.broadcastTransaction(unsignedTxWire);
        if (!result || result.error || !result.txid || result.reason) {
          const errorAndReason = result?.error && result?.reason ? `${result.error} - ${result.reason}` : result?.error || result?.reason || "unknown error";
          return { success: false, error: formatErrorMessage(errorAndReason) };
        }
        console.log(`Replaced transaction ${originalTxId} with ${result.txid}`);
        return { success: true, txHash: result.txid };
      } catch (error) {
        if (error instanceof ValidationError) {
          return { success: false, error: error.message };
        }
        console.error(`Error replacing transaction: ${formatErrorMessage(error)}`);
        return {
          success: false,
          error: `Failed to replace transaction: ${formatErrorMessage(error)}`
        };
      }
    };
    /**
    * fetches current pox info from blockchain.
    * @returns the pox info response.
    * @throws {Error} If fetching pox info fails.
    */
    this.getPoxInfo = async () => {
      try {
        const poxResponse = await this.chainService.fetchPoxInfo();
        if (!poxResponse || !poxResponse.data) {
          return {
            success: false,
            error: `Failed to fetch POX info: empty response`
          };
        }
        return {
          success: true,
          data: poxResponse.data
        };
      } catch (error) {
        console.error(`Error fetching POX info: ${formatErrorMessage(error)}`);
        return {
          success: false,
          error: `Failed to fetch POX info: ${formatErrorMessage(error)}`
        };
      }
    };
    // ── App-surface methods (Electron consumption; not present on the server branch) ──
    /**
     * Checks and validates transaction parameters, adjusting the amount if necessary.
     *
     * @param recipientAddress - The address of the recipient.
     * @param amount - The amount to transfer in native coin.
     * @param grossTransaction - Optional flag indicating if the transaction is gross, if so fee will be deducted from recipient (default is false).
     * @param type - The type of transaction (default is native coin).
     * @param token - The type of fungible token to transfer (required if type is FungibleToken).
     * @returns A promise that resolves to an object indicating if parameters are valid, the final amount, and reason if invalid.
     * @throws {Error} If parameter validation fails.
     */
    this.estimateFee = async (recipientAddress, amount, type = "STX" /* STX */, token, customTokenContractAddress, customTokenContractName) => {
      try {
        if (!this.address || !this.publicKey || !this.vaultAccountId) {
          throw new Error("Address, Public Key or Vault ID are not set");
        }
        const microAmount = type === "Fungible Token" /* FungibleToken */ ? stxToMicro(amount) : stxToMicro(amount);
        let microfee = 0;
        if (type === "STX" /* STX */) {
          microfee = await this.chainService.estimateTxFee(recipientAddress, microAmount);
        } else if (type === "Fungible Token" /* FungibleToken */) {
          const tokenInfo = token !== "custom-token" /* CUSTOM */ ? getTokenInfo(token, this.testnet ? "testnet" : "mainnet") : void 0;
          const ftContractAddress = tokenInfo?.contractAddress ?? customTokenContractAddress;
          const ftContractName = tokenInfo?.contractName ?? customTokenContractName;
          const functionArgs = [(0, import_transactions4.uintCV)(microAmount), (0, import_transactions4.principalCV)(this.address), (0, import_transactions4.principalCV)(recipientAddress), (0, import_transactions4.noneCV)()];
          microfee = await this.chainService.estimateContractCallFee(ftContractAddress, ftContractName, "transfer", functionArgs);
        }
        return { success: true, fee: microToStx(microfee), microfee };
      } catch (error) {
        return { success: false, error: formatErrorMessage(error) };
      }
    };
    /**
     * Makes a generic contract call to a given contract address and name with specified function and arguments.
     * @param contractAddress - The address of the contract to call.
     * @param contractName - The name of the contract to call.
     * @param functionName - The name of the function to call on the contract.
     * @param functionArgs - The arguments to pass to the contract function - must be an array of ClarityValue objects in the same order and types as the function parameters.
     * @param postConditions - Optional post conditions for the transaction.
     * @param postConditionMode - Optional post condition mode.
     * @returns A response indicating success or failure of the transaction.
     */
    this.makeContractCall = async (contractAddress, contractName, functionName, functionArgs, postConditions, postConditionMode, externalId) => {
      try {
        if (!this.address || !this.publicKey || !this.vaultAccountId) {
          throw new Error("Address, Public Key or Vault ID are not set");
        }
        console.log(`Making contract call to ${contractAddress}.${contractName} function ${functionName} with ${functionArgs.length} arg(s)`);
        const result = await this.buildSignSendContractCall({
          functionName: "generic-contract-call",
          contractCallParams: { contractAddress, contractName, functionName, functionArgs, postConditions, postConditionMode },
          externalId
        });
        const assertResult = assertResultSuccess(result);
        if (assertResult.success === false) {
          return {
            success: false,
            error: `Failed to make contract call: ${assertResult.error}`
          };
        }
        console.log(`Successfully made contract call to ${contractAddress}.${contractName} function ${functionName}`);
        return {
          success: true,
          txHash: result.txid,
          transaction: result.transaction
        };
      } catch (error) {
        console.error(`Error making contract call: ${formatErrorMessage(error)}`);
        return {
          success: false,
          error: `Failed to make contract call to ${contractAddress}.${contractName} function ${functionName}: ${formatErrorMessage(error)}`
        };
      }
    };
    /**
     * Signs an externally built transaction and returns the signed transaction hex.
     * The caller is responsible for broadcasting the signed transaction.
     */
    this.signExternalTransaction = async (txHex, externalId) => {
      try {
        if (!this.publicKey || !this.vaultAccountId) {
          throw new Error("Public key or vault ID are not set");
        }
        const txBytes = Buffer.from(txHex, "hex");
        const tx = (0, import_transactions4.deserializeTransaction)(txBytes);
        const sigHash = tx.signBegin();
        const preSignSigHash = (0, import_transactions4.sigHashPreSign)(
          sigHash,
          tx.auth.authType,
          tx.auth.spendingCondition.fee,
          tx.auth.spendingCondition.nonce
        );
        const rawSignature = await this.fireblocksService.signTransaction(
          preSignSigHash,
          this.vaultAccountId.toString(),
          "",
          externalId
        );
        const signature = concatSignature(rawSignature.fullSig, rawSignature.v);
        tx.auth.spendingCondition.signature = (0, import_transactions4.createMessageSignature)(signature);
        const signedTxHex = (0, import_transactions4.serializeTransaction)(tx);
        return { success: true, txHex: signedTxHex };
      } catch (error) {
        return { success: false, error: formatErrorMessage(error) };
      }
    };
    /**
     * Signs a plain text message and returns the signature.
     */
    this.signMessage = async (message, externalId) => {
      try {
        if (!this.vaultAccountId) {
          throw new Error("Vault ID is not set");
        }
        const hash = (0, import_common2.bytesToHex)((0, import_encryption.hashMessage)(message));
        const rawSignature = await this.fireblocksService.signTransaction(
          hash,
          this.vaultAccountId.toString(),
          "",
          externalId
        );
        const vHex = rawSignature.v === 0 ? "00" : "01";
        const signature = rawSignature.fullSig + vHex;
        return { success: true, signature };
      } catch (error) {
        return { success: false, error: formatErrorMessage(error) };
      }
    };
    /**
     * Signs a SIP-018 structured message and returns the signature.
     * message and domain are hex-encoded serialized ClarityValues.
     */
    this.signStructuredMessage = async (message, domain, externalId) => {
      try {
        if (!this.vaultAccountId) {
          throw new Error("Vault ID is not set");
        }
        const messageCV = (0, import_transactions4.deserializeCV)(Buffer.from(message, "hex"));
        const domainCV = (0, import_transactions4.deserializeCV)(Buffer.from(domain, "hex"));
        const encoded = (0, import_transactions4.encodeStructuredDataBytes)({ message: messageCV, domain: domainCV });
        const hash = Buffer.from((0, import_sha23.sha256)(encoded)).toString("hex");
        const rawSignature = await this.fireblocksService.signTransaction(
          hash,
          this.vaultAccountId.toString(),
          "",
          externalId
        );
        const vHex = rawSignature.v === 0 ? "00" : "01";
        const signature = rawSignature.fullSig + vHex;
        return { success: true, signature };
      } catch (error) {
        return { success: false, error: formatErrorMessage(error) };
      }
    };
    /**
     * Fetches contract call transactions for the current account, excluding STX and FT transfers.
     * @param limit - The maximum number of transactions to return (default is 50).
     * @param offset - The offset for pagination (default is 0).
     * @returns A promise that resolves to a {GetContractCallHistoryResponse}.
     * @throws {Error} If the address is not set or if the request fails.
     */
    this.getContractCallHistory = async (limit = pagination_defaults.limit, offset = pagination_defaults.page) => {
      if (!this.address) {
        throw new Error("Stacks address is not set.");
      }
      try {
        const txs = await this.chainService.getContractCallHistory(
          this.address,
          limit,
          offset
        );
        return { success: true, data: txs };
      } catch (error) {
        return {
          success: false,
          error: formatErrorMessage(error)
        };
      }
    };
    try {
      if (fireblocksConfig) {
        validateApiCredentials(
          fireblocksConfig.apiKey,
          fireblocksConfig.apiSecret ?? "",
          vaultAccountId
        );
      }
      this.fireblocksService = new FireblocksService(fireblocksConfig);
      this.maxBondStxUstx = fireblocksConfig?.maxBondStxUstx;
      this.btcRecoveryAllowlist = fireblocksConfig?.btcRecoveryAllowlist ?? [];
      this.signerManagerRegistry = new SignerManagerRegistry(fireblocksConfig?.signerManagerAdapters ?? []);
      this.verifyEarlyExitCosignerAtFunding = fireblocksConfig?.verifyEarlyExitCosignerAtFunding ?? false;
      this.networkProfile = resolveNetworkProfile({
        network: fireblocksConfig?.network,
        testnet: fireblocksConfig?.testnet,
        stacksApiUrl: fireblocksConfig?.stacksApiUrl
      });
      this.testnet = this.networkProfile.name !== "mainnet";
      this._pox5Network = stacksNetworkFromProfile(this.networkProfile);
      this.chainService = new StacksService(
        this.testnet,
        {
          baseUrl: this.networkProfile.stacksApiUrl,
          chainId: this.networkProfile.chainId,
          magicBytes: this.networkProfile.magicBytes
        },
        hiroApiKey
      );
    } catch (error) {
      throw new Error(
        `Failed to initialize services: ${formatErrorMessage(error)}`
      );
    }
    if (typeof vaultAccountId === "string") {
      this.vaultAccountId = vaultAccountId.trim().replace(/^\s+|\s+$/g, "").replace(/\D/g, "") || vaultAccountId.trim();
    } else {
      this.vaultAccountId = vaultAccountId;
    }
  }
  static {
    /**
     * Creates an instance of StacksSDK.
     * @param vaultAccountId - The Fireblocks vault account ID.
     * @param fireblocksConfig - Optional Fireblocks configuration.
     * @returns A Promise that resolves to an instance of StacksSDK.
     * @throws Will throw an error if the instance creation fails.
     */
    this.create = async (vaultAccountId, fireblocksConfig, hiroApiKey) => {
      try {
        const instance = new _StacksSDK(vaultAccountId, fireblocksConfig, hiroApiKey);
        await validateNetworkProfile(instance.networkProfile);
        instance.publicKey = await instance.fireblocksService.getPublicKeyByVaultID(vaultAccountId);
        instance.address = instance.chainService.formatAddress(
          instance.publicKey
        );
        instance.btcRewardsAddress = await instance.fireblocksService.getBtcSegwitAddressForVaultID(
          vaultAccountId
        );
        return instance;
      } catch (error) {
        throw new Error(
          `Failed to create StacksSDK instance: ${formatErrorMessage(error)}`
        );
      }
    };
  }
  // Resolved once at construction from the single network profile, so
  // PoX-5 contract reads, transaction construction, and broadcast use the same
  // chain id / magic bytes / base URL as StacksService's nonce and balance reads.
  get pox5Network() {
    return this._pox5Network;
  }
  // --- BTC Bond helpers ---
  esploraBase() {
    return this.networkProfile.esploraBaseUrl;
  }
  // ─── §11: BTC signing helpers (private) ─────────────────────────────────────
  // Private-1 regtest uses bech32 prefix 'bcrt', not 'tb' (testnet3).
  get btcNetwork() {
    const prefix2 = this.networkProfile.bech32Prefix;
    if (prefix2 === void 0) return NETWORK;
    return { ...TEST_NETWORK, bech32: prefix2 };
  }
};

// src/pool/types.ts
var ActionType = /* @__PURE__ */ ((ActionType2) => {
  ActionType2["CREATE_NATIVE_TRANSACTION"] = "createNativeTransaction";
  ActionType2["CREATE_FT_TRANSACTION"] = "createFTTransaction";
  ActionType2["GET_BALANCE"] = "getBalance";
  ActionType2["GET_FT_BALANCES"] = "getFtBalances";
  ActionType2["GET_TRANSACTIONS_HISTORY"] = "getTransactionsHistory";
  ActionType2["GET_ACCOUNT_ADDRESS"] = "getAddress";
  ActionType2["GET_ACCOUNT_PUBLIC_KEY"] = "getPublicKey";
  ActionType2["GET_BTC_REWARDS_ADDRESS"] = "getBtcRewardsAddress";
  ActionType2["DELEGATE_TO_POOL"] = "delegateToPool";
  ActionType2["ALLOW_CONTRACT_CALLER"] = "allowContractCaller";
  ActionType2["REVOKE_DELEGATION"] = "revokeDelegation";
  ActionType2["CHECK_STATUS"] = "checkStatus";
  ActionType2["STACK_SOLO"] = "stackSolo";
  ActionType2["GET_TX_STATUS_BY_ID"] = "getTxStatusById";
  ActionType2["GET_BTC_TX_STATUS"] = "getBtcTxStatus";
  ActionType2["VALIDATE_BOND_SCHEDULE"] = "validateBondSchedule";
  ActionType2["GET_POX_INFO"] = "getPoxInfo";
  ActionType2["INCREASE_STACKED_AMOUNT"] = "increaseStackedAmount";
  ActionType2["EXTEND_STACKING_PERIOD"] = "extendStackingPeriod";
  ActionType2["REPLACE_TRANSACTION"] = "replaceTransaction";
  ActionType2["GET_ACCOUNT_NONCE"] = "getAccountNonce";
  ActionType2["STAKE"] = "stake";
  ActionType2["UPDATE_STAKE"] = "updateStake";
  ActionType2["UNSTAKE"] = "unstake";
  ActionType2["GRANT_SIGNER_KEY"] = "grantSignerKey";
  ActionType2["REVOKE_SIGNER_GRANT"] = "revokeSignerGrant";
  ActionType2["UPDATE_BOND_REGISTRATION"] = "updateBondRegistration";
  ActionType2["GET_STAKER_INFO"] = "getStakerInfo";
  ActionType2["GET_POX5_INFO"] = "getPox5Info";
  ActionType2["VERIFY_SIGNER_GRANT"] = "verifySignerGrant";
  ActionType2["CREATE_BOND"] = "createBond";
  ActionType2["CREATE_SBTC_BOND"] = "createSbtcBond";
  ActionType2["ROLL_SBTC_BOND"] = "rollSbtcBond";
  ActionType2["UNSTAKE_SBTC"] = "unstakeSbtc";
  ActionType2["GET_BOND_POSITION"] = "getBondPosition";
  ActionType2["GET_HISTORICAL_BOND_POSITION"] = "getHistoricalBondPosition";
  ActionType2["ANNOUNCE_EARLY_EXIT"] = "announceEarlyExit";
  ActionType2["SPEND_EARLY_EXIT"] = "spendEarlyExit";
  ActionType2["GET_EARLY_EXIT_PUBLIC_KEY"] = "getEarlyExitPublicKey";
  ActionType2["GET_REQUIREMENTS"] = "getRequirements";
  ActionType2["UNLOCK_BTC"] = "unlockMaturedBond";
  ActionType2["REPLACE_BTC_RECOVERY_FEE"] = "replaceBtcRecoveryFee";
  ActionType2["RENEW_BOND"] = "renewBond";
  ActionType2["CALCULATE_REWARDS"] = "calculateRewards";
  ActionType2["CLAIM_REWARDS"] = "claimRewards";
  ActionType2["CLAIM_STX_ONLY_REWARDS"] = "claimStxOnlyRewards";
  ActionType2["GET_EARNED_REWARDS"] = "getEarnedRewards";
  ActionType2["GET_BOND_LOCK_ADDRESS"] = "getBondLockAddress";
  ActionType2["FUND_BOND_LOCK_ADDRESS"] = "fundBondLockAddress";
  ActionType2["FUND_VAULT"] = "fundVault";
  ActionType2["ESTIMATE_FEE"] = "estimateFee";
  ActionType2["GET_CONTRACT_CALL_HISTORY"] = "getContractCallHistory";
  ActionType2["MAKE_CONTRACT_CALL"] = "makeContractCall";
  ActionType2["SIGN_TRANSACTION"] = "signExternalTransaction";
  ActionType2["SIGN_MESSAGE"] = "signMessage";
  ActionType2["SIGN_STRUCTURED_MESSAGE"] = "signStructuredMessage";
  return ActionType2;
})(ActionType || {});

// src/api/api.service.ts
var import_ts_sdk4 = require("@fireblocks/ts-sdk");

// src/pool/errors.ts
var PoolError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "PoolError";
  }
};
var PoolCapacityError = class extends PoolError {
  constructor(message) {
    super(message);
    this.name = "PoolCapacityError";
  }
};
var SdkInitializationError = class extends PoolError {
  constructor(vaultAccountId, cause) {
    super(`Failed to initialize SDK for vault ${vaultAccountId}: ${cause}`);
    this.name = "SdkInitializationError";
  }
};

// src/pool/SdkManager.ts
var SdkManager = class {
  constructor(baseConfig, chainApiKey, poolConfig) {
    this.sdkPool = /* @__PURE__ */ new Map();
    // In-flight constructions keyed the same way as sdkPool. Concurrent cold calls for
    // one key share a single creation promise so exactly one instance is built — two
    // instances for the same vault would have independent nonce queues and could
    // collide on nonces.
    this.creating = /* @__PURE__ */ new Map();
    /**
     * Pool key for a vault. Network identity is part of the key so an instance built
     * for one network is never handed out for another.
     */
    this.poolKey = (vaultAccountId) => `${this.baseConfig.testnet ? "testnet" : "mainnet"}:${vaultAccountId}`;
    /**
     * Get an SDK instance for a specific vault account ID. Instance acquisition is
     * atomic: the decision path below runs synchronously (no await) up to the point a
     * single construction promise is registered, so concurrent cold calls for the same
     * vault share one construction rather than building duplicate instances.
     * @param vaultAccountId Fireblocks vault account ID
     * @returns StacksSDK instance
     */
    this.getSdk = async (vaultAccountId) => {
      const key = this.poolKey(vaultAccountId);
      const poolItem = this.sdkPool.get(key);
      if (poolItem) {
        poolItem.refCount++;
        poolItem.lastUsed = /* @__PURE__ */ new Date();
        return poolItem.sdk;
      }
      const inFlight = this.creating.get(key);
      if (inFlight) {
        return inFlight.then((sdk) => {
          const item = this.sdkPool.get(key);
          if (item) {
            item.refCount++;
            item.lastUsed = /* @__PURE__ */ new Date();
          }
          return sdk;
        });
      }
      if (this.sdkPool.size + this.creating.size >= this.poolConfig.maxPoolSize) {
        const removed = this.removeOldestIdleSdk();
        if (!removed) {
          throw new PoolCapacityError(
            `SDK pool is at maximum capacity (${this.poolConfig.maxPoolSize}) with no idle connections`
          );
        }
      }
      const creation = this.createSdkInstance(vaultAccountId).then((sdk) => {
        this.sdkPool.set(key, { sdk, lastUsed: /* @__PURE__ */ new Date(), refCount: 1 });
        return sdk;
      }).finally(() => {
        this.creating.delete(key);
      });
      this.creating.set(key, creation);
      return creation;
    };
    /**
     * Release an SDK instance back to the pool
     * @param vaultAccountId Vault account ID
     */
    this.releaseSdk = (vaultAccountId) => {
      const poolItem = this.sdkPool.get(this.poolKey(vaultAccountId));
      if (poolItem) {
        poolItem.refCount = Math.max(0, poolItem.refCount - 1);
        poolItem.lastUsed = /* @__PURE__ */ new Date();
      }
    };
    /**
     * Create a new SDK instance
     * @param vaultAccountId Vault account ID
     * @returns New MovementFireblocksSDK instance
     */
    this.createSdkInstance = async (vaultAccountId) => {
      const config2 = {
        ...this.baseConfig
      };
      try {
        console.log(`Creating new SDK instance for vault ${vaultAccountId}`);
        const sdk = await StacksSDK.create(vaultAccountId, config2, this.chainApiKey);
        if (this.poolConfig.lockRecordStore) {
          sdk.setLockRecordStore(this.poolConfig.lockRecordStore);
        }
        return sdk;
      } catch (error) {
        console.error(`Failed to create SDK for vault ${vaultAccountId}:`, error);
        throw new SdkInitializationError(
          vaultAccountId,
          formatErrorMessage(error)
        );
      }
    };
    /**
     * Find and remove the oldest idle SDK instance
     * @returns True if an instance was removed, false otherwise
     */
    this.removeOldestIdleSdk = () => {
      let oldestKey = null;
      let oldestDate = null;
      for (const [key, value] of this.sdkPool.entries()) {
        if (value.refCount === 0 && (oldestDate === null || value.lastUsed < oldestDate)) {
          oldestDate = value.lastUsed;
          oldestKey = key;
        }
      }
      if (oldestKey) {
        this.sdkPool.delete(oldestKey);
        return true;
      }
      return false;
    };
    /**
     * Clean up idle SDK instances
     */
    this.cleanupIdleSdks = async () => {
      const now = /* @__PURE__ */ new Date();
      const keysToRemove = [];
      for (const [key, value] of this.sdkPool.entries()) {
        if (value.refCount === 0) {
          const idleTime = now.getTime() - value.lastUsed.getTime();
          if (idleTime > this.poolConfig.idleTimeoutMs) {
            keysToRemove.push(key);
          }
        }
      }
      for (const key of keysToRemove) {
        try {
          this.sdkPool.delete(key);
          console.log(`Removed idle SDK instance for vault ${key}`);
        } catch (error) {
          console.error(`Error shutting down SDK for vault ${key}:`, error);
        }
      }
    };
    /**
     * Get metrics about the SDK pool
     */
    this.getMetrics = () => {
      const metrics = {
        totalInstances: this.sdkPool.size,
        activeInstances: 0,
        idleInstances: 0
      };
      for (const [, value] of this.sdkPool.entries()) {
        if (value.refCount > 0) {
          metrics.activeInstances++;
        } else {
          metrics.idleInstances++;
        }
      }
      return metrics;
    };
    /**
     * Shut down all SDK instances and clean up resources
     */
    this.shutdown = async () => {
      clearInterval(this.cleanupInterval);
      this.sdkPool.clear();
      console.log("All SDK instances have been shut down");
    };
    this.baseConfig = baseConfig;
    this.chainApiKey = chainApiKey;
    this.poolConfig = {
      maxPoolSize: poolConfig?.maxPoolSize || 100,
      idleTimeoutMs: poolConfig?.idleTimeoutMs || 30 * 60 * 1e3,
      // 30 minutes
      cleanupIntervalMs: poolConfig?.cleanupIntervalMs || 5 * 60 * 1e3,
      // 5 minutes
      lockRecordStore: poolConfig?.lockRecordStore
    };
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupIdleSdks().catch((error) => {
          console.error("SDK pool cleanup failed:", formatErrorMessage(error));
        });
      },
      this.poolConfig.cleanupIntervalMs
    );
  }
};

// src/api/api.service.ts
var ApiService = class {
  constructor(config2) {
    /**
     * Execute an action using the appropriate SDK method
     */
    this.executeAction = async (vaultAccountId, actionType, params) => {
      let sdk = null;
      try {
        sdk = await this.sdkManager.getSdk(vaultAccountId);
        let result;
        switch (actionType) {
          case "getBtcRewardsAddress" /* GET_BTC_REWARDS_ADDRESS */:
            result = await sdk.getBtcRewardsAddress();
            break;
          case "revokeDelegation" /* REVOKE_DELEGATION */:
            result = await sdk.revokeDelegation(params.nonce);
            break;
          case "checkStatus" /* CHECK_STATUS */:
            result = await sdk.checkStatus();
            break;
          case "stackSolo" /* STACK_SOLO */:
            result = await sdk.stackSolo(
              params.signerKey,
              params.signerSig65Hex,
              params.amount,
              params.maxAmount,
              params.lockPeriod,
              params.authId,
              params.note,
              params.nonce
            );
            break;
          case "getTxStatusById" /* GET_TX_STATUS_BY_ID */:
            result = await sdk.getTxStatusById(params.txId);
            break;
          case "getBtcTxStatus" /* GET_BTC_TX_STATUS */:
            result = await sdk.getBtcTxStatus(params.btcTxid);
            break;
          case "validateBondSchedule" /* VALIDATE_BOND_SCHEDULE */:
            result = await sdk.validateBondSchedule({ bondIndices: params.bondIndices });
            break;
          case "delegateToPool" /* DELEGATE_TO_POOL */:
            result = await sdk.delegateToPool(
              params.poolAddress,
              params.poolContractName,
              params.amount,
              params.lockPeriod,
              params.nonce
            );
            break;
          case "allowContractCaller" /* ALLOW_CONTRACT_CALLER */:
            result = await sdk.allowContractCaller(
              params.poolAddress,
              params.poolContractName,
              params.nonce
            );
            break;
          case "createNativeTransaction" /* CREATE_NATIVE_TRANSACTION */:
            result = await sdk.createNativeTransaction(
              params.recipientAddress,
              params.amount,
              params.grossTransaction,
              params.note,
              params.nonce,
              params.fee,
              params.memo,
              params.externalId
            );
            break;
          case "createFTTransaction" /* CREATE_FT_TRANSACTION */:
            result = await sdk.createFTTransaction(
              params.recipientAddress,
              params.amount,
              params.tokenType,
              params.tokenContractAddress,
              params.tokenContractName,
              params.tokenAssetName,
              params.note,
              params.nonce,
              params.externalId
            );
            break;
          case "getBalance" /* GET_BALANCE */:
            result = await sdk.getBalance();
            break;
          case "getFtBalances" /* GET_FT_BALANCES */:
            result = await sdk.getFtBalances();
            break;
          case "getTransactionsHistory" /* GET_TRANSACTIONS_HISTORY */:
            result = await sdk.getTransactionHistory(
              params.getCachedTransactions,
              params.limit,
              params.offset,
              params.fetchAll,
              params.fetchPending
            );
            break;
          case "getAddress" /* GET_ACCOUNT_ADDRESS */:
            result = await sdk.getAddress();
            break;
          case "getPublicKey" /* GET_ACCOUNT_PUBLIC_KEY */:
            result = await sdk.getPublicKey();
            break;
          case "getPoxInfo" /* GET_POX_INFO */:
            result = await sdk.getPoxInfo();
            break;
          case "increaseStackedAmount" /* INCREASE_STACKED_AMOUNT */:
            result = await sdk.increaseStackedAmount(
              params.signerKey,
              params.signerSig65Hex,
              params.increaseBy,
              params.maxAmount,
              params.authId,
              params.note,
              params.nonce
            );
            break;
          case "extendStackingPeriod" /* EXTEND_STACKING_PERIOD */:
            result = await sdk.extendStackingPeriod(
              params.signerKey,
              params.signerSig65Hex,
              params.extendCycles,
              params.maxAmount,
              params.authId,
              params.note,
              params.nonce
            );
            break;
          case "replaceTransaction" /* REPLACE_TRANSACTION */:
            result = await sdk.replaceTransaction(
              params.newFee,
              params.originalTxId,
              params.newRecipient,
              params.newAmount,
              params.nonceOverride,
              params.note,
              params.externalId
            );
            break;
          case "getAccountNonce" /* GET_ACCOUNT_NONCE */:
            result = await sdk.getAccountNonce();
            break;
          case "stake" /* STAKE */:
            result = await sdk.stake(
              params.amount,
              params.numCycles,
              params.signerManager,
              params.note,
              params.nonce,
              params.externalId
            );
            break;
          case "updateStake" /* UPDATE_STAKE */:
            result = await sdk.updateStake(
              params.signerManager,
              params.oldSignerManager,
              params.cyclesToExtend,
              params.increaseBy,
              params.note,
              params.nonce,
              params.externalId
            );
            break;
          case "unstake" /* UNSTAKE */:
            result = await sdk.unstake(
              params.oldSignerManager,
              params.note,
              params.nonce,
              params.externalId
            );
            break;
          case "grantSignerKey" /* GRANT_SIGNER_KEY */:
            result = await sdk.grantSignerKey(
              params.signerManager,
              params.authId,
              params.note,
              params.nonce,
              params.externalId
            );
            break;
          case "revokeSignerGrant" /* REVOKE_SIGNER_GRANT */:
            result = await sdk.revokeSignerGrant(
              params.signerManager,
              params.signerKey,
              params.note,
              params.nonce,
              params.externalId
            );
            break;
          case "getStakerInfo" /* GET_STAKER_INFO */:
            result = await sdk.getStakerInfo();
            break;
          case "getPox5Info" /* GET_POX5_INFO */:
            result = await sdk.getPox5Info();
            break;
          case "verifySignerGrant" /* VERIFY_SIGNER_GRANT */:
            result = await sdk.verifySignerGrant(
              params.signerManager,
              params.txid
            );
            break;
          case "createBond" /* CREATE_BOND */:
            result = await sdk.createBond(
              params.bondIndex,
              params.btcAmountSats,
              params.signerManager,
              { note: params.note, nonce: params.nonce, externalId: params.externalId, confirmations: params.confirmations, btcTxid: params.btcTxid, signerCalldata: params.signerCalldata, rewardBtcAddress: params.rewardBtcAddress, rewardMaxFeeSats: params.rewardMaxFeeSats }
            );
            break;
          case "createSbtcBond" /* CREATE_SBTC_BOND */:
            result = await sdk.createSbtcBond(
              params.bondIndex,
              params.sbtcSats,
              params.signerManager,
              { sbtcAsset: params.sbtcAsset, note: params.note, nonce: params.nonce, externalId: params.externalId }
            );
            break;
          case "rollSbtcBond" /* ROLL_SBTC_BOND */:
            result = await sdk.rollSbtcBond(
              params.nextBondIndex,
              params.newSbtcSats,
              params.signerManager,
              { sbtcAsset: params.sbtcAsset, note: params.note, nonce: params.nonce, externalId: params.externalId }
            );
            break;
          case "unstakeSbtc" /* UNSTAKE_SBTC */:
            result = await sdk.unstakeSbtc(
              params.signerManager,
              params.amountToWithdrawSats,
              params.sbtcAsset,
              { note: params.note, nonce: params.nonce, externalId: params.externalId }
            );
            break;
          case "getBondPosition" /* GET_BOND_POSITION */:
            result = await sdk.getBondPosition();
            break;
          case "getHistoricalBondPosition" /* GET_HISTORICAL_BOND_POSITION */:
            result = await sdk.getHistoricalBondPosition(params.bondIndex);
            break;
          case "announceEarlyExit" /* ANNOUNCE_EARLY_EXIT */:
            result = await sdk.announceEarlyExit({ note: params.note, nonce: params.nonce, externalId: params.externalId });
            break;
          case "spendEarlyExit" /* SPEND_EARLY_EXIT */:
            result = await sdk.spendEarlyExitUtxo(params.destinationBtcAddress, { feeSats: params.feeSats, bondIndex: params.bondIndex });
            break;
          case "getEarlyExitPublicKey" /* GET_EARLY_EXIT_PUBLIC_KEY */:
            result = await sdk.getEarlyExitPublicKey();
            break;
          case "getRequirements" /* GET_REQUIREMENTS */:
            result = await sdk.getRequirements({ bondIndex: params.bondIndex, btcAmountSats: params.btcAmountSats, signerManager: params.signerManager });
            break;
          case "unlockMaturedBond" /* UNLOCK_BTC */:
            result = await sdk.unlockMaturedBond(params.destinationBtcAddress, { feeSats: params.feeSats, bondIndex: params.bondIndex });
            break;
          case "replaceBtcRecoveryFee" /* REPLACE_BTC_RECOVERY_FEE */:
            result = await sdk.replaceBtcRecoveryFee(params.originalTxid, params.newFeeSats, { bondIndex: params.bondIndex, kind: params.kind });
            break;
          case "renewBond" /* RENEW_BOND */:
            result = await sdk.renewBond(params.nextBondIndex, params.signerManager, { feeSats: params.feeSats, note: params.note, nonce: params.nonce, externalId: params.externalId, confirmations: params.confirmations, signerCalldata: params.signerCalldata, rewardBtcAddress: params.rewardBtcAddress, rewardMaxFeeSats: params.rewardMaxFeeSats });
            break;
          case "updateBondRegistration" /* UPDATE_BOND_REGISTRATION */:
            result = await sdk.updateBondRegistration(params.signerManager, params.oldSignerManager, { note: params.note, nonce: params.nonce, externalId: params.externalId, signerCalldata: params.signerCalldata, rewardBtcAddress: params.rewardBtcAddress, rewardMaxFeeSats: params.rewardMaxFeeSats });
            break;
          case "calculateRewards" /* CALCULATE_REWARDS */:
            result = await sdk.calculateRewards({ note: params.note, nonce: params.nonce });
            break;
          case "claimRewards" /* CLAIM_REWARDS */:
            result = await sdk.claimRewards(params.bondIndices, { note: params.note, nonce: params.nonce });
            break;
          case "claimStxOnlyRewards" /* CLAIM_STX_ONLY_REWARDS */:
            result = await sdk.claimStxOnlyRewards({ note: params.note, nonce: params.nonce, fromCycle: params.fromCycle, toCycle: params.toCycle });
            break;
          case "getEarnedRewards" /* GET_EARNED_REWARDS */:
            result = await sdk.getEarnedRewards(params.signerManager, params.bondIndex);
            break;
          case "getBondLockAddress" /* GET_BOND_LOCK_ADDRESS */:
            result = await sdk.getBondLockAddress(params.bondIndex);
            break;
          case "fundBondLockAddress" /* FUND_BOND_LOCK_ADDRESS */:
            result = await sdk.fundBondLockAddress(params.bondIndex);
            break;
          case "fundVault" /* FUND_VAULT */:
            result = await sdk.fundVault(params.staking);
            break;
          // ── App-surface actions (Electron consumption; not present on the server branch) ──
          case "estimateFee" /* ESTIMATE_FEE */:
            result = await sdk.estimateFee(
              params.recipientAddress,
              params.amount,
              params.type,
              params.token,
              params.customTokenContractAddress,
              params.customTokenContractName
            );
            break;
          case "getContractCallHistory" /* GET_CONTRACT_CALL_HISTORY */:
            result = await sdk.getContractCallHistory(params.limit, params.offset);
            break;
          case "makeContractCall" /* MAKE_CONTRACT_CALL */:
            result = await sdk.makeContractCall(
              params.contractAddress,
              params.contractName,
              params.functionName,
              params.functionArgs,
              params.postConditions,
              params.postConditionMode
            );
            break;
          case "signExternalTransaction" /* SIGN_TRANSACTION */:
            result = await sdk.signExternalTransaction(params.txHex);
            break;
          case "signMessage" /* SIGN_MESSAGE */:
            result = await sdk.signMessage(params.message);
            break;
          case "signStructuredMessage" /* SIGN_STRUCTURED_MESSAGE */:
            result = await sdk.signStructuredMessage(params.message, params.domain);
            break;
          default:
            throw new Error(
              `InvalidType :
            Unknown action type: ${actionType}`
            );
        }
        return result;
      } catch (error) {
        console.error(
          `Error executing ${actionType} for vault ${vaultAccountId}:`,
          error
        );
        if (error instanceof PoolError) throw error;
        throw new Error(`Failed to execute ${actionType}: ${formatErrorMessage(error)}`);
      } finally {
        if (sdk) {
          this.sdkManager.releaseSdk(vaultAccountId);
        }
      }
    };
    /**
     * Get metrics about the SDK pool
     */
    this.getPoolMetrics = () => {
      return this.sdkManager.getMetrics();
    };
    /**
     * Shut down the API service and all SDK instances
     */
    this.shutdown = async () => {
      return this.sdkManager.shutdown();
    };
    const baseConfig = {
      apiKey: config2.apiKey,
      apiSecret: config2.apiSecret,
      basePath: config2.basePath || import_ts_sdk4.BasePath.US,
      vaultAccountId: "",
      // Will be overridden per request
      testnet: !!config2.testnet,
      verifyEarlyExitCosignerAtFunding: !!config2.verifyEarlyExitCosignerAtFunding
    };
    this.sdkManager = new SdkManager(baseConfig, config2.chainApiKey, config2.poolConfig);
  }
};

// src/staking/bonds/file-lock-record-store.ts
var import_fs2 = require("fs");
var import_crypto3 = require("crypto");
var path = __toESM(require("path"));
var SCHEMA_VERSION = 1;
var CorruptLockStoreError = class extends Error {
  constructor(filePath, detail) {
    super(
      `Lock-record store at ${filePath} is corrupt (${detail}). The file has been preserved for recovery; refusing to proceed rather than lose bond records.`
    );
    this.name = "CorruptLockStoreError";
  }
};
var toHex = (b) => Buffer.from(b).toString("hex");
var fromHex = (h) => new Uint8Array(Buffer.from(h, "hex"));
var serializeRecord = (r) => ({
  bondIndex: r.bondIndex,
  unlockBytes: toHex(r.unlockBytes),
  lockAddress: r.lockAddress,
  unlockHeight: r.unlockHeight,
  amountSats: r.amountSats.toString(),
  isL1Lock: r.isL1Lock,
  ...r.btcTxid !== void 0 ? { btcTxid: r.btcTxid } : {},
  ...r.vout !== void 0 ? { vout: r.vout } : {},
  ...r.signerManager !== void 0 ? { signerManager: r.signerManager } : {},
  ...r.firstRewardCycle !== void 0 ? { firstRewardCycle: r.firstRewardCycle } : {},
  ...r.fundingExternalId !== void 0 ? { fundingExternalId: r.fundingExternalId } : {},
  ...r.fireblocksId !== void 0 ? { fireblocksId: r.fireblocksId } : {},
  ...r.rewardBtcAddress !== void 0 ? { rewardBtcAddress: r.rewardBtcAddress } : {},
  ...r.rewardMaxFeeSats !== void 0 ? { rewardMaxFeeSats: r.rewardMaxFeeSats.toString() } : {},
  ...r.stage !== void 0 ? { stage: r.stage } : {}
});
var deserializeRecord = (s) => ({
  bondIndex: s.bondIndex,
  unlockBytes: fromHex(s.unlockBytes),
  lockAddress: s.lockAddress,
  unlockHeight: s.unlockHeight,
  amountSats: BigInt(s.amountSats),
  isL1Lock: s.isL1Lock,
  btcTxid: s.btcTxid,
  vout: s.vout,
  signerManager: s.signerManager,
  firstRewardCycle: s.firstRewardCycle,
  fundingExternalId: s.fundingExternalId,
  fireblocksId: s.fireblocksId,
  rewardBtcAddress: s.rewardBtcAddress,
  rewardMaxFeeSats: s.rewardMaxFeeSats !== void 0 ? BigInt(s.rewardMaxFeeSats) : void 0,
  stage: s.stage
});
var stableStringify = (records) => {
  const sortedKeys = Object.keys(records).sort();
  const canonical = {};
  for (const k of sortedKeys) {
    const rec = records[k];
    const inner = {};
    for (const field of Object.keys(rec).sort()) inner[field] = rec[field];
    canonical[k] = inner;
  }
  return JSON.stringify(canonical);
};
var checksumOf = (records) => (0, import_crypto3.createHash)("sha256").update(stableStringify(records)).digest("hex");
var FileLockRecordStore = class {
  constructor(filePath) {
    this.tmpCounter = 0;
    this.filePath = path.resolve(filePath);
    this.bakPath = `${this.filePath}.bak`;
    this.lockPath = `${this.filePath}.lock`;
    this.dir = path.dirname(this.filePath);
  }
  key(stxAddress, bondIndex) {
    return `${stxAddress}:${bondIndex}`;
  }
  /**
   * Reads and validates one store file. Returns null when the file is genuinely
   * MISSING; throws CorruptLockStoreError when it exists but cannot be trusted.
   */
  async readFile(p) {
    let raw;
    try {
      raw = await import_fs2.promises.readFile(p, "utf8");
    } catch (e) {
      if (e.code === "ENOENT") return null;
      throw e;
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new CorruptLockStoreError(p, "invalid JSON");
    }
    if (!parsed || typeof parsed !== "object" || typeof parsed.checksum !== "string" || typeof parsed.records !== "object" || parsed.records === null) {
      throw new CorruptLockStoreError(p, "missing version/checksum/records");
    }
    if (checksumOf(parsed.records) !== parsed.checksum) {
      throw new CorruptLockStoreError(p, "checksum mismatch");
    }
    return parsed.records;
  }
  /**
   * Loads all records. Missing primary + missing backup → empty (new store). A
   * corrupt primary falls back to an intact backup; if neither is trustworthy the
   * error propagates (fail closed) and the corrupt file is left in place.
   */
  async loadAll() {
    let primaryErr;
    try {
      const primary = await this.readFile(this.filePath);
      if (primary) return primary;
    } catch (e) {
      if (!(e instanceof CorruptLockStoreError)) throw e;
      primaryErr = e;
    }
    const backup = await this.readFile(this.bakPath).catch((e) => {
      if (e instanceof CorruptLockStoreError) return null;
      throw e;
    });
    if (backup) return backup;
    if (primaryErr) throw primaryErr;
    return {};
  }
  async fsyncDir() {
    try {
      const dh = await import_fs2.promises.open(this.dir, "r");
      try {
        await dh.sync();
      } finally {
        await dh.close();
      }
    } catch {
    }
  }
  /** Atomically persists the full record set with a fresh checksum and a backup. */
  async writeAll(records) {
    const payload = {
      version: SCHEMA_VERSION,
      checksum: checksumOf(records),
      records
    };
    const data = JSON.stringify(payload);
    const tmp = `${this.filePath}.tmp.${process.pid}.${this.tmpCounter++}`;
    const fh = await import_fs2.promises.open(tmp, "w");
    try {
      await fh.writeFile(data, "utf8");
      await fh.sync();
    } finally {
      await fh.close();
    }
    try {
      const currentPrimary = await this.readFile(this.filePath);
      if (currentPrimary) {
        await import_fs2.promises.copyFile(this.filePath, this.bakPath);
        let bh = null;
        try {
          bh = await import_fs2.promises.open(this.bakPath, "r+");
        } catch {
        }
        if (bh) {
          try {
            await bh.sync();
          } catch (e) {
            const code = e.code;
            if (code !== "ENOTSUP" && code !== "EINVAL" && code !== "ENOSYS" && code !== "EPERM") throw e;
          } finally {
            await bh.close();
          }
        }
      }
    } catch (e) {
      if (e instanceof CorruptLockStoreError) {
      } else if (e.code !== "ENOENT") {
        throw e;
      }
    }
    await import_fs2.promises.rename(tmp, this.filePath);
    await this.fsyncDir();
  }
  /** Simple, fail-closed inter-process lock via exclusive-create lockfile. */
  async acquireLock(timeoutMs = 15e3, staleMs = 6e4) {
    const start = Date.now();
    for (; ; ) {
      try {
        const fh = await import_fs2.promises.open(this.lockPath, "wx");
        try {
          await fh.writeFile(`${process.pid} ${Date.now()}`);
        } finally {
          await fh.close();
        }
        return;
      } catch (e) {
        if (e.code !== "EEXIST") throw e;
        try {
          const st = await import_fs2.promises.stat(this.lockPath);
          if (Date.now() - st.mtimeMs > staleMs) {
            await import_fs2.promises.unlink(this.lockPath).catch(() => {
            });
            continue;
          }
        } catch {
          continue;
        }
        if (Date.now() - start > timeoutMs) {
          throw new Error(`Timed out acquiring lock ${this.lockPath}`);
        }
        await new Promise((r) => setTimeout(r, 50));
      }
    }
  }
  async releaseLock() {
    await import_fs2.promises.unlink(this.lockPath).catch(() => {
    });
  }
  async withLock(fn) {
    await this.acquireLock();
    try {
      return await fn();
    } finally {
      await this.releaseLock();
    }
  }
  async saveRecord(stxAddress, bondIndex, record) {
    await import_fs2.promises.mkdir(this.dir, { recursive: true });
    await this.withLock(async () => {
      const records = await this.loadAll();
      records[this.key(stxAddress, bondIndex)] = serializeRecord(record);
      await this.writeAll(records);
    });
  }
  async loadRecord(stxAddress, bondIndex) {
    const records = await this.loadAll();
    const s = records[this.key(stxAddress, bondIndex)];
    return s ? deserializeRecord(s) : null;
  }
  /**
   * Startup health check used to gate native-BTC funding. Verifies the directory is
   * writable (temp write + fsync + rename + delete) and that the existing store, if
   * any, is readable and not corrupt. Throws on any failure.
   */
  async checkHealth() {
    await import_fs2.promises.mkdir(this.dir, { recursive: true });
    const probe = `${this.filePath}.health.${process.pid}.${this.tmpCounter++}`;
    const probeTarget = `${probe}.moved`;
    const fh = await import_fs2.promises.open(probe, "w");
    try {
      await fh.writeFile("ok");
      await fh.sync();
    } finally {
      await fh.close();
    }
    await import_fs2.promises.rename(probe, probeTarget);
    await import_fs2.promises.unlink(probeTarget).catch(() => {
    });
    await this.loadAll();
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ActionType,
  ApiService,
  BTC_ESPLORA,
  CorruptLockStoreError,
  DEFAULT_POX_FEE_USTX,
  DEFAULT_SCHEDULE_BOND_INDICES,
  EARLY_EXIT_SIGNER,
  FileLockRecordStore,
  InMemoryLockRecordStore,
  MAX_FEE_STX,
  POX4_ERRORS,
  POX5_BOND_ERRORS,
  PRIVATE1_HIRO_API_BASE,
  PUBLIC_TESTNET_POX5_API,
  RBF_MIN_FEE_MULTIPLIER,
  REWARD_CALLDATA_MAX_BYTES,
  SignerManagerRegistry,
  StackingPools,
  StacksSDK,
  TokenType,
  TransactionType,
  ValidationError,
  api_constants,
  config,
  derivationPath,
  diffBondSchedule,
  encodeRewardAddressCalldata,
  env,
  formatBondScheduleError,
  ftInfo,
  helperConstants,
  laterStage,
  pagination_defaults,
  parseOptionalAmount,
  parseOptionalFee,
  parseOptionalNonce,
  planSbtcRollover,
  poolInfo,
  poxInfo,
  stacks_info,
  validateBondScheduleAgainstChain
});
/*! Bundled license information:

@noble/curves/utils.js:
@noble/curves/abstract/modular.js:
@noble/curves/abstract/curve.js:
@noble/curves/abstract/weierstrass.js:
@noble/curves/secp256k1.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@scure/base/index.js:
@scure/base/index.js:
@scure/base/index.js:
  (*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
*/
