import type { NextPage } from 'next';
import Head from 'next/head';
import { useEffect, useState } from 'react';

const getRandomColor: Function = (): string => {
  var letters: string = '0123456789ABCDEF';
  var color: string = '#';

  for (var i = 0; i < 6; i++)
    color += letters[Math.floor(Math.random() * 16)];

  return color;
}

const websocketUrl: string = process.env.NEXT_PUBLIC_WS_ENDPOINT as string || "no-link";
let coord: { x: number; y: number; } = { x: 0, y: 0 };
let paint: boolean = false;
const lineWidth = 1;
const lineCap: "round" | "butt" | "square" = "round";
const strokeStyle: string = getRandomColor();

const resize: Function = (canvas: HTMLCanvasElement): void => {
  const ctx = canvas.getContext("2d")!;

  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
}

const getPosition: Function = (event: MouseEvent, canvas: HTMLCanvasElement): void => {
  coord.x = event.clientX - canvas.offsetLeft;
  coord.y = event.clientY - canvas.offsetTop;
}

const getPositionTouch: Function = (event: TouchEvent, canvas: HTMLCanvasElement): void => {
  coord.x = event.touches[0].clientX - canvas.offsetLeft;
  coord.y = event.touches[0].clientY - canvas.offsetTop;
}

const startPainting: Function = (event: MouseEvent | TouchEvent | any, canvas: HTMLCanvasElement): void => {
  paint = true;

  if (event.touches)
    getPositionTouch(event, canvas);

  else
    getPosition(event, canvas);
}

const stopPainting: Function = (): void => {
  paint = false;
}

const Home: NextPage = () => {
  const isBrowser: boolean = typeof window !== "undefined";
  const [wsState, setWsState] = useState<{ state: string; color: string; }>({ state: "Connecting", color: "text-yellow-900" });
  const [wsInstance, setWsInstance] = useState<WebSocket | null>(() => {
    try {
      if (isBrowser)
        return new WebSocket(websocketUrl);
    } catch (error) { }
    return null;
  });

  useEffect(() => {
    const canvas: HTMLCanvasElement | null = document.querySelector("#canvas");

    if (canvas) {
      resize(canvas);

      document.addEventListener('mousedown', (event: MouseEvent) => startPainting(event, canvas));
      document.addEventListener('mouseup', (event: MouseEvent) => stopPainting(event, canvas));
      document.addEventListener('mousemove', (event: MouseEvent) => sketch(event, canvas));

      document.addEventListener('touchstart', (event: TouchEvent) => startPainting(event, canvas));
      document.addEventListener('touchend', () => stopPainting());
      document.addEventListener('touchmove', (event: TouchEvent) => sketch(event, canvas));

      window.addEventListener('resize', () => resize(canvas));
    }

  }, []);

  if (wsInstance?.readyState === 2 || wsInstance?.readyState === 3) {
    wsInstance.close();

    const newWs: WebSocket = new WebSocket(websocketUrl);
    setWsInstance(newWs);

    console.log("reconnected")
  }

  const sketch: Function = (event: MouseEvent | TouchEvent | any, canvas: HTMLCanvasElement): void => {
    if (!paint) return;

    const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;

    ctx.beginPath();

    ctx.lineWidth = lineWidth;
    ctx.lineCap = lineCap;
    ctx.strokeStyle = strokeStyle;

    if (event.touches)
      getPositionTouch(event, canvas);

    else
      getPosition(event, canvas);

    ctx.lineTo(coord.x, coord.y); // try with this only first

    if (wsInstance?.readyState === 1) {
      wsInstance.send(JSON.stringify({
        action: "draw",
        body: {
          lineTo: coord,
          strokeStyle
        }
      }))
    }

    ctx.stroke();
  }

  const animation: Function = (): void => {
    switch (wsInstance?.readyState) {
      case 0:
        if (wsState.state !== "Connecting")
          setWsState({ state: "Connecting", color: "text-yellow-900" });
        break;

      case 1:
        if (wsState.state !== "Connected")
          setWsState({ state: "Connected", color: "text-green-700" });
        break;

      case 2:
        if (wsState.state !== "Closing")
          setWsState({ state: "Closing", color: "text-orange-400" });
        break;

      case 3:
        if (wsState.state !== "Closed")
          setWsState({ state: "Closed", color: "text-red-600" });
        break;
    }

    if (wsInstance?.readyState === 1) {
      wsInstance.onmessage = (messageEvent: MessageEvent<any>) => {
        const { data: RecievedData } = messageEvent;
        const data: JSON = JSON.parse(RecievedData);
        const { action, body }: any = data;

        if (action === "draw") {
          const canvas: HTMLCanvasElement | null = document.querySelector("#canvas");

          if (canvas) {
            const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;

            ctx.beginPath();

            ctx.lineWidth = lineWidth;
            ctx.lineCap = lineCap;
            ctx.strokeStyle = body?.strokeStyle || "black";

            const { x, y } = body.lineTo;

            ctx.lineTo(x, y);

            ctx.stroke();
          }
        }
      }
    }

    requestAnimationFrame(() => animation())
  }

  if (isBrowser)
    animation();

  return (
    <div className='h-full max-w-screen flex justify-start items-center flex-col'>
      <Head>
        <title>Socket Canvas</title>
        <link rel="icon" href="/icon.png" />
        <meta name="description" content="Create design 🎨 over multiple devices 💻 connected with the socket 🔐. Using socket-canvas." />
      </Head>

      <main className='h-full w-full flex justify-center items-center relative'>

        <header className='h-20 w-full fixed top-0 left-0 right-0 flex justify-center items-center flex-col'>
          <span className='underline underline-offset-4'>Socket Canvas</span>
          <span className={`${wsState.color}`}>{wsState.state}</span>
        </header>

        <canvas className='h-[calc(100%-10rem)] w-full z-10' id='canvas'></canvas>

        <footer className='h-20 w-full fixed bottom-0 left-0 right-0 flex justify-center items-center flex-col'>
          <a href='https://github.com/tanishq-singh-2301' rel="noreferrer" target="_blank" className='underline underline-offset-4 hover:text-gray-500'>By Tanishq Singh</a>
        </footer>

      </main>

    </div>
  )
}

export default Home;