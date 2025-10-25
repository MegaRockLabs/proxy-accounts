<!-- @migration-task Error while migrating Svelte code: Expected a `#` character immediately following the opening bracket
https://svelte.dev/e/block_unexpected_character -->
<script lang="ts">

    export let value : string | number | undefined;
    export let options : string[];

    export let styles = "";
    export let selectStyles = "";
    export let placeholder : string = "";
    
    const selectClass = "rounded-container grow px-2 " + selectStyles

</script>

<div class="input-group rounded-container bg-glass flex {styles}">
    <select class={selectClass} {placeholder} bind:value={value}>
        { #each options as o}
            <option value={o}>{o}</option>
        { /each }
    </select>
</div>