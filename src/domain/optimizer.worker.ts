import { optimize } from "./optimizer";
self.onmessage = (event: MessageEvent) => {
  try {
    self.postMessage({ result: optimize(event.data) });
  } catch (error) {
    self.postMessage({
      error:
        error instanceof Error
          ? error.message
          : "Unable to calculate this plan.",
    });
  }
};
