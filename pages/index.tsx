import type { NextPage } from 'next';
import Head from 'next/head';
import { useEffect, useState } from 'react';

const getRandomColor: Function = (): string => {
  const colors: Array<string> = ["111827", "171717", "991b1b", "9a3412", "f59e0b", "3f6212", "16a34a", "0d9488", "0284c7", "1e40af", "6d28d9", "86198f", "9d174d", "f43f5e"];
  const randomColour: number = Math.floor(Math.random() * colors.length);

  return "#".concat(colors[randomColour]);
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
    if (wsInstance) {
      wsInstance.onopen = () => setWsState({ state: "Connected", color: "text-green-700" });
      wsInstance.onclose = () => setWsState({ state: "Closed", color: "text-red-600" });
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

            const { x: lx, y: ly } = body.lineTo;
            ctx.lineTo(lx, ly);

            ctx.stroke();
          }
        }
      }
    }
  }, [wsInstance]);

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

  const sketch: Function = (event: MouseEvent | TouchEvent | any, canvas: HTMLCanvasElement): void => {
    if (!paint) return;

    const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;

    ctx.beginPath();

    ctx.lineWidth = lineWidth;
    ctx.lineCap = lineCap;
    ctx.strokeStyle = strokeStyle;

    if (event.touches) {
      ctx.moveTo(coord.x, coord.y);
      getPositionTouch(event, canvas);
    }

    else
      getPosition(event, canvas);

    ctx.lineTo(coord.x, coord.y);

    if (wsInstance?.readyState === 1) {
      try {
        wsInstance!.send(JSON.stringify({
          action: "draw",
          body: {
            lineTo: coord,
            strokeStyle
          }
        }))
      } catch (error) {
        if (error instanceof Error)
          console.log(error.message);
      }
    }

    ctx.stroke();
  }

  return (
    <div className='h-full max-w-screen flex justify-start items-center flex-col'>
      <Head>
        <title>Socket Canvas</title>
        <link rel="icon" href="/icon.png" />
        <meta name="description" content="Create design 🎨 over multiple devices 💻 connected with the socket 🔐. Using socket-canvas." />
      </Head>

      <main className='h-full w-full flex justify-center items-center relative'>

        <header className='h-16 sm:h-20 w-full fixed top-0 left-0 right-0 flex justify-center items-center flex-col'>
          <span className='underline underline-offset-4'>Socket Canvas</span>
          <span className={`${wsState.color}`}>{wsState.state}</span>
        </header>

        <canvas className='h-full w-full' id='canvas'></canvas>

        <footer className='h-16 sm:h-20 w-full fixed bottom-0 left-0 right-0 flex justify-center items-center flex-col'>
          <a href='https://github.com/tanishq-singh-2301' rel="noreferrer" target="_blank" className='underline underline-offset-4 hover:text-gray-500'>By Tanishq Singh</a>
        </footer>

      </main>

    </div>
  )
}

export default Home;
