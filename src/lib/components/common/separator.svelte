<script lang="ts">
    interface Props {
        size?: 1 | 2 | 3 | 4 | 5;
        styles?: string;
    }

    let { size = 1, styles = "" }: Props = $props();

    let classes = styles.length > 0 ? styles : `my-${size}`;
</script>

<div class={classes}>
    <br />
</div>