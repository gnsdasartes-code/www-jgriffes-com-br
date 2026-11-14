import { put } from '@vercel/blob';
import { sql,initialize } from '../server/database.mjs';
import { createHandler } from '../server/store-handler.mjs';
export default createHandler({sql,initialize,put});
