import { User, Room } from "./backend/models.js";
import { InMemoryStorage } from "./backend/storage.js";
import { StudyRoomService } from "./backend/service.js";

const out = document.getElementById("adminOut");
function clearOut() { out.innerHTML = ""; }
function line(msg) {
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

function seedDemoData() {
  // Users
  service.createUser(new User("a1", "Admin (Prof. Rivera)", "admin@scu.edu", "ADMIN"));
  service.createUser(new User("u1", "Kai Wong", "kwong@scu.edu", "STUDENT"));
  service.createUser(new User("u2", "Kate Picca", "kpicca@scu.edu", "STUDENT"));
  service.createUser(new User("u3", "Tess Wei", "twei@scu.edu", "STUDENT"));

  // Rooms
  const r1 = new Room("r1", "SCDI 3301", "SCDI", 6);
  r1.addFeature("Whiteboard");
  r1.addFeature("Projector");
  service.createRoom(r1);

  const r2 = new Room("r2", "SCDI 1302", "SCDI", 10);
  r2.addFeature("Whiteboard");
  service.createRoom(r2);
}

function renderSnapshot() {
  line("--- USERS ---");
  for (const u of storage.getUsers()) {
    line(`- ${u.id}: ${u.name} (${u.role})`);
  }

  line("\n--- ROOMS ---");
  for (const r of storage.getRooms()) {
    line(`- ${r.id}: ${r.name} (${r.building}) cap=${r.capacity}`);
  }

  line("\n--- PUBLIC RESERVATIONS (ACTIVE) ---");
  const pubs = service.listPublicReservations();
  if (pubs.length === 0) {
    line("(none yet)");
  }
  for (const res of pubs) {
    const members = res.getParticipants().map(u => u.id).join(", ");
    line(`- ${res.id}: ${res.room.name} | ${res.getTopicOrClass()} | ${res.start} → ${res.end}`);
    line(`  owner=${res.owner.id} participants(${res.getParticipants().length}/${res.getMaxParticipants()}): [${members}]`);
  }
}

function handleSeed() {
  clearOut();
  try {
    seedDemoData();
    line("Seeded admin + 3 students + 2 rooms.");
    renderSnapshot();
  } catch (e) {
    line(`ERROR: ${e.message}`);
  }
}

function handleCreatePublic() {
  clearOut();
  try {
    const resId = getVal("a_resId") || `classRes_${Date.now()}`;
    const adminId = getVal("a_adminId") || "a1";
    const roomId = getVal("a_roomId") || "r1";

    const rawStart = getVal("a_start");
    const rawEnd = getVal("a_end");

    const start = rawStart
      ? toISOStringOrThrow(rawStart, "start")
      : new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const end = rawEnd
      ? toISOStringOrThrow(rawEnd, "end")
      : new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const topic = getVal("a_topic") || "Class Session";
    const maxRaw = getVal("a_max");
    const max = maxRaw ? Number(maxRaw) : null;

    const res = service.createPublicClassReservation(resId, adminId, roomId, start, end, topic, max);

    line(`Created PUBLIC reservation ${res.id} for ${res.room.name}`);
    line(`Topic/Class: ${res.getTopicOrClass()}`);
    line(`Owner: ${res.owner.name} (${res.owner.id})`);
    line(`Window: ${res.start} → ${res.end}`);
    line(`Seats: ${res.getParticipants().length}/${res.getMaxParticipants()}`);

    renderSnapshot();
  } catch (e) {
    line(`ERROR: ${e.message}`);
  }
}

function handleAdminAdd() {
  clearOut();
  try {
    const resId = getVal("m_resId");
    const adminId = getVal("m_adminId");
    const studentId = getVal("m_studentId");
    service.adminAddStudent(resId, adminId, studentId);
    line(`Admin added ${studentId} to ${resId}.`);
    renderSnapshot();
  } catch (e) {
    line(`ERROR: ${e.message}`);
  }
}

function handleAdminRemove() {
  clearOut();
  try {
    const resId = getVal("m_resId");
    const adminId = getVal("m_adminId");
    const studentId = getVal("m_studentId");
    service.adminRemoveStudent(resId, adminId, studentId);
    line(`Admin removed ${studentId} from ${resId}.`);
    renderSnapshot();
  } catch (e) {
    line(`ERROR: ${e.message}`);
  }
}

function handleStudentJoin() {
  clearOut();
  try {
    const resId = getVal("m_resId");
    const studentId = getVal("m_studentId");
    service.joinPublicReservation(resId, studentId);
    line(`Student ${studentId} joined ${resId}.`);
    renderSnapshot();
  } catch (e) {
    line(`ERROR: ${e.message}`);
  }
}

function handleRefresh() {
  clearOut();
  renderSnapshot();
}

document.getElementById("seedAdminBtn").addEventListener("click", handleSeed);
document.getElementById("createPublicBtn").addEventListener("click", handleCreatePublic);
document.getElementById("adminAddBtn").addEventListener("click", handleAdminAdd);
document.getElementById("adminRemoveBtn").addEventListener("click", handleAdminRemove);
document.getElementById("studentJoinBtn").addEventListener("click", handleStudentJoin);
document.getElementById("refreshBtn").addEventListener("click", handleRefresh);
