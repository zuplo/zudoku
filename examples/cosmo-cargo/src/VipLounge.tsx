import { useEffect, useState } from "react";
import { Button, Head } from "zudoku/components";
import { useAuth } from "zudoku/hooks";
import {
  CircleCheck,
  Martini,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Telescope,
  Ticket,
  Trophy,
  Wand2,
} from "zudoku/icons";
import { Badge } from "zudoku/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "zudoku/ui/Card";

const CONCIERGE_LINES = [
  "Your Nebula Martini is chilling at −270°C, sir. Shaken, not stirred by gravity.",
  "We've reserved the Andromeda booth. The view of the quasar is spectacular tonight.",
  "Pilot Orion is warming up your private shuttle. ETA to departure: 42 seconds.",
  "A complimentary zero-g massage has been scheduled on Deck 7.",
  "Your cargo was upgraded to Quantum Class. It arrived before you ordered it.",
  "The chef has prepared tonight's tasting menu: slow-roasted supernova, asteroid truffle.",
  "Captain Cosmo sends his regards and a bottle of 3024 Tau Ceti Reserve.",
];

const PERKS = [
  {
    icon: Rocket,
    title: "Priority Warp Lane",
    description:
      "Skip the queue at every wormhole. Your packages jump the line across 14 galaxies.",
    tag: "Unlimited",
  },
  {
    icon: Martini,
    title: "Complimentary Nebula Bar",
    description:
      "Unlimited zero-gravity cocktails. We recommend the Event Horizon (ask for no ice).",
    tag: "On the house",
  },
  {
    icon: Telescope,
    title: "Private Observation Deck",
    description:
      "A panoramic view of the Pillars of Creation. Bring a friend, bring a telescope.",
    tag: "Deck 9",
  },
  {
    icon: Shield,
    title: "Quantum Insurance Plus",
    description:
      "Your cargo is insured across every possible timeline. Even the weird ones.",
    tag: "Multiverse",
  },
  {
    icon: Wand2,
    title: "Dedicated AI Concierge",
    description:
      "Meet ARIA-9, your personal orbital assistant. She knows your coffee order already.",
    tag: "24/7/∞",
  },
  {
    icon: Ticket,
    title: "Front-Row Meteor Shower Seats",
    description:
      "Perseid season tickets. Including the good ones over the Europa colony.",
    tag: "Season pass",
  },
];

const DEPARTURES = [
  { route: "Sol → Proxima Centauri b", gate: "A42", status: "Boarding" },
  { route: "Earth → Kepler-442b", gate: "C07", status: "On Time" },
  { route: "Luna City → Olympus Mons", gate: "B19", status: "Departed" },
  { route: "Titan → Europa", gate: "D33", status: "Boarding" },
  { route: "Andromeda Hub → Milky Way", gate: "Ω01", status: "Final Call" },
];

export const VipLounge = () => {
  const { profile } = useAuth();
  const [conciergeIndex, setConciergeIndex] = useState(0);
  const [conciergeVisible, setConciergeVisible] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setConciergeIndex((i) => (i + 1) % CONCIERGE_LINES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const memberName = profile?.name ?? profile?.email?.split("@")[0] ?? "VIP";
  const memberSince = new Date().getFullYear() - 2;

  return (
    <section className="relative overflow-hidden">
      <Head>
        <title>VIP Lounge · Cosmo Cargo</title>
      </Head>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background-image:radial-gradient(circle_at_20%_10%,oklch(0.9_0.12_85/0.25),transparent_40%),radial-gradient(circle_at_80%_30%,oklch(0.7_0.2_290/0.25),transparent_40%),radial-gradient(circle_at_50%_90%,oklch(0.8_0.15_200/0.2),transparent_50%)]"
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12">
        <header className="flex flex-col items-start gap-3">
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/10 text-primary"
          >
            <Sparkles className="size-3" />
            Members-only · Clearance Level Ω
          </Badge>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Welcome to the{" "}
            <span className="inline-block -rotate-1 rounded-3xl bg-primary px-3 py-1 text-primary-foreground">
              VIP Lounge
            </span>
            <span aria-hidden className="ml-2">
              🥂
            </span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Good to see you, <strong>{memberName}</strong>. The champagne is
            cold, the warp drives are warm, and the stars are aligned.
          </p>
        </header>

        <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/20 via-background to-background shadow-lg">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:p-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                <Trophy className="size-4" />
                Platinum Cosmonaut
              </div>
              <div className="font-mono text-2xl font-bold md:text-3xl">
                {memberName.toUpperCase()}
              </div>
              <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Member since</dt>
                  <dd className="font-semibold">{memberSince}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Light-years flown</dt>
                  <dd className="font-semibold">847,291</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="flex items-center gap-1.5 font-semibold text-emerald-500">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                    </span>
                    Cleared for launch
                  </dd>
                </div>
              </dl>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end md:text-right">
              <div className="flex -space-x-1 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed decorative list
                  <Star key={i} className="size-5 fill-primary" />
                ))}
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                CARD · CC-
                {profile?.email
                  ? profile.email.length.toString().padStart(4, "0")
                  : "0000"}
                -Ω42
              </div>
            </div>
          </div>
        </Card>

        <div>
          <h2 className="mb-4 text-2xl font-bold">Your cosmic perks</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PERKS.map((perk) => {
              const Icon = perk.icon;
              return (
                <Card
                  key={perk.title}
                  className="group transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
                >
                  <CardHeader>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary transition-transform group-hover:scale-110">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle className="flex items-center justify-between gap-2">
                      <span>{perk.title}</span>
                      <Badge variant="muted" className="font-mono text-[10px]">
                        {perk.tag}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{perk.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="border-primary/30 bg-primary/5 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="size-5 text-primary" />
                Summon your concierge
              </CardTitle>
              <CardDescription>
                ARIA-9 is standing by. Ring the bell for a fresh suggestion.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div
                aria-live="polite"
                className="min-h-[72px] rounded-lg border border-dashed border-primary/40 bg-background/60 p-4 font-serif text-sm italic leading-relaxed"
              >
                {conciergeVisible
                  ? `“${CONCIERGE_LINES[conciergeIndex]}”`
                  : "Press the bell — I promise I'm better than room service."}
              </div>
              <Button
                onClick={() => {
                  setConciergeVisible(true);
                  setConciergeIndex((i) => (i + 1) % CONCIERGE_LINES.length);
                }}
                className="self-start"
              >
                <Sparkles className="size-4" />
                Ring the bell
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="size-5 text-primary" />
                Live departures
              </CardTitle>
              <CardDescription>
                The next ships leaving Gate Ω. All times in Galactic Standard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {DEPARTURES.map((d) => (
                  <li
                    key={d.route}
                    className="flex items-center justify-between gap-4 py-3 text-sm"
                  >
                    <span className="font-medium">{d.route}</span>
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        Gate {d.gate}
                      </span>
                      <Badge
                        variant={
                          d.status === "Departed"
                            ? "muted"
                            : d.status === "Final Call"
                              ? "warning"
                              : "default"
                        }
                      >
                        {d.status === "Boarding" && (
                          <CircleCheck className="size-3" />
                        )}
                        {d.status}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <footer className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 text-center text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            Fine print from the Galactic Tourism Board:
          </span>{" "}
          Cocktails are served at relativistic speeds. Time dilation may apply.
          Please do not feed the wormholes.
        </footer>
      </div>
    </section>
  );
};
