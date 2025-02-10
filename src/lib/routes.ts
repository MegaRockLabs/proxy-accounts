import type { SwapVenue } from "@skip-go/client";
import { Base, CosmosHub, Neutron, Noble, Osmosis } from "./chains";
import { ALL_ETH, ATOM, AXL_USDC, BASE_ETH, BASE_USDC, BASE_WETH, NOBLE_USDC, NTRN, SOLANA_USDC, WST_ETH } from "./tokens"
import { BASE_ID, NEUTRON_ID } from "./vars";


type RouteInfo = {
    time: number;
    swap? : boolean;
    onlyTwo?: boolean;
    feeUsd: number;
    chadresses?: string[];
}

type DestInfo = {
    nonGo?: RouteInfo;
    go: RouteInfo;
}

const withOsmo = [Base.id, Osmosis.id, Neutron.id];
const withNoble = [Base.id, Noble.id, Neutron.id];
const usdFour = [Base.id, Osmosis.id, Noble.id, Neutron.id];
const cosmoFour = [Base.id, Osmosis.id, CosmosHub.id, Neutron.id];

const solWithNoble = ["solana", Noble.id, Neutron.id];


const BaseUsdDestinations : Record<string, DestInfo> = {

    [AXL_USDC.denom]: {
        nonGo: {
            time: 1440,
            feeUsd: 0.2,
            swap: false,
            onlyTwo: true,
        },

        go: {
            time: 30,
            feeUsd: 0.095,
            swap: true,
            chadresses: usdFour
        }
    },

    [NOBLE_USDC.denom]: {

        nonGo: {
            time: 1440,
            feeUsd: 0.2,
            swap: false,
            onlyTwo: true,
        },


        go: {
            time: 30,
            feeUsd: 0.1,
            swap: true,
            chadresses: usdFour
        }
    },

    [ATOM.denom]: {
        go: {
            time: 30,
            feeUsd: 0.042,
            chadresses: cosmoFour
        }
    },

    [NTRN.denom]: {
        nonGo: {
            time: 1440,
            feeUsd: 0.2,
            onlyTwo: false,
            chadresses: withOsmo
        },

        go: {
            time: 20,
            feeUsd: 0.04,
            chadresses: withOsmo
        }
    },

    [ALL_ETH.denom]: {
        nonGo: {
            time: 1470,
            feeUsd: 0.2,
            chadresses: withOsmo
        },

        go: {
            time: 20,
            feeUsd: 0.045,
            chadresses: withOsmo
        }
    },

    [WST_ETH.denom]: {
        nonGo: {
            time: 1470,
            feeUsd: 0.2,
            chadresses: withOsmo
        },

        go: {
            time: 20,
            feeUsd: 0.05,
            chadresses: withOsmo
        }
    }
}


const BaseWethDestinations : Record<string, DestInfo> = {
    [AXL_USDC.denom]: {
        nonGo: {
            time: 1440,
            feeUsd: 0.2,
            swap: false,
            onlyTwo: true,
        },
        go: {
            time: 30,
            feeUsd: 0.049,
            chadresses: usdFour
        }
    },

    [NOBLE_USDC.denom]: {
        nonGo: {
            time: 1110,
            feeUsd: 0.2,
            swap: false,
            chadresses: withNoble
        },
        go: {
            time: 30,
            feeUsd: 0.047,
            chadresses: usdFour
        }
    },

    [ATOM.denom]: {
        nonGo: {
            time: 1500,
            feeUsd: 0.20,
            chadresses: cosmoFour
        },
        go: {
            time: 30,
            feeUsd: 0.049,
            chadresses: cosmoFour
        }
    },

    [NTRN.denom]: {
        nonGo: {
            time: 1470,
            feeUsd: 0.2,
            onlyTwo: false,
            chadresses: withOsmo
        },
        go: {
            time: 20,
            feeUsd: 0.046,
            chadresses: withOsmo
        }
    },

    [ALL_ETH.denom]: {
        nonGo: {
            time: 1470,
            feeUsd: 0.2,
            onlyTwo: false,
            chadresses: withOsmo
        },

        go: {
            time: 20,
            feeUsd: 0.0505,
            chadresses: withOsmo
        }
    },


    [WST_ETH.denom]: {

        nonGo: {
            time: 1470,
            feeUsd: 0.2,
            onlyTwo: false,
            chadresses: withOsmo
        },

        go: {
            time: 20,
            feeUsd: 0.047,
            chadresses: withOsmo
        }
    }
}

export const BaseEthDestinations : Record<string, DestInfo> = {

    [AXL_USDC.denom]: {
        nonGo: {
            time: 1440,
            feeUsd: 0.2,
            swap: false,
            onlyTwo: true,
        },
        go: {
            time: 30,
            feeUsd: 0.049,
            chadresses: usdFour
        }
    },

    [NOBLE_USDC.denom]: {

        nonGo: {
            time: 1110,
            feeUsd: 0.02,
            swap: false,
            chadresses: withNoble
        },

        go: {
            time: 30,
            feeUsd: 0.047,
            chadresses: usdFour
        }

    },

    [ATOM.denom]: {

        nonGo: {
            time: 1500,
            feeUsd: 0.20,
            chadresses: cosmoFour
        },

        go: {
            time: 30,
            feeUsd: 0.049,
            chadresses: cosmoFour
        }
    },

    [NTRN.denom]: {
        nonGo: {
            time: 1440,
            feeUsd: 0.2,
            onlyTwo: false,
            chadresses: withOsmo
        },

        go: {
            time: 20,
            feeUsd: 0.0499,
            chadresses: withOsmo
        }
    },

    [ALL_ETH.denom]: {
        nonGo: {
            time: 1470,
            feeUsd: 0.2,
            onlyTwo: false,
            chadresses: withOsmo
        },

        go: {
            time: 20,
            feeUsd: 0.05,
            chadresses: withOsmo
        }
    },


    [WST_ETH.denom]: {
        nonGo: {
            time: 1440,
            feeUsd: 0.2,
            onlyTwo: true
        },

        go: {
            time: 20,
            feeUsd: 0.05,
            chadresses: withOsmo
        },
    }

}



export const SolUsdcDestinations : Record<string, DestInfo> = {

    [NOBLE_USDC.denom]: {
        nonGo: {
            time: 150,
            feeUsd: 0.02,
            swap: false,
            chadresses: solWithNoble
        },

        go: {
            time: 150,
            feeUsd: 0.02,
            chadresses: solWithNoble
        }
    },
    

}


export const RouteMap : Record<string, Record<string, DestInfo>> = {

    [BASE_USDC.denom]: BaseUsdDestinations,

    [BASE_WETH.denom]: BaseWethDestinations,

    [BASE_ETH.denom]: BaseEthDestinations,

    [SOLANA_USDC.denom]: SolUsdcDestinations,
}   


export const BaseUniswapVenue : SwapVenue = {
    chainID: BASE_ID,
    name: "base-uniswap",
    logoUri: "https://raw.githubusercontent.com/Uniswap/brand-assets/main/Uniswap%20Brand%20Assets/Uniswap_icon_pink.svg"
};

export const AstroportVenue  : SwapVenue = {
    chainID: NEUTRON_ID,
    name: "neutron-astroport",
    logoUri: "https://raw.githubusercontent.com/skip-mev/skip-go-registry/main/swap-venues/astroport/logo.png"
};

export const LidoSatelliteVenue : SwapVenue = {
    chainID: NEUTRON_ID,
    name: "neutron-lido-satellite",
    logoUri: "https://raw.githubusercontent.com/skip-mev/skip-go-registry/main/swap-venues/lido-satellite/logo.png"
};


export const DualityVenue : SwapVenue = {
    chainID: NEUTRON_ID,
    name: "neutron-duality",
    logoUri: "https://raw.githubusercontent.com/skip-mev/skip-go-registry/main/swap-venues/duality/logo.png"
};


export const NeutronDropVenue : SwapVenue = {
    chainID: NEUTRON_ID,
    name: "neutron-drop",
    logoUri: "https://raw.githubusercontent.com/skip-mev/skip-go-registry/main/swap-venues/drop/logo.png"
};

export const NeutronAstrovaultVenue : SwapVenue = {
    chainID: NEUTRON_ID,
    name: "neutron-astrovault",
    logoUri: "https://raw.githubusercontent.com/skip-mev/skip-go-registry/main/swap-venues/astrovault/logo.png"
};


export const AllNeutronVenues = [AstroportVenue, LidoSatelliteVenue, DualityVenue, NeutronDropVenue, NeutronAstrovaultVenue];