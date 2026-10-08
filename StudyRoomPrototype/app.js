// app.js
import { User, Room } from "./backend/models.js";
import { InMemoryStorage } from "./backend/storage.js";
import { StudyRoomService } from "./backend/service.js";

const out = document.getElementById("out");
function print(msg) {
  const d = document.createElement("div");
  d.textContent = msg;
  out.appendChild(d);
}

function getVal(id) {
  return document.getElementById(id)?.value?.trim() ?? "";
}

// like 2030-01-01T10:00
function toISOStringOrThrow(raw, label) {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid ${label} date/time`);
  return d.toISOString();
}

const storage = new InMemoryStorage();
const service = new StudyRoomService(storage);

document.getElementById("seedBtn").addEventListener("click", () => {
  out.innerHTML = "";
  try {
    service.createUser(new User("u1", "Kai Wong", "kwong@scu.edu", "STUDENT"));
    service.createUser(new User("u2", "Kate Picca", "kpicca@scu.edu", "STUDENT"));
    service.createUser(new User("u3", "Tess Wei", "twei@scu.edu", "STUDENT"));

    const r = new Room("r1", "SCDI 3301", "SCDI", 6);
    r.addFeature("Whiteboard");
    r.addFeature("Projector");
    service.createRoom(r);

    print("Seeded: 3 users, 1 room (SCDI 3301)");
  } catch (e) {
    print(`ERROR: ${e.message}`);
  }
});

document.getElementById("reserveBtn").addEventListener("click", () => {
  out.innerHTML = "";

  try {
    const resId = getVal("resId") || "res1";
    const userId = getVal("userId") || "u1";
    const roomId = getVal("roomId") || "r1";

    const rawStart = getVal("start");
    const rawEnd = getVal("end");

    // Default times if blanks 
    const start = rawStart
      ? toISOStringOrThrow(rawStart, "start")
      : new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const end = rawEnd
      ? toISOStringOrThrow(rawEnd, "end")
      : new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const res = service.createReservation(resId, userId, roomId, start, end);

    print(`Created reservation ${res.id} for ${res.user.name} in ${res.room.name}`);
    print(`Start: ${res.start}`);
    print(`End:   ${res.end}`);
    print(`Status: ${res.status}`);
  } catch (e) {
    print(`ERROR: ${e.message}`);
  }
});

document.getElementById("cancelBtn").addEventListener("click", () => {
  out.innerHTML = "";
  try {
    const resId = getVal("resId") || "res1";
    const res = service.cancelReservation(resId);
    print(`Cancelled reservation ${res.id}`);
    print(`Status: ${res.status}`);
  } catch (e) {
    print(`ERROR: ${e.message}`);
  }
});

document.getElementById("showBtn").addEventListener("click", () => {
  out.innerHTML = "";

  print(`Users: ${storage.getUsers().length}`);
  for (const u of storage.getUsers()) print(`- ${u.id}: ${u.name} (${u.email})`);

  print(`Rooms: ${storage.getRooms().length}`);
  for (const r of storage.getRooms()) print(`- ${r.id}: ${r.name} cap=${r.capacity}`);

  print(`Reservations: ${storage.getReservations().length}`);
  for (const r of storage.getReservations()) {
    print(`- ${r.id}: room=${r.room.id} user=${r.user.id} status=${r.status}`);
  }
});
