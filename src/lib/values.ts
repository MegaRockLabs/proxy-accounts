import { getPrice } from "./prices";
import { formatUnits, parseUnits } from "viem";
import { writable, type Writable } from "svelte/store";
import type { RouteValues, Token } from "./types";
import { accountBalanceMap } from "./assets";

export const inValue : Writable<number> = writable(0);
export const inToken : Writable<Token> = writable();
export const outToken : Writable<Token> = writable();
export const routeValues = writable<RouteValues>();




export const updateInToken = async (
  values: RouteValues,
  token: Token,
  assign: boolean = true,
) => {
  console.log('Updating inToken:', token);
  
  // Prevent unnecessary updates if token hasn't changed
  if (values.inToken?.denom === token.denom) {
    console.log('InToken unchanged, skipping update');
    return values;
  }
  
  if (assign) inToken.set(token);
  values.inToken = token;
  values.inPrice = token.meta.isUsd ? 1 : (await getPrice(token.meta.geckoName));
  const accBal = accountBalanceMap[token.denom];
  const bal = BigInt(accBal?.amount || 0);
  const hum = parseFloat(formatUnits(bal, token.decimals));
  const val = hum ? Math.min(hum, token.meta.min) : token.meta.min;
  return updateInValue(values, val);
}



export const updateInValue = (
  values: RouteValues, 
  value: number,
  assign: boolean = true
) => {
  if (assign) inValue.set(value);
  values.inValue = value;
  values.inParsed = parseUnits(value.toString(), values.inToken.decimals);
  values.inUSD = (value * values.inPrice).toFixed(2);
  routeValues.set(values);
  return values;
}



export const updateOutToken = async (
  values: RouteValues,
  token: Token,
  assign: boolean = true
) => {
  // Prevent unnecessary updates if token hasn't changed
  if (values.outToken?.denom === token.denom) {
    console.log('OutToken unchanged, skipping update');
    return values;
  }
  
  if (assign) outToken.set(token);
  values.outToken = token;
  values.outPrice = token.meta.isUsd ? 1 : (await getPrice(token.meta.geckoName));
  return updateOutValue(values, 0);
} 




export const updateOutValue = (
  values: RouteValues, 
  value: number,
) => {
  values.outValue = value;
  values.outParsed = parseUnits(value.toString(), values.outToken.decimals);
  values.outUSD = (value * values.outPrice).toFixed(2);
  routeValues.set(values);
  return values;
}


// Legacy popup settings - these need to be migrated to Popover component
// See: https://www.skeleton.dev/docs/components/popover/svelte
type PopupSettings = {
  event: string;
  target: string;
  placement: string;
  closeQuery: string;
};

export const inTokensPopup: PopupSettings = {
    event: 'click',
    target: 'inTokens',
    placement: 'bottom',
    closeQuery: '.listbox-item'
};
  

export const outTokensPopup: PopupSettings = {
    event: 'click',
    target: 'outTokens',
    placement: 'bottom',
    closeQuery: '.listbox-item'
};



