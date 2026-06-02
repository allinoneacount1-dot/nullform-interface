import { g as getDefaultExportFromCjs } from "./react.mjs";
import { r as requireDist } from "./uuid.mjs";
var generateRequest_1;
var hasRequiredGenerateRequest;
function requireGenerateRequest() {
  if (hasRequiredGenerateRequest) return generateRequest_1;
  hasRequiredGenerateRequest = 1;
  const uuid = requireDist().v4;
  const generateRequest = function(method, params, id, options) {
    if (typeof method !== "string") {
      throw new TypeError(method + " must be a string");
    }
    options = options || {};
    const version = typeof options.version === "number" ? options.version : 2;
    if (version !== 1 && version !== 2) {
      throw new TypeError(version + " must be 1 or 2");
    }
    const request = {
      method
    };
    if (version === 2) {
      request.jsonrpc = "2.0";
    }
    if (params) {
      if (typeof params !== "object" && !Array.isArray(params)) {
        throw new TypeError(params + " must be an object, array or omitted");
      }
      request.params = params;
    }
    if (typeof id === "undefined") {
      const generator = typeof options.generator === "function" ? options.generator : function() {
        return uuid();
      };
      request.id = generator(request, options);
    } else if (version === 2 && id === null) {
      if (options.notificationIdNull) {
        request.id = null;
      }
    } else {
      request.id = id;
    }
    return request;
  };
  generateRequest_1 = generateRequest;
  return generateRequest_1;
}
var browser;
var hasRequiredBrowser;
function requireBrowser() {
  if (hasRequiredBrowser) return browser;
  hasRequiredBrowser = 1;
  const uuid = requireDist().v4;
  const generateRequest = requireGenerateRequest();
  const ClientBrowser = function(callServer, options) {
    if (!(this instanceof ClientBrowser)) {
      return new ClientBrowser(callServer, options);
    }
    if (!options) {
      options = {};
    }
    this.options = {
      reviver: typeof options.reviver !== "undefined" ? options.reviver : null,
      replacer: typeof options.replacer !== "undefined" ? options.replacer : null,
      generator: typeof options.generator !== "undefined" ? options.generator : function() {
        return uuid();
      },
      version: typeof options.version !== "undefined" ? options.version : 2,
      notificationIdNull: typeof options.notificationIdNull === "boolean" ? options.notificationIdNull : false
    };
    this.callServer = callServer;
  };
  browser = ClientBrowser;
  ClientBrowser.prototype.request = function(method, params, id, callback) {
    const self = this;
    let request = null;
    const isBatch = Array.isArray(method) && typeof params === "function";
    if (this.options.version === 1 && isBatch) {
      throw new TypeError("JSON-RPC 1.0 does not support batching");
    }
    const isRaw = !isBatch && method && typeof method === "object" && typeof params === "function";
    if (isBatch || isRaw) {
      callback = params;
      request = method;
    } else {
      if (typeof id === "function") {
        callback = id;
        id = void 0;
      }
      const hasCallback = typeof callback === "function";
      try {
        request = generateRequest(method, params, id, {
          generator: this.options.generator,
          version: this.options.version,
          notificationIdNull: this.options.notificationIdNull
        });
      } catch (err) {
        if (hasCallback) {
          callback(err);
          return;
        }
        throw err;
      }
      if (!hasCallback) {
        return request;
      }
    }
    let message;
    try {
      message = JSON.stringify(request, this.options.replacer);
    } catch (err) {
      callback(err);
      return;
    }
    this.callServer(message, function(err, response) {
      self._parseResponse(err, response, callback);
    });
    return request;
  };
  ClientBrowser.prototype._parseResponse = function(err, responseText, callback) {
    if (err) {
      callback(err);
      return;
    }
    if (!responseText) {
      callback();
      return;
    }
    let response;
    try {
      response = JSON.parse(responseText, this.options.reviver);
    } catch (err2) {
      callback(err2);
      return;
    }
    if (callback.length === 3) {
      if (Array.isArray(response)) {
        const isError = function(res) {
          return typeof res.error !== "undefined";
        };
        const isNotError = function(res) {
          return !isError(res);
        };
        callback(null, response.filter(isError), response.filter(isNotError));
        return;
      } else {
        callback(null, response.error, response.result);
        return;
      }
    }
    callback(null, response);
  };
  return browser;
}
var browserExports = requireBrowser();
const RpcClient = /* @__PURE__ */ getDefaultExportFromCjs(browserExports);
export {
  RpcClient as R
};
