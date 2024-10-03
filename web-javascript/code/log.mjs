import { Queue } from "./Queue.mjs"; // import des Moduls "Queue.mjs"

const messages = new Queue();

export function log(...message) {
  if (messages.isEmpty()) {
    messages.enqueue(message);
  } else {
    message.unshift("\n");
    messages.last().push(...message);
  }
}

/**
 * @param {string} message The first part of the message.
 * @param {...string} args The rest of the message, which will be printed
 *       after the user has pressed enter.
 */
export function ilog(message, ...args) {
  messages.enqueue([message]);
  if (args.length > 0) {
    args.push("\n");
    messages.enqueue(args);
  }
}

export function done() {
  function printNextMessage() {
    if (messages.isEmpty()) {
      process.exit();
    }
    const args = messages.dequeue();
    for (let i = 0; i < args.length; i++) {
      process.stdout.write(String(args[i]));
      if (i < args.length - 1) process.stdout.write(" ");
    }
  }

  printNextMessage();
  process.stdin.on("data", printNextMessage);
}
