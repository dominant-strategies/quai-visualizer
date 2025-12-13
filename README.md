# Quai Chain Visualizer

A real-time blockchain visualizer for the Quai Network featuring 2D and 3D views.

## Requirements

- Node.js (v16+)
- npm

## Installation

```bash
npm install
```

## Running

```bash
npm start
```

Opens at [http://localhost:4000](http://localhost:4000)

## Features

- **3D View**: Interactive Three.js visualization of the blockchain
- **2D View**: D3-based chain visualization
- **Mainnet / 2x2 modes**: Toggle between network configurations
- **Multiple themes**: Space, Tron, Quai

## Build

```bash
npm run build
```

## Docker

```bash
docker build -t quai-visualizer .
docker run -p 4000:4000 quai-visualizer
```
