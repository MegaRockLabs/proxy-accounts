// toastUtils.ts
import { createToaster } from '@skeletonlabs/skeleton-svelte';

type Toaster = ReturnType<typeof createToaster>;

export function toastTransaction(
    toaster: Toaster, 
    pendingMessage: string, 
    successMessage: string, 
    transaction: Promise<any>,
    successSettings: any = {},
    pendingSettings: any = {}
): void {
    // Trigger the pending transaction toast
    toaster.info({
        title: pendingMessage,
        description: 'Processing...',
        ...pendingSettings
    });

    transaction
        .then(() => {
            toaster.dismiss();
            toaster.success({
                title: successMessage,
                ...successSettings
            });
        })
        .catch((err: Error) => {
            toaster.dismiss();
            console.warn("Transaction error:", err);
            toaster.error({
                title: 'Transaction failed',
                description: err.message,
            });
        });
}
