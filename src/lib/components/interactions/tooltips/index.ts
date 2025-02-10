import { type PopupSettings } from "@skeletonlabs/skeleton"
import { type TooltipArgs, tooltip, tooltipValue } from "./action"



const fullAmount : PopupSettings = {
    event:  "hover",
    target: "full-amount-tooltip",
}


const tooltips = {
    fullAmount,
} 

export { tooltips, tooltip, tooltipValue, type TooltipArgs}