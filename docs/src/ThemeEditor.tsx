import { useEffect, useMemo, useState } from "react";
import { useTheme } from "zudoku/components";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert.js";
import { Button } from "zudoku/ui/Button.js";
import { Callout } from "zudoku/ui/Callout.js";
import { Card, CardContent, CardDescription } from "zudoku/ui/Card.js";
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
  const { resolvedTheme = "dark", setTheme } = useTheme();
  const [color, setColor] = useState<string>();
  const [radius, setRadius] = useState<number>();

  const activeColor = useMemo(() => {
    return baseColors.find((c) => c.name === color);
  }, [color, resolvedTheme]);

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

    if (radius) {
      document.documentElement.style.setProperty("--radius", `${radius}rem`);
    } else {
      document.documentElement.style.removeProperty("--radius");
    }
  }, [activeColor, resolvedTheme, radius]);

  const handleReset = () => {
    setColor(undefined);
    setRadius(undefined);
  };

  return (
    <div className="space-y-3 pt-6">
      <div className="text-4xl font-extrabold">Color in Your App.</div>
      <div>Hand-picked themes that you can copy and paste into your apps.</div>
      <div className="border border-b" />
      <Button size="sm" variant="outline" onClick={handleReset}>
        Reset Theme
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="font-medium text-sm mt-4 mb-1">Radius</div>
          <div className="flex gap-2">
            {availableRadius.map((r) => (
              <Button
                className={cn(r === radius && "border-primary border-2")}
                key={r}
                size="sm"
                variant="outline"
                onClick={() => setRadius(r)}
              >
                {r}
              </Button>
            ))}
          </div>
          <div className="font-medium text-sm mt-4 mb-1 flex justify-between items-center max-w-md">
            <div>Color</div>
            <a
              href="https://ui.shadcn.com/themes"
              target="_blank"
              className="text-xs"
              rel="noreferrer"
            >
              by shadcn
            </a>
          </div>
          <div className="grid grid-cols-4 gap-2 max-w-md">
            {baseColors.map((color) => (
              <Button
                key={color.name}
                size="sm"
                variant="outline"
                onClick={() => setColor(color.name)}
                className={cn(
                  color.name === activeColor?.name && "border-primary border-2",
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
                  className="w-4 h-4 rounded-full mr-2"
                  style={{
                    backgroundColor: `hsl(${color.activeColor[resolvedTheme]})`,
                  }}
                />

                <div className="flex-1">{color.name}</div>
              </Button>
            ))}
          </div>
          <div className="font-medium text-sm mt-4 mb-1">Mode</div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className={cn(
                resolvedTheme === "light" && "border-primary border-2",
              )}
              onClick={() => setTheme("light")}
            >
              Light
            </Button>
            <Button
              variant="outline"
              className={cn(
                resolvedTheme === "dark" && "border-primary border-2",
              )}
              onClick={() => setTheme("dark")}
            >
              Dark
            </Button>
          </div>
          <div className="font-medium text-sm mt-4 mb-1">Button Preview</div>
          <div className="grid grid-cols-1 gap-2">
            <Card>
              <CardDescription />
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
              <CardDescription />
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
              <CardDescription />
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
        <div className="rounded-lg overflow-hidden">
          <SyntaxHighlight
            language="css"
            className="p-2 max-h-[500px] overflow-y-auto"
            code={JSON.stringify(
              {
                theme: {
                  light: Object.fromEntries(
                    Object.entries(activeColor?.cssVars[resolvedTheme] ?? {})
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
        </div>
      </div>
    </div>
  );
};
