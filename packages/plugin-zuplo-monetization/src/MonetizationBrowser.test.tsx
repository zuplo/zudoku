import { HttpResponse, http } from "msw";
import { setupWorker } from "msw/browser";
import { expect, test as testBase } from "vitest";
import { render } from "vitest-browser-react";
import { StaticZudoku } from "zudoku/testing";

import { zuploMonetizationPlugin } from "./ZuploMonetizationPlugin";

const worker = setupWorker(
  http.get(
    "https://api.zuploedge.com/v3/zudoku-metering/test/pricing-page",
    () => {
      return HttpResponse.json({
        items: [],
      });
    },
  ),
);

const test = testBase.extend({
  worker: [
    async ({ test }, use) => {
      await test;
      await worker.start({ quiet: true });
      await use(worker);
      worker.resetHandlers();
      worker.stop();
    },
    { auto: true },
  ],
});

test("renders name", async () => {
  const { getByText } = await render(
    <StaticZudoku
      env={{ ZUPLO_PUBLIC_DEPLOYMENT_NAME: "test" }}
      plugins={[
        zuploMonetizationPlugin({
          pricing: {
            title: "Pricing My App",
            subtitle:
              "See our pricing options and choose the one that best suits your needs.",
          },
        }),
      ]}
      path="/pricing"
    />,
  );
  await expect.element(getByText("Pricing My App")).toBeInTheDocument();
});
