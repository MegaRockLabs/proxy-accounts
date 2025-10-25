<script lang="ts">
	import { NEUTRON_DENOM } from '$lib/vars';
    import { accountCreationFees } from "$lib/registry";
    import { routeValues } from "$lib/values";
    import { Accordion } from "@skeletonlabs/skeleton-svelte";
    import { directRes } from '$lib/routes';
    let feeCoin = $derived($accountCreationFees.find(fee => fee.denom == NEUTRON_DENOM));
    interface Props {
        creating?: boolean;
    }

    let { creating = false }: Props = $props();
</script>


{#if $directRes && $routeValues?.totalFeeUSD}

    {@const { 
            totalFeeUSD, bridgeToken, gasToken,
            bridgeValue, bridgeUSD, 
            gasValue, gasUSD, 
        } = $routeValues}

    <Accordion padding="px-1 sm:px-4">

        <Accordion.Item regionControl="font-bold">
            
            {#snippet lead()}
                    
                <div class="w-full">Fees:</div>
                
                    {/snippet}

            {#snippet summary()}
                    
                <div class="w-full flex justify-end">
                    <div class="flex gap-1 items-center">
                    <!-- <img src="{USDC_INPUT.logo}" alt="fee coin logo" class="w-5 h-5" /> -->
                    <span>$</span>
                    <span>{totalFeeUSD}</span>
                    </div>
                </div>

                
                    {/snippet}

            {#snippet content()}
                    

                    <div class="font-bold text-sm px-2 pt-2 flex flex-col gap-2">
        
        
                        {#if gasValue}
                            <div class="w-full grid grid-cols-2 pt-2 md:pt-5 gap-y-3">
                                <div class="col-span-2 sm:col-span-1">Gas Fee</div>
                                <div class="col-span-2 sm:col-span-1 text-xs w-full flex justify-end">
                                    <div class="flex gap-3 items-center justify-end">
                                        <img src="{gasToken.meta.logo}" alt="send token logo" class="w-5 h-5" />
                                        <span>{gasValue}</span>
                                        <div class="flex gap-1 items-center justify-end">
                                            <span></span>
                                            <span>(${gasUSD})</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {/if}

                        {#if bridgeValue}
                            <div class="w-full grid grid-cols-2 pt-2 md:pt-5 gap-y-3">
                                <div class="col-span-2 sm:col-span-1">Bridging Fee</div>
                                <div class="col-span-2 sm:col-span-1 text-xs w-full flex justify-end ">
                                    <div class="flex gap-3 items-center justify-end">
                                        <img src="{bridgeToken.meta.logo}" alt="send token logo" class="w-5 h-5" />
                                        <span>{bridgeValue}</span>
                                        <div class="flex gap-1 items-center justify-end">
                                            <span></span>
                                            <span>(${bridgeUSD.toFixed(3)})</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        { /if }


                        {#if creating && feeCoin}
                            <div class="w-full grid grid-cols-2 pt-2 md:pt-5 gap-y-3">
                                <div class="col-span-2 sm:col-span-1">Account Creation Fee</div>
                                <div class="col-span-2 sm:col-span-1 text-xs w-full flex justify-end">
                                    <div class="flex gap-3 items-center justify-end">
                                        <img src="{feeCoin.token.meta.logo}" alt="fee coin logo" class="w-5 h-5" />
                                        <span>{feeCoin.amountHuman}</span>
                                        <div class="flex gap-1 items-center justify-end">
                                            <span></span>
                                            <span>(${feeCoin.amountUsd})</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        { /if }
                    
                    </div>

                
                    {/snippet}

        </Accordion.Item>

    </Accordion>
    
{ /if }