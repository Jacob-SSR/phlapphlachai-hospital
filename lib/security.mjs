export { validId, contentVisible } from "./auth-core.mjs";
export function originAllowed(origin,host,configuredOrigin){
 if(!origin)return false;
 try{const parsed=new URL(origin);if(!['http:','https:'].includes(parsed.protocol)||parsed.origin!==origin)return false;
  if(configuredOrigin)return parsed.origin===new URL(configuredOrigin).origin;
  return parsed.host.toLowerCase()===String(host??'').toLowerCase();
 }catch{return false}
}
