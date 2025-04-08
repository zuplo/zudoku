import { useEffect, useMemo, useState } from "react";
import { ClientOnly, useTheme } from "zudoku/components";
import { DownloadIcon, MoonIcon, RotateCcwIcon, SunIcon } from "zudoku/icons";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert.js";
import { Button } from "zudoku/ui/Button.js";
import { Callout } from "zudoku/ui/Callout.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "zudoku/ui/Card.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "zudoku/ui/Dialog.js";
import { Progress } from "zudoku/ui/Progress.js";
import { Switch } from "zudoku/ui/Switch.js";
import { SyntaxHighlight } from "zudoku/ui/SyntaxHighlight.js";
import { cn } from "zudoku/ui/util.js";
import { baseColors } from "./baseColors/baseColors.js";

const availableRadius = [0, 0.3, 0.6, 1];

const kebabToCamel = (str: string) =>
  str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

const camelToKebabCase = (str: string) =>
  str.replace(/([A-Z])/g, "-$1").toLowerCase();

export const ThemeEditor = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [color, setColor] = useState<string>();
  const [radius, setRadius] = useState<number>();

  const activeColor = useMemo(() => {
    return baseColors.find((c) => c.name === color);
  }, [color]);

  useEffect(() => {
    if (activeColor) {
      for (const [key, value] of Object.entries(
        activeColor.cssVars[resolvedTheme],
      )) {
        document.documentElement.style.setProperty(
          `--${camelToKebabCase(key)}`,
          value as string,
        );
      }
    }

    if (typeof radius === "number") {
      document.documentElement.style.setProperty("--radius", `${radius}rem`);
    } else {
      document.documentElement.style.removeProperty("--radius");
    }

    return () => {
      document.documentElement.style.removeProperty("--radius");

      if (activeColor) {
        for (const [key, value] of Object.entries(
          activeColor?.cssVars[resolvedTheme],
        )) {
          document.documentElement.style.removeProperty(
            `--${camelToKebabCase(key)}`,
          );
        }
      }
    };
  }, [activeColor, resolvedTheme, radius]);

  const handleReset = () => {
    setColor(undefined);
    setRadius(undefined);
  };

  return (
    <>
      <div className="flex gap-2 mt-4">
        <Button size="sm" variant="outline" onClick={handleReset}>
          <RotateCcwIcon size={16} className="me-2" /> Reset Theme
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <DownloadIcon size={16} className="me-2" /> Get Theme Config
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[666px]">
            <DialogHeader>
              <DialogTitle>Theme </DialogTitle>
              <DialogDescription>
                Copy and paste the following code into your Zudoku config.
              </DialogDescription>
            </DialogHeader>
            <SyntaxHighlight
              language="css"
              showCopy="always"
              showCopyText
              className="p-2 border rounded-lg max-h-[400px] overflow-y-auto"
              code={JSON.stringify(
                {
                  theme: {
                    light: Object.fromEntries(
                      Object.entries(activeColor?.cssVars.light ?? {})
                        .concat(
                          typeof radius === "number"
                            ? [["radius", `${radius}rem`]]
                            : [],
                        )
                        .map(([key, value]) => [
                          kebabToCamel(key),
                          value.toString(),
                        ]),
                    ),

                    dark: Object.fromEntries(
                      Object.entries(activeColor?.cssVars.dark ?? {})
                        .concat(
                          typeof radius === "number"
                            ? [["radius", `${radius}rem`]]
                            : [],
                        )
                        .map(([key, value]) => [
                          kebabToCamel(key),
                          value.toString(),
                        ]),
                    ),
                  },
                },
                null,
                2,
              )}
            />
          </DialogContent>
        </Dialog>
      </div>
      <div className="border-border border-b border-dashed border-px my-2" />
      <div className="grid grid-cols-[minmax(0,515px)_1fr] gap-2">
        <div>
          <Card>
            {/* <CardHeader className="py-4" /> */}
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 ">
              <CardHeader className="px-0 py-6">
                <CardDescription>Mode</CardDescription>
              </CardHeader>
              <CardHeader className="px-0 py-6">
                <CardDescription>Radius</CardDescription>
              </CardHeader>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className={cn(
                    resolvedTheme === "light" && "border-primary border-2",
                  )}
                  onClick={() => setTheme("light")}
                >
                  <SunIcon size={16} className="me-2" />
                  Light
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    resolvedTheme === "dark" && "border-primary border-2",
                  )}
                  onClick={() => setTheme("dark")}
                >
                  <MoonIcon size={16} className="me-2" />
                  Dark
                </Button>
              </div>
              <div className="flex gap-2">
                {availableRadius.map((r) => (
                  <Button
                    className={cn(
                      r === radius && "border-primary border-2",
                      "w-10",
                    )}
                    key={r}
                    size="sm"
                    variant="outline"
                    onClick={() => setRadius(r)}
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </CardContent>

            <CardHeader className="space-y-0 py-4 flex flex-row items-center gap-2">
              <CardDescription>Colors</CardDescription>
              <a
                href="https://ui.shadcn.com/themes"
                target="_blank"
                className="text-xs"
                rel="noreferrer"
              >
                by shadcn
              </a>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 ">
                {baseColors.map((color) => (
                  <Button
                    key={color.name}
                    size="sm"
                    variant="outline"
                    onClick={() => setColor(color.name)}
                    className={cn(
                      color.name === activeColor?.name &&
                        "border-primary border-2",
                    )}
                    style={
                      {
                        "--theme-primary": `hsl(${
                          activeColor?.activeColor[resolvedTheme]
                        })`,
                      } as React.CSSProperties
                    }
                  >
                    <div
                      className="w-4 h-4 rounded-full me-2"
                      style={{
                        backgroundColor: `hsl(${color.activeColor[resolvedTheme]})`,
                      }}
                    />

                    <div className="flex-1">{color.name}</div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="rounded-lg overflow-hidden">
          <div className="grid grid-cols-1 gap-2">
            <Card>
              <CardHeader>
                <CardDescription>Button Preview</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2">
                <Button>Button</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Controls </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 text-sm font-medium">
                <div>On</div>
                <Switch defaultChecked={true} />
                <div>Off</div>
                <Switch />
                <div>50%</div>
                <Progress value={50} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertTitle>Alert</AlertTitle>
                  <AlertDescription>
                    This is an alert. It is used to display important
                    information.
                  </AlertDescription>
                </Alert>
                <Callout type="info">
                  This is a callout. It is used to display important
                  information.
                </Callout>
                <Callout type="caution">
                  This is a callout. It is used to display important
                  information.
                </Callout>
                <Callout type="danger">
                  This is a callout. It is used to display important
                  information.
                </Callout>
                <Callout type="tip">
                  This is a callout. It is used to display important
                  information.
                </Callout>
                <Callout type="note">
                  This is a callout. It is used to display important
                  information.
                </Callout>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export const ThemeEditorPage = () => {
  return (
    <div className="flex flex-col gap-3 pt-6">
      <div className="text-4xl font-extrabold">Color in Your App.</div>
      <div>Hand-picked themes that you can copy and paste into your apps.</div>

      <ClientOnly>
        <ThemeEditor />
      </ClientOnly>
    </div>
  );
};

export default ThemeEditorPage;
