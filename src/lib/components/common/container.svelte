<script lang="ts">
    export let styles : string = ""
</script>

<div class="flex flex-col w-full md:w-2/3 lg:w-1/2 px-5 md:px-12 h-full mx-auto {styles}">
    <slot />
</div>
