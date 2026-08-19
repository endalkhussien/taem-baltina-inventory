import Link from 'next/link'

export default function ShopFooter() {
  return (
    <footer className="mt-16 w-full border-t border-[#e0c0b2]/20 bg-[#472a06] text-[#ffdbcd]">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-5 py-16 md:grid-cols-3 md:px-16">
        <div className="space-y-4">
          <div className="font-display text-2xl font-semibold text-[#fff8f5]">Taem Baltina</div>
          <p className="max-w-xs text-sm text-[#ffdcbd]">
            Artisanal Ethiopian pantry blends — sourced with care, milled in small batches, ready for your kitchen.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="mb-1 text-xs font-bold uppercase tracking-widest text-[#fff8f5]/70">Explore</h4>
          <Link href="/shop" className="w-fit text-[#ffdcbd] underline-offset-4 hover:text-white hover:underline">
            Shop all blends
          </Link>
          <Link href="/#story" className="w-fit text-[#ffdcbd] underline-offset-4 hover:text-white hover:underline">
            Our heritage
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="mb-1 text-xs font-bold uppercase tracking-widest text-[#fff8f5]/70">Support</h4>
          <p className="text-sm text-[#ffdcbd]">Orders ship from Addis Ababa. Cash on delivery or bank transfer.</p>
        </div>
      </div>
    </footer>
  )
}
