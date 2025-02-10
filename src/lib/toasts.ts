// toastUtils.ts
import type { ToastSettings, ToastStore } from '@skeletonlabs/skeleton';

export function toastTransaction(toastStore: ToastStore, pendingMessage: string, successMessage: string, transaction: Promise<any>): void {
    // Trigger the pending transaction toast
    const pendingToast: ToastSettings = {
        message: pendingMessage,
        autohide: false,
    };
    toastStore.trigger(pendingToast);

    transaction
        .then(() => {
            toastStore.clear();
            const successToast: ToastSettings = {
                message: successMessage,
                timeout: 5000,
                autohide: true,
                hoverable: true,
            };
            toastStore.trigger(successToast);
        })
        .catch(err => {
            toastStore.clear();
            console.warn("Transaction error:", err);
            // Optionally, trigger a toast for the error case
            const errorToast: ToastSettings = {
                message: `Transaction failed: ${err.message}`,
                timeout: 5000,
                hoverable: true,
            };
            toastStore.trigger(errorToast);
        });
}
