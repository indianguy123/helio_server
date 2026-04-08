import Agenda from "agenda";

let agendaInstance = null;

export function getAgenda() {
  if (!agendaInstance) {
    agendaInstance = new Agenda({
      db: { address: process.env.MONGO_URI, collection: "agendaJobs" },
      processEvery: "10 seconds",
    });
  }
  return agendaInstance;
}

export async function startAgenda() {
  await import("../workers/analysisWorker.js");
  await getAgenda().start();
}

export default getAgenda;
