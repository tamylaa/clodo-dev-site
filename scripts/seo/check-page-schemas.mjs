import { loadPageSchemas } from '../../schema/build-integration.js';
const schemas = loadPageSchemas('workers-boilerplate');
console.log('Loaded page schemas count:', schemas.length);
console.log(JSON.stringify(schemas,null,2));
