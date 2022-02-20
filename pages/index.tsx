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

const websocketUrl: string = process.env.NEXT_PUBLIC_WS_ENDPOINT as string;
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
  const [wsInstance, setWsInstance] = useState<WebSocket | null>(() => {
    if (isBrowser)
      return new WebSocket(websocketUrl);

    else return null;
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

      <main className='h-full w-full flex justify-center items-center'>
        <canvas className='h-full w-full' id='canvas'></canvas>
      </main>

    </div>
  )
}

export default Home;