<script lang="ts">

    export let value : string | number | undefined;
    export let options : string[];

    export let styles = "";
    export let selectStyles = "";
    export let placeholder : string = "";
    
    const selectClass = "rounded-container-token flex-grow px-2 " + selectStyles

</script>

<div class="input-group rounded-container-token bg-glass flex {styles}">
    <select class={selectClass} {placeholder} bind:value={value}>
        { #each options as o}
            <option value={o}>{o}</option>
        { /each }
    </select>
</div>