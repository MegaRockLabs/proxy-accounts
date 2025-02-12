import { getPrice } from "./prices";
import { parseUnits } from "viem";
import { writable, type Writable } from "svelte/store";
import type { RouteValues, Token } from "./types";
import type { PopupSettings } from "@skeletonlabs/skeleton";
import { accountBalanceMap } from "./assets";

export const inValue : Writable<number> = writable(0);

export const inToken : Writable<Token> = writable();
export const outToken : Writable<Token> = writable();

export const routeValues = writable<RouteValues>();


export const updateInToken = async (
  values: RouteValues,
  token: Token,
  assign: boolean = true
) => {
  if (assign) inToken.set(token);
  values.inToken = token;
  values.inPrice = token.meta.isUsd ? 1 : (await getPrice(token.meta.geckoName));
  const bal = accountBalanceMap[token.denom];
  
  return updateInValue(values, bal ? parseFloat(bal.amountHuman) : token.meta.min ?? 0);
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



