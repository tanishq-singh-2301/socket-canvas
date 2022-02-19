import type { NextPage } from 'next';
import Head from 'next/head';
import Header from '@components/casuals/Header';

const Home: NextPage = () => {
  return (
    <div className='h-full max-w-screen flex justify-start items-center flex-col'>
      <Head>
        <title>Spotify</title>
        <link rel="icon" href="/Spotify-Icon-Logo.svg" />
      </Head>

      <Header />

      <main className='h-full w-full mx-auto py-6 px-6 sm:px-10 lg:px-8 flex justify-center items-center flex-col'>

      </main>

    </div>
  )
}

export default Home;