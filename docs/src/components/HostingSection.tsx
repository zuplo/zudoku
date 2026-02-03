import { cn } from "zudoku";
import { ArrowRightIcon, CheckIcon, StarIcon } from "zudoku/icons";
import { BoxLongshadow } from "./BoxLongshadow";

const hostingOptions = [
  {
    name: "Vercel",
    logo: "/host/vercel.svg",
    href: "https://vercel.com",
  },
  {
    name: "Cloudflare",
    logo: "/host/cloudflare.svg",
    href: "https://cloudflare.com",
  },
  {
    name: "Netlify",
    logo: "/host/netlify.svg",
    href: "https://netlify.com",
  },
];

const zuploFeatures = [
  "Auto-sync from your API gateway",
  "Built-in authentication",
  "API key management",
  "Usage analytics dashboard",
  "Custom domains included",
];

export const HostingSection = () => {
  return (
    <div className="w-full max-w-screen-lg mx-auto px-10 py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-semibold capitalize mb-4">
          Host it{" "}
          <span className="bg-gradient-to-br from-[#B6A0FB] via-[#7362EF] to-[#D2C6FF] bg-clip-text text-transparent">
            Anywhere
          </span>
        </h2>
        <p className="text-muted-foreground text-xl">
          Deploy to any static hosting platform, or get the complete experience
          with Zuplo
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Zuplo - Recommended Option */}
        <div className="lg:col-span-3 relative">
          <div className="absolute -top-3 left-6 z-10">
            <div className="bg-gradient-to-r from-[#7362EF] to-[#B6A0FB] text-white text-sm font-medium px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
              <StarIcon size={14} fill="currentColor" />
              Recommended
            </div>
          </div>
          <BoxLongshadow
            shadowLength="large"
            className="p-8 bg-gradient-to-br from-white to-[#F8F7FF] h-full border-2 border-[#7362EF]"
          >
            <div className="flex items-center gap-4 mb-6">
              <img src="/host/zuplo.svg" alt="Zuplo" className="h-10" />
              <div className="flex-1" />
              <span className="text-sm text-muted-foreground bg-[#F2F4FF] px-3 py-1 rounded-full">
                API Gateway + Docs
              </span>
            </div>

            <h3 className="text-2xl font-bold mb-2">
              The Complete API Platform
            </h3>
            <p className="text-muted-foreground mb-6">
              Deploy your Zudoku documentation alongside your API gateway. Get
              automatic OpenAPI sync, authentication, and analytics out of the
              box.
            </p>

            <ul className="space-y-3 mb-8">
              {zuploFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="bg-[#7362EF] rounded-full p-1">
                    <CheckIcon size={12} className="text-white" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href="https://zuplo.com"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-black/90 transition-all"
            >
              Get Started with Zuplo
              <ArrowRightIcon
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </a>
          </BoxLongshadow>
        </div>

        {/* Other Hosting Options */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium mb-2">
            Or deploy anywhere
          </p>
          {hostingOptions.map((host) => (
            <a
              key={host.name}
              href={host.href}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "group flex items-center gap-4 p-4 rounded-xl border border-black/10 hover:border-[#7362EF]/50 hover:bg-[#F8F7FF] transition-all",
              )}
            >
              <img src={host.logo} alt={host.name} className="h-8" />
              <div className="flex-1" />
              <ArrowRightIcon
                size={16}
                className="text-muted-foreground group-hover:text-[#7362EF] group-hover:translate-x-1 transition-all"
              />
            </a>
          ))}
          <p className="text-sm text-muted-foreground mt-2">
            Zudoku generates static files that work with any hosting provider.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HostingSection;
