import { HeroTitleDesktop } from "./hero-title-desktop"
import { HeroTitleMobile } from "./hero-title-mobile"

export function HeroTitle() {
  return (
    <>
      <HeroTitleMobile />
      <HeroTitleDesktop />
    </>
  )
}

