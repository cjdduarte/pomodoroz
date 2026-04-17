#!/usr/bin/env node

import { spawn } from "node:child_process";

const commands = [
  ["node", ["./scripts/pnpmw.mjs", "dev:renderer"]],
  ["node", ["./scripts/pnpmw.mjs", "dev:main:vite"]],
];

const children = [];
let shuttingDown = false;
let exitCode = 0;

function stopAll(signal = "SIGTERM") {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }

  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) {
        child.kill("SIGKILL");
      }
    }
  }, 5000).unref();
}

for (const [command, args] of commands) {
  const child = spawn(command, args, {
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    if (!shuttingDown) {
      if (signal || (code && code !== 0)) {
        exitCode = code ?? 1;
      }
      stopAll();
    }

    if (children.every((proc) => proc.exitCode !== null || proc.signalCode !== null)) {
      process.exit(exitCode);
    }
  });

  children.push(child);
}

process.on("SIGINT", () => stopAll("SIGINT"));
process.on("SIGTERM", () => stopAll("SIGTERM"));
