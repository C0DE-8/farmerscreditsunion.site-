// db.js
const { connectProject } = require('./diamond-sql');

const gateway = connectProject(process.env.SITE_ID, {
  apiKey: process.env.API_KEY,
  dbmsUrl: process.env.DBMS_URL,
  timeoutMs: process.env.DBMS_TIMEOUT_MS
});

function normalizeParams(params) {
  return Array.isArray(params) ? params : [];
}

function normalizeQueryArgs(params, callback) {
  if (typeof params === 'function') {
    return { params: [], callback: params };
  }

  return { params: normalizeParams(params), callback };
}

function query(sql, params, callback) {
  const args = normalizeQueryArgs(params, callback);
  const run = gateway.query(sql, args.params);

  if (typeof args.callback === 'function') {
    run.then((result) => args.callback(null, result)).catch((error) => args.callback(error));
    return;
  }

  return run.catch((error) => {
    console.error('DBMS query failed:', error.message);
    throw error;
  });
}

function execute(sql, params, callback) {
  return query(sql, params, callback);
}

const promiseApi = {
  async query(sql, params = []) {
    const result = await gateway.query(sql, normalizeParams(params));
    return [result, undefined];
  },

  async execute(sql, params = []) {
    const result = await gateway.execute(sql, normalizeParams(params));
    return [result, undefined];
  },

  async beginTransaction() {
    throw transactionNotSupportedError();
  },

  async commit() {
    throw transactionNotSupportedError();
  },

  async rollback() {
    throw transactionNotSupportedError();
  }
};

const db = {
  siteId: gateway.siteId,
  dbmsUrl: gateway.dbmsUrl,
  query,
  execute,
  status: () => gateway.status(),
  promise: () => promiseApi,

  connect(callback) {
    const run = gateway.status();
    if (typeof callback === 'function') {
      run.then(() => callback(null)).catch(callback);
      return;
    }
    return run;
  },

  beginTransaction(callback) {
    if (typeof callback === 'function') process.nextTick(() => callback(transactionNotSupportedError()));
  },

  commit(callback) {
    if (typeof callback === 'function') process.nextTick(() => callback(transactionNotSupportedError()));
  },

  rollback(callback) {
    if (typeof callback === 'function') process.nextTick(() => callback());
  }
};

function transactionNotSupportedError() {
  return new Error('DBMS Gateway does not expose per-connection transactions. Add transaction support to the gateway before using this route.');
}

module.exports = db;
