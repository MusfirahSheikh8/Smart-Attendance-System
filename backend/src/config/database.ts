import oracledb, { Connection, Pool, Result } from 'oracledb';
import { config } from './env';
import { logger } from '../utils/logger';
try {
  const clientOpts = config.db.libDir ? { libDir: config.db.libDir } : {};
  oracledb.initOracleClient(clientOpts);
  // logger.info(`Oracle Thick Mode enabled${config.db.libDir ? ' (using ' + config.db.libDir + ')' : ''}.`);
} catch (err: any) {
  if (err.message.includes('DPI-1047') || err.message.includes('NJS-138')) {
    logger.warn('---------------------------------------------------------');
    logger.warn('ORACLE CONNECTIVITY ERROR:');
    logger.warn('Architecture Mismatch or Instant Client Missing.');
    logger.warn('Your Node.js is 64-bit, but your Oracle 10g is 32-bit.');
    logger.warn('ACTION REQUIRED:');
    logger.warn('1. Download 64-bit Oracle Instant Client (Version 11.2 or 19.x)');
    logger.warn('2. Extract it to a folder (e.g., C:\\oracle\\instantclient)');
    logger.warn('3. Set DB_LIB_DIR=C:\\oracle\\instantclient in your .env file');
    logger.warn('URL: https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html');
    logger.warn('---------------------------------------------------------');
  } else {
    logger.warn('Oracle init failed: ' + err.message);
  }
}

// Configure global oracledb settings
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT; // rows as JS objects
oracledb.autoCommit = false;                       // explicit COMMIT required
oracledb.fetchAsString = [oracledb.CLOB];             // CLOB → string auto-convert
oracledb.maxRows = 1000;

// Singleton pool reference
let pool: Pool | null = null;

/** Build the connection string for Oracle */
function buildConnectString(): string {
  if (config.db.walletLocation) {
    return `(description=(retry_count=20)(retry_delay=3)` +
      `(address=(protocol=tcps)(port=${config.db.port})(host=${config.db.host}))` +
      `(connect_data=(service_name=${config.db.service}))` +
      `(security=(ssl_server_dn_match=yes)))`;
  }
  return `${config.db.host}:${config.db.port}/${config.db.service}`;
}

/** Initialize the global connection pool — call once at startup */
export async function initPool(): Promise<void> {
  if (pool) return;

  try {
    const poolConfig: oracledb.PoolAttributes = {
      user: config.db.user,
      password: config.db.password,
      connectString: buildConnectString(),
      poolMin: config.db.poolMin,
      poolMax: config.db.poolMax,
      poolIncrement: config.db.poolIncrement,
      poolTimeout: 60,
      queueTimeout: 10000,
    };

    if (config.db.walletLocation) {
      (poolConfig as any).walletLocation = config.db.walletLocation;
      (poolConfig as any).walletPassword = config.db.walletPassword;
    }

    pool = await oracledb.createPool(poolConfig);
    const mode = (oracledb as any).thin ? 'THIN' : 'THICK';

    // Get DB Version
    const conn = await pool.getConnection();
    const result = await conn.execute('SELECT banner FROM v$version');
    await conn.close();
    const version = result.rows ? (result.rows[0] as any).BANNER : 'Unknown';

    // logger.info(`Oracle connection pool created [${mode} MODE] (${config.db.host}:${config.db.port}/${config.db.service})`);
    // logger.info(`Connected to: ${version}`);


  } catch (err: any) {
    logger.error('Failed to create Oracle connection pool:', err.message);
    // If it's a version mismatch and we are in thin mode, give a clear hint
    if (err.message.includes('NJS-138')) {
      logger.error('ERROR: Oracle 10g is not supported in Thin mode. You MUST enable Thick mode with a 64-bit Instant Client.');
    }
    throw err;
  }
}

/** Get a connection from the pool */
export async function getConnection(): Promise<Connection> {
  if (!pool) throw new Error('Database pool not initialized. Call initPool() first.');
  return pool.getConnection();
}

/** Close the pool gracefully — call on server shutdown */
export async function closePool(): Promise<void> {
  if (!pool) return;
  try {
    await pool.close(10);
    pool = null;
    // logger.info('Oracle connection pool closed.');
  } catch (err) {
    logger.error('Error closing Oracle pool:', err);
  }
}

/** Pool health-check — returns statistics */
export function poolStats(): any | null {
  return pool ? pool.getStatistics() : null;
}


export interface QueryOptions {
  autoCommit?: boolean;
  maxRows?: number;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  binds: oracledb.BindParameters = {},
  options: QueryOptions = {}
): Promise<T[]> {
  const conn = await getConnection();
  try {
    const result: Result<T> = await conn.execute<T>(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      maxRows: options.maxRows ?? 1000,
      autoCommit: options.autoCommit ?? false,
    });
    return (result.rows ?? []) as T[];
  } finally {
    await conn.close();
  }
}

export async function execute(
  sql: string,
  binds: oracledb.BindParameters = {},
  options: QueryOptions = {}
): Promise<{ rowsAffected: number; lastRowid?: string; outBinds?: any }> {
  const conn = await getConnection();
  try {
    const result = await conn.execute(sql, binds, {
      autoCommit: options.autoCommit ?? true,
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    return {
      rowsAffected: result.rowsAffected ?? 0,
      lastRowid: (result as any).lastRowid,
      outBinds: result.outBinds,
    };
  } catch (err) {
    throw err;
  } finally {
    await conn.close();
  }
}

export async function executeProcedure(
  procName: string,
  binds: Record<string, any>
): Promise<Record<string, unknown>> {
  const conn = await getConnection();
  try {
    const paramList = Object.keys(binds).map(k => `:${k}`).join(', ');
    const bindVars = { ...binds };
    const sql = `BEGIN ${procName}(${paramList}); END;`;

    const result = await conn.execute(sql, bindVars, { autoCommit: true });
    const outValues: Record<string, unknown> = {};
    for (const [key, def] of Object.entries(binds)) {
      if (
        def.dir === oracledb.BIND_OUT ||
        def.dir === oracledb.BIND_INOUT
      ) {
        outValues[key] = (result.outBinds as Record<string, unknown>)?.[key];
      }
    }
    return outValues;
  } finally {
    await conn.close();
  }
}
