<script lang="ts">
	import { tweened } from "svelte/motion";
	import { tooltipValue } from "./action";
</script>


<div data-popup="full-amount-tooltip">
	{ #if tweened($tooltipValue, { delay: 100 }) }
		<div class="p-1 bg-surface-50-900-token rounded-token" >
			{$tooltipValue}
		</div>
	{ /if }
</div>