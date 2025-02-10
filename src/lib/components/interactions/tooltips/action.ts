import { popup, type PopupSettings } from "@skeletonlabs/skeleton"
import type { Action } from "svelte/action"
import { writable } from "svelte/store"


type StateEvent     =  { state: boolean }
type StateCallback  =  (e: StateEvent) => void   


type TooltipArgs = {
    settings  :  PopupSettings,
    value     :  string
}


const tooltipValue = writable<string | undefined>(undefined);


const tooltipState = (value: string, s: StateEvent) => {
    console.log("value: ", value, "state: ", s)
    if (s.state) {
        tooltipValue.set(value)
    } else {
        tooltipValue.set(undefined)
    }
} 


const combinedState = (value : string,  sc?: StateCallback) : StateCallback => {
    
    return (s: StateEvent) => {
        if (sc) {
            sc(s)
        }
        tooltipState(value, s)
    }
}


const tooltip : Action<HTMLElement, TooltipArgs> = (e: HTMLElement, args: TooltipArgs) => {
    
    const popupAction = popup(e, { 
        ...args.settings, 
        state: combinedState(args.value, args.settings.state)
    })
    
    return {
        update: (args: TooltipArgs) => popupAction.update(args.settings),
        destroy: () => popupAction.destroy()
    }
    
}

export { tooltip, tooltipValue, type TooltipArgs }


