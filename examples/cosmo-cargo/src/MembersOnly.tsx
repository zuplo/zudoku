import { Button, Head, Link } from "zudoku/components";
import { useAuth } from "zudoku/hooks";
import { ArrowRight, Compass, Package, UserCheck } from "zudoku/icons";
import { Badge } from "zudoku/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "zudoku/ui/Card";

const HIGHLIGHTS = [
  {
    icon: Package,
    title: "Member rates",
    description:
      "20% off every shipment, every route, every quadrant of the galaxy.",
  },
  {
    icon: Compass,
    title: "Premium routes",
    description:
      "Skip the queue with member-only express lanes between major systems.",
  },
  {
    icon: UserCheck,
    title: "Priority support",
    description: "Talk to a real navigator within 60 seconds, day or night.",
  },
];

export const MembersOnly = () => {
  const { profile } = useAuth();
  const memberName = profile?.name ?? profile?.email?.split("@")[0] ?? "friend";

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12">
      <Head>
        <title>Members Only · Cosmo Cargo</title>
      </Head>

      <header className="flex flex-col items-start gap-3">
        <Badge variant="secondary">
          <UserCheck className="size-3" />
          Members area
        </Badge>
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
          Welcome aboard, <span className="text-primary">{memberName}</span>.
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          You&apos;re in. Here&apos;s a quick look at what your membership
          unlocks across the Cosmo Cargo network.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {HIGHLIGHTS.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title}>
              <CardHeader>
                <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="size-5" />
                </div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle>Ready to ship?</CardTitle>
          <CardDescription>
            Browse member-only guides or jump straight into the Shipments API.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/api-shipments">
              Open Shipments API
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/member-benefits">See all member benefits</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
};
