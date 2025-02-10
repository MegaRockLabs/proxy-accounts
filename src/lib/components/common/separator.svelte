<script lang="ts">
    export let size : 1 | 2 | 3 | 4 | 5 = 1;
    export let styles: string = "";

    let classes = styles.length > 0 ? styles : `my-${size}`;
</script>

<div class={classes}>
    <br />
</div>