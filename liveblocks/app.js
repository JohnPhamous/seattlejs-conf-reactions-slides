import { createClient } from "@liveblocks/client";

const client = createClient({
  publicApiKey:
    "pk_prod_1ldya0i9DsODeO_tunLqa7zJRkEsLLYngizzm_2o_5VZIuhocIgX_B3zYU5DhWKY",
});

function generateRandomId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

function removeStaleReactions() {
  window.reactions.remoteReactions = window.reactions.remoteReactions.filter(
    (reaction) => {
      const delta = (new Date().getTime() - reaction.timestamp) / 1000;

      return delta < 2 + 2;
    }
  );
}

const generateRandomCurveForReaction = () => {
  const randomX1 = `100%`;
  const randomY1 = `100%`;
  const randomX2 = `${Math.random() * 5}%`;
  const randomY2 = `${Math.random() * 50 + 50}%`;

  return `cubic-bezier(${randomX1}, ${randomY1}, ${randomX2}, ${randomY2})`;
};

const getStartingAngleForReaction = () => {
  // Decide on whether the reaction is facing left or right.
  const direction = Math.random() < 0.5 ? 1 : -1;
  // Decide the starting angle of the reaction.
  const startingAngle = Math.floor(Math.random() * 90);

  return direction * startingAngle;
};

let room;

async function getStats() {
  const storage = await room.getStorage();
  const fireReactions = storage.root.get("fireReactions").length;
  const heartReactions = storage.root.get("heartReactions").length;
  const octopusReactions = storage.root.get("octopusReactions").length;
  const clapReactions = storage.root.get("clapReactions").length;

  const fireDOM = document.getElementById("fire-stat");
  const heartDOM = document.getElementById("heart-stat");
  const octopusDOM = document.getElementById("octopus-stat");
  const clapDOM = document.getElementById("clap-stat");

  if (fireDOM) {
    fireDOM.innerText = `🔥 ${fireReactions.toLocaleString()}`;
  }
  if (heartDOM) {
    heartDOM.innerText = `❤️ ${heartReactions.toLocaleString()}`;
  }
  if (octopusDOM) {
    octopusDOM.innerText = `🐙 ${octopusReactions.toLocaleString()}`;
  }
  if (clapDOM) {
    clapDOM.innerText = `👏 ${clapReactions.toLocaleString()}`;
  }
}

function run() {
  room = client.enter("seattlejs-conf-audience", {
    initialPresence: {},
  });

  window.reactions = {
    react: undefined,
    remoteReactions: [],
    finish: undefined,
    getStartingAngleForReaction,
    generateRandomCurveForReaction,
    getStats,
  };

  window.reactions.react = (id) => {
    let emoji = "";

    switch (id) {
      case "heart":
        emoji = "❤️";
        break;
      case "fire":
        emoji = "🔥";
        break;
      case "octopus":
        emoji = "🐙";
        break;
      case "clap":
        emoji = "👏";
        break;
    }

    if (emoji !== "")
      room.broadcastEvent({ type: "reaction", emoji, emojiId: id });
  };

  window.reactions.finish = () => {
    room.broadcastEvent({ type: "finish" });
  };

  room.subscribe("event", ({ event }) => {
    removeStaleReactions();
    if (event.type === "reaction") {
      window.reactions.remoteReactions.push({
        id: generateRandomId(),
        emojiId: event.emojiId,
        type: event.emoji,
        shown: false,
        timestamp: new Date().getTime(),
        curve: generateRandomCurveForReaction(),
        startingAngle: getStartingAngleForReaction(),
        x: Math.random() * window.innerWidth - 100,
      });
    }
  });
}

run();

function loop() {
  const reactionsContainer = document.querySelector("#reactions-container");
  const newDOMElements = document.createDocumentFragment();
  if (window.reactions !== undefined) {
    window.reactions.remoteReactions.forEach((reaction) => {
      const delta = (new Date().getTime() - reaction.timestamp) / 1000;
      if (reaction.shown && delta > 2) {
        const staleReaction = document.getElementById(reaction.id);
        if (staleReaction) staleReaction.remove();
      }

      if (reaction.shown === false) {
        reaction.shown = true;
        let div = document.createElement("div");
        div.className = "no-interaction reaction";
        div.textContent = reaction.type;
        div.id = reaction.id;
        div.style.animationTimingFunction = reaction.curve;
        div.style.setProperty(
          "--starting-angle",
          reaction.startingAngle + "deg"
        );
        div.style.setProperty("--animation-duration", "2s");
        div.style.setProperty("--travel-distance", "-15vh");
        div.style.setProperty("--x-position", reaction.x + "px");
        div.style.animationName = "travel";
        newDOMElements.appendChild(div);
      }
    });
  }
  if (reactionsContainer) {
    reactionsContainer.appendChild(newDOMElements);
  }

  getStats();

  requestAnimationFrame(loop);
}
loop();
