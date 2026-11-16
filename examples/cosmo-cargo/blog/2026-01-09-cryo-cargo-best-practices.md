---
title: Five rules for shipping cryogenic cargo
authors: [orion]
tags: [Guides, Cargo Handbook]
---

Cryogenic shipments account for less than 3% of our volume but more than a third of our claims.
These five rules prevent most of them.

## 1. Pre-chill the container

Load cargo into a container that has held its target temperature for at least one full cycle.

## 2. Declare the thermal class

Every cryo shipment needs a thermal class on its manifest so the right hold is assigned.

## 3. Avoid gravity-well transfers

Each transfer through a gravity well costs about 0.4 K of thermal margin. Book direct lanes, or ship
with [Quantum Express](./2026-09-14-quantum-express-launch.mdx), which skips gravity wells entirely.

## 4. Track the hold temperature

Subscribe to `shipment.temperature_alert` webhooks to hear about excursions while there is time to
act.

## 5. Plan for customs holds

Quarantine inspections can add a full cycle. See the [Cargo Handbook](/cargo-handbook/cryo) for the
stations with cold-storage customs bays.
