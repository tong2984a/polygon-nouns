import '../styles/globals.css'
import Link from 'next/link'

function Marketplace({ Component, pageProps }) {
  return (
    <div>
      <nav className="border-b p-6">
        <p className="text-4xl font-bold">Metaverse Character Marketplace</p>
        <div className="flex mt-4">
          <Link href="/">
            <a className="mr-4 text-pink-500">
              Public Home
            </a>
          </Link>
          <Link href="/history">
            <a className="mr-6 text-pink-500">
              History
            </a>
          </Link>
          <Link href="/my-collection">
            <a className="mr-6 text-pink-500">
              My Collection
            </a>
          </Link>
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
  )
}

export default Marketplace
