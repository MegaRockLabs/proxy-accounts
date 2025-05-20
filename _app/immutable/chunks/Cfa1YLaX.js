import{i as E,r as A,O as v,M as s,C as r,A as y,E as U,x as u,o as T,R as h,S as k,T as O,U as L,a as I,b as K,c as R,d as z,n as M,e as p,f as D}from"./C4ga2LPv.js";const _=E`
  :host {
    z-index: var(--w3m-z-index);
    display: block;
    backface-visibility: hidden;
    will-change: opacity;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    opacity: 0;
    background-color: var(--wui-cover);
    transition: opacity 0.2s var(--wui-ease-out-power-2);
    will-change: opacity;
  }

  :host(.open) {
    opacity: 1;
  }

  :host(.embedded) {
    position: relative;
    pointer-events: unset;
    background: none;
    width: 100%;
    opacity: 1;
  }

  wui-card {
    max-width: var(--w3m-modal-width);
    width: 100%;
    position: relative;
    animation: zoom-in 0.2s var(--wui-ease-out-power-2);
    animation-fill-mode: backwards;
    outline: none;
    transition:
      border-radius var(--wui-duration-lg) var(--wui-ease-out-power-1),
      background-color var(--wui-duration-lg) var(--wui-ease-out-power-1);
    will-change: border-radius, background-color;
  }

  :host(.embedded) wui-card {
    max-width: 400px;
  }

  wui-card[shake='true'] {
    animation:
      zoom-in 0.2s var(--wui-ease-out-power-2),
      w3m-shake 0.5s var(--wui-ease-out-power-2);
  }

  wui-flex {
    overflow-x: hidden;
    overflow-y: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  @media (max-height: 700px) and (min-width: 431px) {
    wui-flex {
      align-items: flex-start;
    }

    wui-card {
      margin: var(--wui-spacing-xxl) 0px;
    }
  }

  @media (max-width: 430px) {
    wui-flex {
      align-items: flex-end;
    }

    wui-card {
      max-width: 100%;
      border-bottom-left-radius: var(--local-border-bottom-mobile-radius);
      border-bottom-right-radius: var(--local-border-bottom-mobile-radius);
      border-bottom: none;
      animation: slide-in 0.2s var(--wui-ease-out-power-2);
    }

    wui-card[shake='true'] {
      animation:
        slide-in 0.2s var(--wui-ease-out-power-2),
        w3m-shake 0.5s var(--wui-ease-out-power-2);
    }
  }

  @keyframes zoom-in {
    0% {
      transform: scale(0.95) translateY(0);
    }
    100% {
      transform: scale(1) translateY(0);
    }
  }

  @keyframes slide-in {
    0% {
      transform: scale(1) translateY(50px);
    }
    100% {
      transform: scale(1) translateY(0);
    }
  }

  @keyframes w3m-shake {
    0% {
      transform: scale(1) rotate(0deg);
    }
    20% {
      transform: scale(1) rotate(-1deg);
    }
    40% {
      transform: scale(1) rotate(1.5deg);
    }
    60% {
      transform: scale(1) rotate(-1.5deg);
    }
    80% {
      transform: scale(1) rotate(1deg);
    }
    100% {
      transform: scale(1) rotate(0deg);
    }
  }

  @keyframes w3m-view-height {
    from {
      height: var(--prev-height);
    }
    to {
      height: var(--new-height);
    }
  }
`;var l=function(m,e,t,o){var a=arguments.length,i=a<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,d;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(m,e,t,o);else for(var c=m.length-1;c>=0;c--)(d=m[c])&&(i=(a<3?d(i):a>3?d(e,t,i):d(e,t))||i);return a>3&&i&&Object.defineProperty(e,t,i),i};const C="scroll-lock";let n=class extends A{constructor(){super(),this.unsubscribe=[],this.abortController=void 0,this.enableEmbedded=v.state.enableEmbedded,this.open=s.state.open,this.caipAddress=r.state.activeCaipAddress,this.caipNetwork=r.state.activeCaipNetwork,this.shake=s.state.shake,this.initializeTheming(),y.prefetch(),this.unsubscribe.push(s.subscribeKey("open",e=>e?this.onOpen():this.onClose()),s.subscribeKey("shake",e=>this.shake=e),r.subscribeKey("activeCaipNetwork",e=>this.onNewNetwork(e)),r.subscribeKey("activeCaipAddress",e=>this.onNewAddress(e)),v.subscribeKey("enableEmbedded",e=>this.enableEmbedded=e)),U.sendEvent({type:"track",event:"MODAL_LOADED"})}firstUpdated(){if(this.caipAddress){if(this.enableEmbedded){s.close();return}this.onNewAddress(this.caipAddress)}this.open&&this.onOpen()}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),this.onRemoveKeyboardListener()}render(){return this.style.cssText=`
      --local-border-bottom-mobile-radius: ${this.enableEmbedded?"clamp(0px, var(--wui-border-radius-l), 44px)":"0px"};
    `,this.enableEmbedded?u`${this.contentTemplate()}
        <w3m-tooltip></w3m-tooltip> `:this.open?u`
          <wui-flex @click=${this.onOverlayClick.bind(this)} data-testid="w3m-modal-overlay">
            ${this.contentTemplate()}
          </wui-flex>
          <w3m-tooltip></w3m-tooltip>
        `:null}contentTemplate(){return u` <wui-card
      shake="${this.shake}"
      data-embedded="${T(this.enableEmbedded)}"
      role="alertdialog"
      aria-modal="true"
      tabindex="0"
      data-testid="w3m-modal-card"
    >
      <w3m-header></w3m-header>
      <w3m-router></w3m-router>
      <w3m-snackbar></w3m-snackbar>
      <w3m-alertbar></w3m-alertbar>
    </wui-card>`}async onOverlayClick(e){e.target===e.currentTarget&&await this.handleClose()}async handleClose(){h.state.view==="UnsupportedChain"||await k.isSIWXCloseDisabled()?s.shake():s.close()}initializeTheming(){const{themeVariables:e,themeMode:t}=O.state,o=L.getColorTheme(t);I(e,o)}onClose(){this.open=!1,this.classList.remove("open"),this.onScrollUnlock(),K.hide(),this.onRemoveKeyboardListener()}onOpen(){this.open=!0,this.classList.add("open"),this.onScrollLock(),this.onAddKeyboardListener()}onScrollLock(){const e=document.createElement("style");e.dataset.w3m=C,e.textContent=`
      body {
        touch-action: none;
        overflow: hidden;
        overscroll-behavior: contain;
      }
      w3m-modal {
        pointer-events: auto;
      }
    `,document.head.appendChild(e)}onScrollUnlock(){const e=document.head.querySelector(`style[data-w3m="${C}"]`);e&&e.remove()}onAddKeyboardListener(){var t;this.abortController=new AbortController;const e=(t=this.shadowRoot)==null?void 0:t.querySelector("wui-card");e==null||e.focus(),window.addEventListener("keydown",o=>{if(o.key==="Escape")this.handleClose();else if(o.key==="Tab"){const{tagName:a}=o.target;a&&!a.includes("W3M-")&&!a.includes("WUI-")&&(e==null||e.focus())}},this.abortController)}onRemoveKeyboardListener(){var e;(e=this.abortController)==null||e.abort(),this.abortController=void 0}async onNewAddress(e){const t=r.state.isSwitchingNamespace,o=R.getPlainAddress(e);!o&&!t?s.close():t&&o&&h.goBack(),await k.initializeIfEnabled(),this.caipAddress=e,r.setIsSwitchingNamespace(!1)}onNewNetwork(e){var w,b,f,g;y.prefetch();const t=(b=(w=this.caipNetwork)==null?void 0:w.caipNetworkId)==null?void 0:b.toString(),o=(f=e==null?void 0:e.caipNetworkId)==null?void 0:f.toString(),a=t&&o&&t!==o,i=r.state.isSwitchingNamespace,d=((g=this.caipNetwork)==null?void 0:g.name)===z.UNSUPPORTED_NETWORK_NAME,c=h.state.view==="ConnectingExternal",x=!this.caipAddress,N=a&&!d&&!i,S=h.state.view==="UnsupportedChain";!c&&(x||S||N)&&h.goBack(),this.caipNetwork=e}};n.styles=_;l([M({type:Boolean})],n.prototype,"enableEmbedded",void 0);l([p()],n.prototype,"open",void 0);l([p()],n.prototype,"caipAddress",void 0);l([p()],n.prototype,"caipNetwork",void 0);l([p()],n.prototype,"shake",void 0);n=l([D("w3m-modal")],n);export{n as W3mModal};
