import '../styles/globals.css';
import 'nprogress/nprogress.css';
import type { AppProps } from 'next/app';
import Router from 'next/router';
import nProgress from 'nprogress';

nProgress.configure({
  showSpinner: false,
  trickleSpeed: 800
});

Router.events.on("routeChangeStart", nProgress.start);
Router.events.on("routeChangeError", nProgress.done);
Router.events.on("routeChangeComplete", nProgress.done);

const appHeight: Function = (): void => {
  const doc: HTMLElement = document.documentElement;
  doc.style.setProperty('--app-height', `${window.innerHeight}px`);
}

const MyApp = ({ Component, pageProps }: AppProps) => {
  if (typeof window !== "undefined") {
    window.addEventListener('resize', () => appHeight());
    appHeight();
  }

  return <Component {...pageProps} />
}

export default MyApp;