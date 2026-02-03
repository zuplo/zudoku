import {
  ArrowRightIcon,
  GaugeIcon,
  KeyIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  ZapIcon,
} from "zudoku/icons";
import { BoxLongshadow } from "./BoxLongshadow";

const benefits = [
  {
    icon: RefreshCwIcon,
    title: "Auto-Sync OpenAPI",
    description: "Your docs update automatically when your API changes",
  },
  {
    icon: KeyIcon,
    title: "Built-in Auth",
    description: "API keys and auth flow seamlessly integrated",
  },
  {
    icon: GaugeIcon,
    title: "Usage Analytics",
    description: "See how developers use your APIs in real-time",
  },
  {
    icon: ShieldCheckIcon,
    title: "Rate Limiting",
    description: "Display rate limits directly in your documentation",
  },
];

export const BetterTogether = () => {
  return (
    <div className="w-full bg-gradient-to-br from-[#7362EF] via-[#8D83FF] to-[#B6A0FB] py-20 px-10">
      <div className="max-w-screen-lg mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6 text-white font-medium">
            The Complete API Platform
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Better Together
          </h2>
          <p className="text-xl text-white/90 max-w-2xl">
            Zudoku powers the documentation for Zuplo — the programmable API
            gateway. Together, they deliver the complete developer experience.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <BoxLongshadow className="p-3 bg-[#F2F4FF]">
                  <img
                    src="/zuplo.svg"
                    alt="Zuplo"
                    className="h-8 w-8 object-contain"
                  />
                </BoxLongshadow>
                <div className="h-[2px] w-8 bg-gradient-to-r from-[#7362EF] to-[#B6A0FB]" />
                <div className="text-2xl">+</div>
                <div className="h-[2px] w-8 bg-gradient-to-r from-[#B6A0FB] to-[#7362EF]" />
                <BoxLongshadow className="p-3 bg-[#F2F4FF]">
                  <img
                    src="/zudoku-logo.svg"
                    alt="Zudoku"
                    className="h-8 w-8 object-contain"
                  />
                </BoxLongshadow>
              </div>

              <h3 className="text-2xl font-bold text-black mb-2">
                API Management + Beautiful Docs
              </h3>
              <p className="text-muted-foreground mb-6">
                Deploy your API gateway and developer portal together. One
                platform, seamless integration, exceptional developer
                experience.
              </p>

              <a
                href="https://zuplo.com"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-black/90 transition-all"
              >
                Try Zuplo Free
                <ArrowRightIcon
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/20 transition-all group"
              >
                <benefit.icon
                  size={24}
                  className="text-white mb-3 group-hover:scale-110 transition-transform"
                />
                <h4 className="text-white font-semibold mb-1">
                  {benefit.title}
                </h4>
                <p className="text-white/80 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-3 text-white/90">
            <ZapIcon size={20} className="text-yellow-300" />
            <span>Instant deployment</span>
          </div>
          <div className="hidden sm:block w-1 h-1 bg-white/50 rounded-full" />
          <div className="flex items-center gap-3 text-white/90">
            <ShieldCheckIcon size={20} className="text-green-300" />
            <span>Enterprise ready</span>
          </div>
          <div className="hidden sm:block w-1 h-1 bg-white/50 rounded-full" />
          <div className="flex items-center gap-3 text-white/90">
            <KeyIcon size={20} className="text-blue-300" />
            <span>Free tier available</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BetterTogether;
