import { browser } from "$app/environment";
import { type Writable, writable, get } from "svelte/store";

interface Serializer<T> {
    parse(text: string): T;
    stringify(object: T): string;
}
type StorageType = 'local' | 'session';
interface Options<T> {
    serializer?: Serializer<T>;
    storage?: StorageType;
}

function getStorage(type : 'local' | 'session') {
    return type === 'local' ? localStorage : sessionStorage;
}

const stores: Record<string, any> = {};export function localStorageStore<Value = any>( key: string, initialValue: Value, options?: Options<Value> ): Writable<Value> {
    const serializer = options?.serializer ?? JSON;
    const storageType = options?.storage ?? 'local';

    function updateStorage( key: string, value: Value ) {
        if ( !browser )
            return;
        getStorage( storageType ).setItem( key, serializer.stringify( value ) );
    }

    if ( !stores[key] ) {
        const store = writable( initialValue, ( set ) => {
            const json = browser ? getStorage( storageType ).getItem( key ) : null;
            if ( json ) {
                set( serializer.parse( json ) );
            }
            if ( browser ) {
                const handleStorage = ( event: StorageEvent ) => {
                    if ( event.key === key )
                        set( event.newValue ? serializer.parse( event.newValue ) : null );
                };
                window.addEventListener( 'storage', handleStorage );
                return () => window.removeEventListener( 'storage', handleStorage );
            }
        } );
        const { subscribe, set } = store;
        stores[key] = {
            set( value: Value ) {
                updateStorage( key, value );
                set( value );
            },
            update( updater: ( value: Value ) => Value ) {
                const value = updater( get( store ) );
                updateStorage( key, value );
                set( value );
            },
            subscribe
        };
    }
    return stores[key];
}

