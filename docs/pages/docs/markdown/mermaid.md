---
title: Mermaid Diagrams
sidebar_icon: chart-network
---

# Mermaid Diagrams

Zudoku supports [Mermaid](https://mermaid.js.org/) diagrams in your MDX documentation. Mermaid lets
you create diagrams and visualizations using text and code.

## Usage

To add a Mermaid diagram to your documentation, use a code block with the `mermaid` language
identifier:

````markdown
```mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```
````

## Supported Diagram Types

Mermaid supports many diagram types:

### Flowcharts

```mermaid
graph LR;
    A[Start] --> B{Decision};
    B -->|Yes| C[Action 1];
    B -->|No| D[Action 2];
```

### Sequence Diagrams

```mermaid
sequenceDiagram
    Alice->>Bob: Hello Bob!
    Bob-->>Alice: Hi Alice!
```

### Class Diagrams

```mermaid
classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal: +int age
    Animal: +makeSound()
```

### State Diagrams

```mermaid
stateDiagram-v2
    [*] --> Still
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]
```

### Gantt Charts

```mermaid
gantt
    title A Gantt Diagram
    dateFormat YYYY-MM-DD
    section Section
    Task 1 :a1, 2024-01-01, 30d
    Task 2 :after a1, 20d
```

## Configuration

All diagrams are rendered to static SVG at build time, providing optimal performance. The Mermaid
syntax is processed during the build phase, eliminating the need for client-side JavaScript.

## Learn More

For complete Mermaid syntax and examples, visit:

- [Mermaid Official Documentation](https://mermaid.js.org/)
- [Mermaid Live Editor](https://mermaid.live/) - Interactive editor to test diagrams
