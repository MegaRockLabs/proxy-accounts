<script lang="ts">
    import { directRes } from "$lib/routes";
    import { formatSeconds } from "$lib/utils";
    import { routeValues } from "$lib/values";
    import FeeAccordion from "./feeAccordion.svelte";
    export let error: string = "";
</script>

<div class="my-2 flex flex-col justify-between gap-5">
    
{ #if error }
    <div class="w-full flex items-center gap-2 justify-between font-bold px-1 sm:px-4 variant-ghost-error p-2 rounded-container-token">
        <div>Error</div>
        <div class="flex justify-between items-center gap-4 text-sm sm:text-base">
            <span>{error}</span>
        </div>
    </div>

{ :else if $directRes && $routeValues?.routeSecs != undefined }

    <div class="w-full flex items-center justify-between font-bold px-1 sm:px-4">
        <div>Estimated Time</div>
        <div class="flex justify-between items-center gap-4 text-sm sm:text-base">
            <span>{formatSeconds($routeValues.routeSecs)}</span>
        </div>
    </div>

    <FeeAccordion />
        
{ /if }
        
</div>
