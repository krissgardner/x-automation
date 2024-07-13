import { Config } from "@/types";

export function shuffle<T extends any[]>(array: T) {
  const result = [...array];
  let index = result.length;
  let randIndex: number;

  while (index !== 0) {
    randIndex = Math.floor(Math.random() * index);
    index--;

    // And swap it with the current element.
    [result[index], result[randIndex]] = [result[randIndex], result[index]];
  }

  return result;
}

export async function waitUntil(
  condition: () => boolean,
  timeout = 1000,
): Promise<void> {
  return await new Promise((resolve) => {
    const interval = setInterval(() => {
      if (condition()) {
        resolve();
        clearInterval(interval);
      }
    }, timeout);
  });
}

export function delay(time: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

export function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const setupProcess = () => {
  process.stdin.resume();

  function exitHandler(options: { exit?: boolean }, exitCode = 0) {
    if (exitCode || exitCode === 0) {
      console.log(`Exited with code ${exitCode}`);
    }
    if (options?.exit) {
      process.exit();
    }
  }

  process.on("uncaughtException", (error) => {
    console.error("Unhandled exception:", error);
  });

  process.on("exit", exitHandler.bind(null));
  process.on("SIGINT", exitHandler.bind(null, { exit: true }));
  process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
  process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));
};

export const getDeltaInMilliseconds = (dmFilters: Config["dmFilters"]) => {
  if (!dmFilters) {
    return 0;
  }
  const { days, hours, minutes } = dmFilters;

  const totalDays = Number(days) || 0;
  const totalHours = totalDays * 24 + (Number(hours) || 0);
  const totalMinutes = totalHours * 60 + (Number(minutes) || 0);
  return totalMinutes * 60 * 1000;
};
